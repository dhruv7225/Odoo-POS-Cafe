package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.PaymentRequest;
import com.example.backendpos.dto.response.PaymentResponse;
import com.example.backendpos.entity.*;
import com.example.backendpos.enums.*;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.KitchenNotificationService;
import com.example.backendpos.service.PaymentService;
import com.example.backendpos.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class PaymentServiceImpl implements PaymentService {
    private final PaymentRepository paymentRepository;
    private final OrderRepository orderRepository;
    private final PosSessionRepository sessionRepository;
    private final PaymentMethodRepository paymentMethodRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;
    private final KitchenNotificationService notificationService;

    /**
     * Cash payment — cashier confirms physically, marked SUCCESS immediately.
     */
    @Override
    @Transactional
    public PaymentResponse collectCashPayment(PaymentRequest request) {
        Payment payment = buildAndValidatePayment(request);
        payment.setPaymentStatus(PaymentStatus.SUCCESS);
        payment = paymentRepository.save(payment);
        completeOrderAndUpdateSession(payment);
        return toResponse(payment);
    }

    /**
     * Online payment (Razorpay/Card/UPI) — creates PENDING payment.
     * Will be confirmed after Razorpay verification or cashier confirmation.
     */
    @Override
    @Transactional
    public PaymentResponse createPendingPayment(PaymentRequest request) {
        Payment payment = buildAndValidatePayment(request);
        payment.setPaymentStatus(PaymentStatus.PENDING);
        payment = paymentRepository.save(payment);
        return toResponse(payment);
    }

    /**
     * Confirm a pending payment (after Razorpay verification or manual confirmation).
     */
    @Override
    @Transactional
    public PaymentResponse confirmPayment(Long paymentId, String referenceNo) {
        Payment p = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        if (p.getPaymentStatus() != PaymentStatus.PENDING)
            throw new BadRequestException("Payment is not in PENDING status");
        p.setPaymentStatus(PaymentStatus.SUCCESS);
        if (referenceNo != null && !referenceNo.isBlank()) {
            p.setReferenceNo(referenceNo);
        }
        p = paymentRepository.save(p);
        completeOrderAndUpdateSession(p);
        return toResponse(p);
    }

    @Override
    @Transactional
    public PaymentResponse failPayment(Long paymentId) {
        Payment p = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));
        p.setPaymentStatus(PaymentStatus.FAILED);
        return toResponse(paymentRepository.save(p));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByOrder(Long orderId) {
        return paymentRepository.findByOrderId(orderId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsBySession(Long sessionId) {
        return paymentRepository.findByPosSessionId(sessionId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PaymentResponse> getPaymentsByRestaurant(Long restaurantId) {
        return paymentRepository.findByRestaurantIdAndPaidAtBetween(restaurantId,
            java.time.LocalDate.now().atStartOfDay(),
            java.time.LocalDate.now().plusDays(1).atStartOfDay())
            .stream().map(this::toResponse).toList();
    }

    // ---- helpers ----

    private Payment buildAndValidatePayment(PaymentRequest request) {
        Long cashierId = SecurityUtil.getCurrentUserId();
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        User cashier = userRepository.findById(cashierId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", cashierId));
        PaymentMethod method = paymentMethodRepository.findById(request.getPaymentMethodId())
            .orElseThrow(() -> new ResourceNotFoundException("PaymentMethod", "id", request.getPaymentMethodId()));
        Order order = orderRepository.findById(request.getOrderId())
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", request.getOrderId()));
        PosSession session = sessionRepository.findById(request.getPosSessionId())
            .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getPosSessionId()));

        if (!method.getActive())
            throw new BadRequestException("Payment method is not active");
        if (order.getStatus() == OrderStatus.CANCELLED)
            throw new BadRequestException("Cannot pay for a cancelled order");
        if (session.getStatus() != SessionStatus.OPEN)
            throw new BadRequestException("POS session is not open");

        // Validate amount matches remaining
        BigDecimal alreadyPaid = paymentRepository.sumByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCESS);
        BigDecimal remaining = order.getTotalAmount().subtract(alreadyPaid);
        if (remaining.compareTo(BigDecimal.ZERO) <= 0)
            throw new BadRequestException("Order is already fully paid");
        if (request.getAmount().compareTo(remaining) > 0)
            throw new BadRequestException("Amount exceeds remaining balance: " + remaining);

        return Payment.builder()
            .restaurant(restaurant).order(order).posSession(session)
            .paymentMethod(method).receivedBy(cashier)
            .amount(request.getAmount()).paymentType(PaymentType.ORDER)
            .referenceNo(request.getReferenceNo())
            .build();
    }

    private void completeOrderAndUpdateSession(Payment p) {
        // Update session total
        if (p.getPosSession() != null) {
            PosSession session = p.getPosSession();
            BigDecimal sessionTotal = paymentRepository.sumBySessionId(session.getId());
            session.setTotalSales(sessionTotal);
            sessionRepository.save(session);
        }

        // Link order to session + complete if fully paid
        if (p.getOrder() != null) {
            Order order = p.getOrder();
            // Link order to this session so it appears in session dashboard
            if (order.getPosSession() == null && p.getPosSession() != null) {
                order.setPosSession(p.getPosSession());
            }
            BigDecimal totalPaid = paymentRepository.sumByOrderIdAndStatus(order.getId(), PaymentStatus.SUCCESS);
            if (totalPaid.compareTo(order.getTotalAmount()) >= 0) {
                order.setStatus(OrderStatus.COMPLETED);
                order.setCashier(p.getReceivedBy());
                // Release table
                if (order.getTable() != null) {
                    RestaurantTable table = order.getTable();
                    table.setStatus(TableStatus.AVAILABLE);
                    tableRepository.save(table);
                }
                // Notify
                notificationService.notifyPaymentCompleted(
                    order.getRestaurant().getId(), order.getId(), order.getOrderNo());
            }
            orderRepository.save(order);
        }
    }

    private PaymentResponse toResponse(Payment p) {
        return PaymentResponse.builder()
            .id(p.getId())
            .orderId(p.getOrder() != null ? p.getOrder().getId() : null)
            .orderNo(p.getOrder() != null ? p.getOrder().getOrderNo() : null)
            .tableNo(p.getOrder() != null && p.getOrder().getTable() != null
                ? p.getOrder().getTable().getTableNo() : null)
            .posSessionId(p.getPosSession() != null ? p.getPosSession().getId() : null)
            .paymentMethodName(p.getPaymentMethod().getName())
            .paymentMethodCode(p.getPaymentMethod().getCode())
            .amount(p.getAmount())
            .paymentStatus(p.getPaymentStatus().name())
            .referenceNo(p.getReferenceNo())
            .receivedByName(p.getReceivedBy() != null ? p.getReceivedBy().getFullName() : null)
            .paidAt(p.getPaidAt())
            .build();
    }
}
