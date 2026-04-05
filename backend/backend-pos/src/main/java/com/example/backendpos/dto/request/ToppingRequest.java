package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class ToppingRequest {
    @NotBlank private String name;
    @NotNull @DecimalMin("0.00") private BigDecimal price;
}
