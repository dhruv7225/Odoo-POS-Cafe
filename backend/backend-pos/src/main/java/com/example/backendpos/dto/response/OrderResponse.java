package com.example.backendpos.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderResponse {
    private Long id;
    private String orderNo;
    private Long restaurantId;
    private String restaurantName;
    private Long tableId;
    private String tableNo;
    private String floorName;
    private Long posSessionId;
    private String sourceType;
    private String status;
    private String confirmationStatus;
    private String customerName;
    private String customerPhone;
    private String waiterName;
    private String cashierName;
    private BigDecimal subtotal;
    private BigDecimal taxAmount;
    private BigDecimal totalAmount;
    private BigDecimal paidAmount;
    private BigDecimal remainingAmount;
    private String paymentStatus; // UNPAID, PARTIAL, PAID
    private LocalDateTime createdAt;
    private List<OrderItemResponse> items;
}
