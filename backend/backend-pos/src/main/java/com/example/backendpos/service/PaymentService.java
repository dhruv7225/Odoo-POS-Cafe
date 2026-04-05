package com.example.backendpos.service;

import com.example.backendpos.dto.request.PaymentRequest;
import com.example.backendpos.dto.response.PaymentResponse;

import java.util.List;

public interface PaymentService {
    /** Cash payment — immediate SUCCESS */
    PaymentResponse collectCashPayment(PaymentRequest request);
    /** Online payment (Razorpay/Card/UPI) — creates PENDING, resolved after Razorpay callback */
    PaymentResponse createPendingPayment(PaymentRequest request);
    /** Confirm a pending payment (after Razorpay verification) */
    PaymentResponse confirmPayment(Long paymentId, String referenceNo);
    PaymentResponse failPayment(Long paymentId);
    List<PaymentResponse> getPaymentsByOrder(Long orderId);
    List<PaymentResponse> getPaymentsBySession(Long sessionId);
    /** Get all unpaid READY orders for a restaurant (for cashier dashboard) */
    List<PaymentResponse> getPaymentsByRestaurant(Long restaurantId);
}
