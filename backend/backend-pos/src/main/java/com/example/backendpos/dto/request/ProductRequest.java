package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ProductRequest {
    @NotNull private Long restaurantId;
    @NotNull private Long categoryId;
    @NotBlank(message = "Product name is required")
    private String name;
    @NotNull @DecimalMin(value = "0.01", message = "Price must be positive")
    private BigDecimal price;
    private BigDecimal taxRate = BigDecimal.ZERO;
    private Boolean kitchenEnabled = true;
    private String description;
    private String imageUrl;
    private String glbUrl;
}
