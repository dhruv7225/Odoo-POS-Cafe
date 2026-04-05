package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CloseSessionRequest {
    @NotNull private Long sessionId;
    private BigDecimal closingCash = BigDecimal.ZERO;
}
