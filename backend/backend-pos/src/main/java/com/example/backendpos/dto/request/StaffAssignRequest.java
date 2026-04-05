package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class StaffAssignRequest {
    @NotNull private Long restaurantId;
    @NotNull private Long userId;
    @NotBlank private String roleName;
    private Boolean isPrimary = false;
}
