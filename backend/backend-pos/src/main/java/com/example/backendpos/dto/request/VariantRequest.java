package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class VariantRequest {
    @NotBlank private String name;
    @NotNull private BigDecimal priceAdjustment;
}
