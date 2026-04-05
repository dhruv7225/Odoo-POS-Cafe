package com.example.backendpos.dto.response;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class OrderItemResponse {
    private Long id;
    private Long productId;
    private String productName;
    private String variantName;
    private String selectedToppings;
    private Integer qty;
    private BigDecimal unitPrice;
    private BigDecimal toppingsPrice;
    private BigDecimal taxAmount;
    private BigDecimal lineTotal;
    private String itemStatus;
    private String notes;
}
