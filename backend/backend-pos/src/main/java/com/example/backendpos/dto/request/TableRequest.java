package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class TableRequest {
    @NotNull(message = "Restaurant ID is required")
    private Long restaurantId;
    @NotNull(message = "Floor ID is required")
    private Long floorId;
    @NotBlank(message = "Table number is required")
    private String tableNo;
    private Integer seats = 4;
}
