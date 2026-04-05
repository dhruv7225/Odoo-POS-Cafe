package com.example.backendpos.controller;

import com.example.backendpos.dto.request.OrderCreateRequest;
import com.example.backendpos.dto.response.*;
import com.example.backendpos.service.OrderService;
import com.example.backendpos.util.SecurityUtil;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/orders")
@RequiredArgsConstructor
public class OrderController {
    private final OrderService orderService;

    /**
     * PUBLIC — no auth required.
     * Customer scans QR → sees menu → places order with restaurantId + tableId from QR.
     * Order starts as DRAFT/PENDING — waiter must confirm.
     */
    @PostMapping
    public ResponseEntity<ApiResponse<OrderResponse>> create(@Valid @RequestBody OrderCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(orderService.createOrder(request)));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order confirmed by waiter", orderService.confirmOrder(id, SecurityUtil.getCurrentUserId())));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('WAITER')")
    public ResponseEntity<ApiResponse<OrderResponse>> reject(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order rejected", orderService.rejectOrder(id, SecurityUtil.getCurrentUserId())));
    }

    @PatchMapping("/{id}/send-to-kitchen")
    @PreAuthorize("hasAnyRole('CASHIER','WAITER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<OrderResponse>> sendToKitchen(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order sent to kitchen", orderService.sendToKitchen(id)));
    }

    @PatchMapping("/{id}/ready")
    @PreAuthorize("hasAnyRole('CHEF','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<OrderResponse>> markReady(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order marked ready", orderService.markReady(id)));
    }

    /** Waiter requests payment — notifies cashier via WebSocket, table released */
    @PatchMapping("/{id}/request-payment")
    @PreAuthorize("hasAnyRole('WAITER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<OrderResponse>> requestPayment(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Payment requested", orderService.requestPayment(id)));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasAnyRole('WAITER','CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<OrderResponse>> complete(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order completed", orderService.completeOrder(id)));
    }

    @PatchMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<OrderResponse>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Order cancelled", orderService.cancelOrder(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<OrderResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrder(id)));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('WAITER','CASHIER','ADMIN','MANAGER','CHEF')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getByRestaurant(
            @PathVariable Long restaurantId,
            @RequestParam(required = false) String status,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate from,
            @RequestParam(required = false) @org.springframework.format.annotation.DateTimeFormat(iso = org.springframework.format.annotation.DateTimeFormat.ISO.DATE) java.time.LocalDate to) {
        if (status != null && !status.isBlank()) {
            return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersByRestaurantAndStatus(restaurantId, status)));
        }
        if (from != null || to != null) {
            return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersByRestaurantDateRange(restaurantId, from, to)));
        }
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersByRestaurant(restaurantId)));
    }

    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersBySession(sessionId)));
    }

    @GetMapping("/table/{tableId}")
    @PreAuthorize("hasAnyRole('WAITER','CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<OrderResponse>>> getByTable(@PathVariable Long tableId) {
        return ResponseEntity.ok(ApiResponse.ok(orderService.getOrdersByTable(tableId)));
    }
}
