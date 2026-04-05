package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.*;
import com.example.backendpos.dto.response.KitchenTicketResponse;
import com.example.backendpos.entity.*;
import com.example.backendpos.enums.*;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.KitchenNotificationService;
import com.example.backendpos.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class OrderServiceImpl implements OrderService {
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final ProductRepository productRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository tableRepository;
    private final PosSessionRepository sessionRepository;
    private final UserRepository userRepository;
    private final KitchenTicketRepository kitchenTicketRepository;
    private final KitchenTicketItemRepository kitchenTicketItemRepository;
    private final KitchenNotificationService kitchenNotificationService;
    private final PaymentRepository paymentRepository;
    private final ProductVariantRepository variantRepository;
    private final ProductToppingRepository toppingRepository;

    /**
     * Public endpoint — no auth required.
     * Customer scans QR → sees menu → places order.
     * QR encodes restaurantId + tableId (which maps to a floor).
     * Order starts as DRAFT + PENDING, waiter must confirm.
     */
    @Override
    @Transactional
    public OrderResponse createOrder(OrderCreateRequest request) {
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));

        RestaurantTable table = tableRepository.findById(request.getTableId())
            .orElseThrow(() -> new ResourceNotFoundException("Table", "id", request.getTableId()));
        if (!table.getRestaurant().getId().equals(restaurant.getId()))
            throw new BadRequestException("Table does not belong to this restaurant");
        if (!table.getActive())
            throw new BadRequestException("Table is not active");

        // Generate order number: ORD-YYYYMMDD-XXXX
        String prefix = "ORD-" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd")) + "-";
        int nextNum = orderRepository.findMaxOrderNo(prefix) + 1;
        String orderNo = prefix + String.format("%04d", nextNum);

        Order order = Order.builder()
            .restaurant(restaurant).orderNo(orderNo)
            .table(table).sourceType(SourceType.DINE_IN)
            .status(OrderStatus.DRAFT)
            .confirmationStatus(ConfirmationStatus.PENDING)
            .customerName(request.getCustomerName())
            .customerPhone(request.getCustomerPhone())
            .build();

        // Mark table as occupied
        table.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(table);

        // Link session if provided
        if (request.getPosSessionId() != null) {
            PosSession session = sessionRepository.findById(request.getPosSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getPosSessionId()));
            if (session.getStatus() != SessionStatus.OPEN)
                throw new BadRequestException("POS session is not open");
            order.setPosSession(session);
        }

        order = orderRepository.save(order);

        // Create items and calculate totals
        BigDecimal subtotal = BigDecimal.ZERO;
        BigDecimal totalTax = BigDecimal.ZERO;
        List<OrderItem> items = new ArrayList<>();

        for (OrderItemRequest itemReq : request.getItems()) {
            Product product = productRepository.findById(itemReq.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product", "id", itemReq.getProductId()));
            if (!product.getActive()) throw new BadRequestException("Product is not active: " + product.getName());
            if (!product.getRestaurant().getId().equals(restaurant.getId()))
                throw new BadRequestException("Product does not belong to this restaurant");

            // Base price (adjusted by variant if selected)
            BigDecimal unitPrice = product.getPrice();
            ProductVariant variant = null;
            if (itemReq.getVariantId() != null) {
                variant = variantRepository.findById(itemReq.getVariantId())
                    .orElseThrow(() -> new ResourceNotFoundException("Variant", "id", itemReq.getVariantId()));
                if (!variant.getProduct().getId().equals(product.getId()))
                    throw new BadRequestException("Variant does not belong to this product");
                unitPrice = unitPrice.add(variant.getPriceAdjustment());
            }

            // Toppings price
            BigDecimal toppingsTotal = BigDecimal.ZERO;
            StringBuilder toppingNames = new StringBuilder();
            if (itemReq.getToppingIds() != null && !itemReq.getToppingIds().isEmpty()) {
                for (Long toppingId : itemReq.getToppingIds()) {
                    ProductTopping topping = toppingRepository.findById(toppingId)
                        .orElseThrow(() -> new ResourceNotFoundException("Topping", "id", toppingId));
                    if (!topping.getProduct().getId().equals(product.getId()))
                        throw new BadRequestException("Topping does not belong to this product");
                    toppingsTotal = toppingsTotal.add(topping.getPrice());
                    if (!toppingNames.isEmpty()) toppingNames.append(", ");
                    toppingNames.append(topping.getName());
                }
            }

            BigDecimal itemPrice = unitPrice.add(toppingsTotal);
            BigDecimal lineSubtotal = itemPrice.multiply(BigDecimal.valueOf(itemReq.getQty()));
            BigDecimal lineTax = lineSubtotal.multiply(product.getTaxRate())
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            BigDecimal lineTotal = lineSubtotal.add(lineTax);

            OrderItem item = OrderItem.builder()
                .order(order).product(product).variant(variant).qty(itemReq.getQty())
                .unitPrice(unitPrice).toppingsPrice(toppingsTotal)
                .selectedToppings(toppingNames.isEmpty() ? null : toppingNames.toString())
                .taxAmount(lineTax).lineTotal(lineTotal).notes(itemReq.getNotes()).build();
            items.add(item);

            subtotal = subtotal.add(lineSubtotal);
            totalTax = totalTax.add(lineTax);
        }
        orderItemRepository.saveAll(items);
        order.setItems(items);
        order.setSubtotal(subtotal);
        order.setTaxAmount(totalTax);
        order.setTotalAmount(subtotal.add(totalTax));
        order = orderRepository.save(order);

        // Notify waiter via WebSocket about new order
        kitchenNotificationService.notifyNewOrder(restaurant.getId(), toResponse(order));

        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse confirmOrder(Long orderId, Long waiterId) {
        Order order = findOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED)
            throw new BadRequestException("Cannot confirm a cancelled order");
        if (order.getConfirmationStatus() == ConfirmationStatus.CONFIRMED)
            throw new BadRequestException("Order is already confirmed");

        User waiter = userRepository.findById(waiterId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", waiterId));
        order.setWaiter(waiter);
        order.setConfirmationStatus(ConfirmationStatus.CONFIRMED);
        order.setStatus(OrderStatus.CONFIRMED);
        order = orderRepository.save(order);
        kitchenNotificationService.notifyOrderStatusChange(
            order.getRestaurant().getId(), order.getId(), order.getOrderNo(), "CONFIRMED");
        return toResponse(order);
    }

    @Override
    @Transactional
    public OrderResponse rejectOrder(Long orderId, Long waiterId) {
        Order order = findOrder(orderId);
        if (order.getConfirmationStatus() != ConfirmationStatus.PENDING)
            throw new BadRequestException("Only pending orders can be rejected");

        User waiter = userRepository.findById(waiterId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", waiterId));
        order.setWaiter(waiter);
        order.setConfirmationStatus(ConfirmationStatus.REJECTED);
        order.setStatus(OrderStatus.CANCELLED);
        releaseTable(order);
        return toResponse(orderRepository.save(order));
    }

    @Override
    @Transactional
    public OrderResponse sendToKitchen(Long orderId) {
        Order order = findOrder(orderId);
        if (order.getConfirmationStatus() != ConfirmationStatus.CONFIRMED)
            throw new BadRequestException("Order must be confirmed before sending to kitchen");
        if (order.getStatus() == OrderStatus.IN_KITCHEN)
            throw new BadRequestException("Order is already in kitchen");

        // Fetch items with products eagerly loaded
        List<OrderItem> orderItems = orderItemRepository.findByOrderIdWithProduct(orderId);

        // Create kitchen ticket
        KitchenTicket ticket = KitchenTicket.builder()
            .order(order).restaurant(order.getRestaurant()).build();
        ticket = kitchenTicketRepository.save(ticket);

        List<KitchenTicketItem> ticketItems = new ArrayList<>();
        for (OrderItem item : orderItems) {
            if (Boolean.TRUE.equals(item.getProduct().getKitchenEnabled())
                    && item.getItemStatus() != ItemStatus.CANCELLED) {
                item.setItemStatus(ItemStatus.SENT_TO_KITCHEN);
                orderItemRepository.save(item);
                ticketItems.add(KitchenTicketItem.builder()
                    .kitchenTicket(ticket).orderItem(item).build());
            }
        }
        // If no kitchen-enabled items, send all non-cancelled items (e.g. beverages)
        if (ticketItems.isEmpty()) {
            for (OrderItem item : orderItems) {
                if (item.getItemStatus() != ItemStatus.CANCELLED) {
                    item.setItemStatus(ItemStatus.SENT_TO_KITCHEN);
                    orderItemRepository.save(item);
                    ticketItems.add(KitchenTicketItem.builder()
                        .kitchenTicket(ticket).orderItem(item).build());
                }
            }
        }
        if (ticketItems.isEmpty())
            throw new BadRequestException("Order has no items to send to kitchen");
        kitchenTicketItemRepository.saveAll(ticketItems);
        ticket.setTicketItems(ticketItems);

        // Notify kitchen via WebSocket
        kitchenNotificationService.notifyNewTicket(order.getRestaurant().getId(), toTicketResponse(ticket));

        order.setStatus(OrderStatus.IN_KITCHEN);
        order = orderRepository.save(order);
        kitchenNotificationService.notifyOrderStatusChange(
            order.getRestaurant().getId(), order.getId(), order.getOrderNo(), "IN_KITCHEN");
        return toResponse(order);
    }

    private KitchenTicketResponse toTicketResponse(KitchenTicket t) {
        var items = t.getTicketItems().stream().map(i ->
            KitchenTicketResponse.KitchenItemResponse.builder()
                .id(i.getId())
                .productName(i.getOrderItem().getProduct().getName())
                .qty(i.getOrderItem().getQty())
                .prepStatus(i.getPrepStatus().name())
                .preparedAt(i.getPreparedAt()).build()
        ).toList();
        return KitchenTicketResponse.builder()
            .id(t.getId()).orderId(t.getOrder().getId()).orderNo(t.getOrder().getOrderNo())
            .tableNo(t.getOrder().getTable() != null ? t.getOrder().getTable().getTableNo() : null)
            .chefName(t.getChef() != null ? t.getChef().getFullName() : null)
            .ticketStatus(t.getTicketStatus().name())
            .sentAt(t.getSentAt()).startedAt(t.getStartedAt()).completedAt(t.getCompletedAt())
            .items(items).build();
    }

    @Override @Transactional
    public OrderResponse markReady(Long orderId) {
        Order order = findOrder(orderId);
        if (order.getStatus() != OrderStatus.IN_KITCHEN)
            throw new BadRequestException("Order must be IN_KITCHEN to mark as ready");
        order.setStatus(OrderStatus.READY);
        return toResponse(orderRepository.save(order));
    }

    @Override @Transactional
    public OrderResponse requestPayment(Long orderId) {
        Order order = findOrder(orderId);
        if (order.getStatus() != OrderStatus.READY)
            throw new BadRequestException("Order must be READY to request payment");
        // Release table — customer is done, waiter served food
        releaseTable(order);
        OrderResponse response = toResponse(order);
        // Notify cashier via WebSocket
        kitchenNotificationService.notifyPaymentRequest(order.getRestaurant().getId(), response);
        return response;
    }

    @Override @Transactional
    public OrderResponse completeOrder(Long orderId) {
        Order order = findOrder(orderId);
        if (order.getStatus() == OrderStatus.CANCELLED)
            throw new BadRequestException("Cannot complete a cancelled order");
        order.setStatus(OrderStatus.COMPLETED);
        releaseTable(order);
        return toResponse(orderRepository.save(order));
    }

    @Override @Transactional
    public OrderResponse cancelOrder(Long orderId) {
        Order order = findOrder(orderId);
        if (order.getStatus() == OrderStatus.COMPLETED)
            throw new BadRequestException("Cannot cancel a completed order");
        order.setStatus(OrderStatus.CANCELLED);
        order.getItems().forEach(item -> {
            item.setItemStatus(ItemStatus.CANCELLED);
            orderItemRepository.save(item);
        });
        releaseTable(order);
        return toResponse(orderRepository.save(order));
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getOrder(Long orderId) { return toResponse(findOrder(orderId)); }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurant(Long restaurantId) {
        return orderRepository.findByRestaurantIdAndCreatedAtBetween(restaurantId,
            LocalDate.now().atStartOfDay(), LocalDate.now().plusDays(1).atStartOfDay())
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurantDateRange(Long restaurantId, LocalDate from, LocalDate to) {
        if (from == null) from = LocalDate.now().minusMonths(1);
        if (to == null) to = LocalDate.now();
        return orderRepository.findByRestaurantIdAndCreatedAtBetween(restaurantId,
            from.atStartOfDay(), to.plusDays(1).atStartOfDay())
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByRestaurantAndStatus(Long restaurantId, String status) {
        OrderStatus orderStatus;
        try { orderStatus = OrderStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) { throw new BadRequestException("Invalid status: " + status); }
        return orderRepository.findByRestaurantIdAndStatus(restaurantId, orderStatus)
            .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersBySession(Long sessionId) {
        return orderRepository.findByPosSessionId(sessionId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getOrdersByTable(Long tableId) {
        return orderRepository.findByTableIdAndStatusNot(tableId, OrderStatus.COMPLETED)
            .stream().map(this::toResponse).toList();
    }

    private Order findOrder(Long orderId) {
        return orderRepository.findById(orderId)
            .orElseThrow(() -> new ResourceNotFoundException("Order", "id", orderId));
    }

    private void releaseTable(Order order) {
        if (order.getTable() != null) {
            RestaurantTable table = order.getTable();
            List<Order> activeOrders = orderRepository.findByTableIdAndStatusNot(table.getId(), OrderStatus.COMPLETED);
            activeOrders.removeIf(o -> o.getStatus() == OrderStatus.CANCELLED || o.getId().equals(order.getId()));
            if (activeOrders.isEmpty()) {
                table.setStatus(TableStatus.AVAILABLE);
                tableRepository.save(table);
            }
        }
    }

    private OrderResponse toResponse(Order o) {
        List<OrderItemResponse> itemResponses = o.getItems().stream().map(i ->
            OrderItemResponse.builder()
                .id(i.getId()).productId(i.getProduct().getId())
                .productName(i.getProduct().getName())
                .variantName(i.getVariant() != null ? i.getVariant().getName() : null)
                .selectedToppings(i.getSelectedToppings())
                .qty(i.getQty())
                .unitPrice(i.getUnitPrice())
                .toppingsPrice(i.getToppingsPrice())
                .taxAmount(i.getTaxAmount())
                .lineTotal(i.getLineTotal()).itemStatus(i.getItemStatus().name())
                .notes(i.getNotes()).build()
        ).toList();

        // Calculate payment info
        BigDecimal paidAmount = paymentRepository.sumByOrderIdAndStatus(o.getId(), PaymentStatus.SUCCESS);
        BigDecimal remaining = o.getTotalAmount().subtract(paidAmount).max(BigDecimal.ZERO);

        String payStatus;
        if (paidAmount.compareTo(BigDecimal.ZERO) == 0) {
            payStatus = "UNPAID";
        } else if (remaining.compareTo(BigDecimal.ZERO) > 0) {
            payStatus = "PARTIAL";
        } else {
            payStatus = "PAID";
        }

        return OrderResponse.builder()
            .id(o.getId()).orderNo(o.getOrderNo())
            .restaurantId(o.getRestaurant().getId()).restaurantName(o.getRestaurant().getName())
            .tableId(o.getTable() != null ? o.getTable().getId() : null)
            .tableNo(o.getTable() != null ? o.getTable().getTableNo() : null)
            .floorName(o.getTable() != null && o.getTable().getFloor() != null
                ? o.getTable().getFloor().getName() : null)
            .posSessionId(o.getPosSession() != null ? o.getPosSession().getId() : null)
            .sourceType(o.getSourceType().name()).status(o.getStatus().name())
            .confirmationStatus(o.getConfirmationStatus().name())
            .customerName(o.getCustomerName())
            .customerPhone(o.getCustomerPhone())
            .waiterName(o.getWaiter() != null ? o.getWaiter().getFullName() : null)
            .cashierName(o.getCashier() != null ? o.getCashier().getFullName() : null)
            .subtotal(o.getSubtotal()).taxAmount(o.getTaxAmount()).totalAmount(o.getTotalAmount())
            .paidAmount(paidAmount).remainingAmount(remaining).paymentStatus(payStatus)
            .createdAt(o.getCreatedAt()).items(itemResponses).build();
    }
}
