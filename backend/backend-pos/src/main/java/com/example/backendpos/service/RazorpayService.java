package com.example.backendpos.service;

import com.example.backendpos.dto.request.RazorpayOrderRequest;
import com.example.backendpos.dto.request.RazorpayVerifyRequest;
import com.example.backendpos.entity.Payment;
import com.example.backendpos.enums.PaymentStatus;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.PaymentRepository;
import com.razorpay.Order;
import com.razorpay.RazorpayClient;
import com.razorpay.RazorpayException;
import com.razorpay.Utils;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Service
@Slf4j
public class RazorpayService {
    private final RazorpayClient razorpayClient;
    private final PaymentRepository paymentRepository;

    @Value("${razorpay.key-secret:}")
    private String keySecret;

    @Autowired
    public RazorpayService(@Autowired(required = false) RazorpayClient razorpayClient,
                           PaymentRepository paymentRepository) {
        this.razorpayClient = razorpayClient;
        this.paymentRepository = paymentRepository;
    }

    private void ensureConfigured() {
        if (razorpayClient == null) {
            throw new BadRequestException("Razorpay is not configured. Add razorpay.key-id and razorpay.key-secret to application.properties");
        }
    }

    public Map<String, Object> createRazorpayOrder(RazorpayOrderRequest request) {
        ensureConfigured();

        try {
            long amountInPaise = request.getAmount().multiply(BigDecimal.valueOf(100)).longValue();

            JSONObject orderRequest = new JSONObject();
            orderRequest.put("amount", amountInPaise);
            orderRequest.put("currency", "INR");
            orderRequest.put("receipt", "rcpt_" + System.currentTimeMillis());

            JSONObject notes = new JSONObject();
            if (request.getOrderId() != null) notes.put("orderId", request.getOrderId());
            if (request.getBookingId() != null) notes.put("bookingId", request.getBookingId());
            notes.put("paymentType", request.getPaymentType());
            notes.put("restaurantId", request.getRestaurantId());
            orderRequest.put("notes", notes);

            Order razorpayOrder = razorpayClient.orders.create(orderRequest);

            return Map.of(
                "razorpayOrderId", razorpayOrder.get("id"),
                "amount", request.getAmount(),
                "currency", "INR",
                "status", razorpayOrder.get("status")
            );
        } catch (RazorpayException e) {
            log.error("Razorpay order creation failed", e);
            throw new BadRequestException("Razorpay order creation failed: " + e.getMessage());
        }
    }

    @Transactional
    public Payment verifyAndConfirmPayment(Long paymentId, RazorpayVerifyRequest verifyRequest) {
        ensureConfigured();

        Payment payment = paymentRepository.findById(paymentId)
            .orElseThrow(() -> new ResourceNotFoundException("Payment", "id", paymentId));

        if (payment.getPaymentStatus() != PaymentStatus.PENDING) {
            throw new BadRequestException("Payment is not in PENDING status");
        }

        try {
            JSONObject attributes = new JSONObject();
            attributes.put("razorpay_order_id", verifyRequest.getRazorpayOrderId());
            attributes.put("razorpay_payment_id", verifyRequest.getRazorpayPaymentId());
            attributes.put("razorpay_signature", verifyRequest.getRazorpaySignature());

            boolean isValid = Utils.verifyPaymentSignature(attributes, keySecret);
            if (!isValid) {
                payment.setPaymentStatus(PaymentStatus.FAILED);
                paymentRepository.save(payment);
                throw new BadRequestException("Invalid Razorpay signature");
            }
        } catch (RazorpayException e) {
            payment.setPaymentStatus(PaymentStatus.FAILED);
            paymentRepository.save(payment);
            throw new BadRequestException("Razorpay verification failed: " + e.getMessage());
        }

        // Only store reference — don't change status here.
        // PaymentServiceImpl.confirmPayment() will set SUCCESS + complete order + update session.
        payment.setReferenceNo(verifyRequest.getRazorpayPaymentId());
        return paymentRepository.save(payment);
    }
}
