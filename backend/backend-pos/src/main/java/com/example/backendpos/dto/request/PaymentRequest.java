package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PaymentRequest {
    @NotNull private Long restaurantId;
    @NotNull(message = "Order ID is required")
    private Long orderId;
    @NotNull(message = "POS Session ID is required")
    private Long posSessionId;
    @NotNull private Long paymentMethodId;
    @NotNull @DecimalMin("0.01") private BigDecimal amount;
    private String referenceNo; // for card/UPI transactions
}
