package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class FloorRequest {
    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;
    @NotBlank(message = "Floor name is required")
    private String name;
    private Integer sortOrder = 0;
}
