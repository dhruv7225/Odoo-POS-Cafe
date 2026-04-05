package com.example.backendpos.service;

import com.example.backendpos.dto.response.KitchenTicketResponse;
import com.example.backendpos.dto.response.OrderResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class KitchenNotificationService {
    private final SimpMessagingTemplate messagingTemplate;

    public void notifyNewOrder(Long restaurantId, OrderResponse order) {
        log.debug("WS: New order {} for restaurant {}", order.getOrderNo(), restaurantId);
        messagingTemplate.convertAndSend("/topic/orders/" + restaurantId + "/new-order", order);
    }

    public void notifyNewTicket(Long restaurantId, KitchenTicketResponse ticket) {
        log.debug("WS: New kitchen ticket for restaurant {}", restaurantId);
        messagingTemplate.convertAndSend("/topic/kitchen/" + restaurantId + "/new-ticket", ticket);
    }

    public void notifyTicketUpdate(Long restaurantId, KitchenTicketResponse ticket) {
        log.debug("WS: Kitchen ticket {} updated to {}", ticket.getId(), ticket.getTicketStatus());
        messagingTemplate.convertAndSend("/topic/kitchen/" + restaurantId + "/ticket-update", ticket);
    }

    public void notifyOrderReady(Long restaurantId, Long orderId, String orderNo) {
        log.debug("WS: Order {} ready for restaurant {}", orderNo, restaurantId);
        messagingTemplate.convertAndSend("/topic/kitchen/" + restaurantId + "/order-ready",
            java.util.Map.of("orderId", orderId, "orderNo", orderNo));
    }

    /** Notify customer/all when order status changes (confirm, kitchen, ready) */
    public void notifyOrderStatusChange(Long restaurantId, Long orderId, String orderNo, String status) {
        log.debug("WS: Order {} status changed to {} for restaurant {}", orderNo, status, restaurantId);
        messagingTemplate.convertAndSend("/topic/orders/" + restaurantId + "/order-status",
            java.util.Map.of("orderId", orderId, "orderNo", orderNo, "status", status));
    }

    /** Notify cashier that an order needs payment collection */
    public void notifyPaymentRequest(Long restaurantId, OrderResponse order) {
        log.debug("WS: Payment request for order {} restaurant {}", order.getOrderNo(), restaurantId);
        messagingTemplate.convertAndSend("/topic/cashier/" + restaurantId + "/payment-request", order);
    }

    /** Notify all when payment is completed */
    public void notifyPaymentCompleted(Long restaurantId, Long orderId, String orderNo) {
        log.debug("WS: Payment completed for order {} restaurant {}", orderNo, restaurantId);
        messagingTemplate.convertAndSend("/topic/cashier/" + restaurantId + "/payment-completed",
            java.util.Map.of("orderId", orderId, "orderNo", orderNo));
    }
}
