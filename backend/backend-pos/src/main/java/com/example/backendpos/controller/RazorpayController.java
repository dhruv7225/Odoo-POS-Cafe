package com.example.backendpos.controller;

import com.example.backendpos.dto.request.RazorpayOrderRequest;
import com.example.backendpos.dto.request.RazorpayVerifyRequest;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.entity.Payment;
import com.example.backendpos.service.RazorpayService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/razorpay")
@RequiredArgsConstructor
public class RazorpayController {
    private final RazorpayService razorpayService;

    @PostMapping("/create-order")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Map<String, Object>>> createOrder(
            @Valid @RequestBody RazorpayOrderRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(razorpayService.createRazorpayOrder(request)));
    }

    @PostMapping("/verify/{paymentId}")
    @PreAuthorize("hasAnyRole('CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Payment>> verifyPayment(
            @PathVariable Long paymentId,
            @Valid @RequestBody RazorpayVerifyRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Payment verified",
            razorpayService.verifyAndConfirmPayment(paymentId, request)));
    }
}
