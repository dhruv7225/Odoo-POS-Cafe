package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderItemRequest {
    @NotNull private Long productId;
    private Long variantId;        // optional: selected variant
    private List<Long> toppingIds; // optional: selected toppings
    @NotNull @Min(1) private Integer qty;
    private String notes;
}
