package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class SessionRequest {
    @NotNull private Long restaurantId;
    private BigDecimal openingCash = BigDecimal.ZERO;
}
