package com.example.backendpos.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PaymentResponse {
    private Long id;
    private Long orderId;
    private String orderNo;
    private String tableNo;
    private Long posSessionId;
    private String paymentMethodName;
    private String paymentMethodCode;
    private BigDecimal amount;
    private String paymentStatus;
    private String referenceNo;
    private String receivedByName;
    private LocalDateTime paidAt;
}
