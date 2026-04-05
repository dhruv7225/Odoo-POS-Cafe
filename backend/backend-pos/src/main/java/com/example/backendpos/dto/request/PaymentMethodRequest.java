package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class PaymentMethodRequest {
    @NotNull private Long restaurantId;
    @NotBlank private String name;
    @NotBlank private String code;
    private Boolean requiresReference = false;
    private String upiId;
}
