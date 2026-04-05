package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class RestaurantRequest {
    @NotBlank(message = "Name is required")
    private String name;
    @NotBlank(message = "Code is required")
    private String code;
    private String address;
}
