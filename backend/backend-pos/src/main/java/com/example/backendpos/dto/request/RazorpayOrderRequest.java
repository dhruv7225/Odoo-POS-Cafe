package com.example.backendpos.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RazorpayOrderRequest {
    @NotNull private Long restaurantId;
    private Long orderId;
    private Long bookingId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    @NotBlank private String paymentType;
}
