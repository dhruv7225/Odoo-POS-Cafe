package com.example.backendpos.controller;

import com.example.backendpos.dto.request.PaymentRequest;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.dto.response.PaymentResponse;
import com.example.backendpos.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {
    private final PaymentService paymentService;

    /** Cash payment — immediate SUCCESS */
    @PostMapping("/cash")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> collectCash(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Cash payment collected", paymentService.collectCashPayment(request)));
    }

    /** Online payment (Razorpay/Card/UPI) — creates PENDING payment */
    @PostMapping("/online")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> createOnlinePayment(@Valid @RequestBody PaymentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(ApiResponse.ok("Payment initiated", paymentService.createPendingPayment(request)));
    }

    /** Confirm pending payment (after Razorpay verification) */
    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> confirm(
            @PathVariable Long id,
            @RequestParam(required = false) String referenceNo) {
        return ResponseEntity.ok(ApiResponse.ok("Payment confirmed",
            paymentService.confirmPayment(id, referenceNo)));
    }

    @PatchMapping("/{id}/fail")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<PaymentResponse>> fail(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok("Payment failed", paymentService.failPayment(id)));
    }

    @GetMapping("/order/{orderId}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getByOrder(@PathVariable Long orderId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentsByOrder(orderId)));
    }

    @GetMapping("/session/{sessionId}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<List<PaymentResponse>>> getBySession(@PathVariable Long sessionId) {
        return ResponseEntity.ok(ApiResponse.ok(paymentService.getPaymentsBySession(sessionId)));
    }
}
