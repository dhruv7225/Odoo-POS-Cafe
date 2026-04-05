package com.example.backendpos.service;

import com.example.backendpos.dto.request.OrderCreateRequest;
import com.example.backendpos.dto.response.OrderResponse;

import java.util.List;

public interface OrderService {
    OrderResponse createOrder(OrderCreateRequest request);
    OrderResponse confirmOrder(Long orderId, Long waiterId);
    OrderResponse rejectOrder(Long orderId, Long waiterId);
    OrderResponse sendToKitchen(Long orderId);
    OrderResponse markReady(Long orderId);
    OrderResponse requestPayment(Long orderId);
    OrderResponse completeOrder(Long orderId);
    OrderResponse cancelOrder(Long orderId);
    OrderResponse getOrder(Long orderId);
    List<OrderResponse> getOrdersByRestaurant(Long restaurantId);
    List<OrderResponse> getOrdersByRestaurantDateRange(Long restaurantId, java.time.LocalDate from, java.time.LocalDate to);
    List<OrderResponse> getOrdersByRestaurantAndStatus(Long restaurantId, String status);
    List<OrderResponse> getOrdersBySession(Long sessionId);
    List<OrderResponse> getOrdersByTable(Long tableId);
}
