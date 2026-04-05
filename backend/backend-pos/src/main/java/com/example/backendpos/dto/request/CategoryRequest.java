package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class CategoryRequest {
    @NotNull private Long restaurantId;
    @NotBlank(message = "Category name is required")
    private String name;
}
