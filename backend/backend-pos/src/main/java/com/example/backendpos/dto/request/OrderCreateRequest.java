package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class OrderCreateRequest {
    @NotNull private Long restaurantId;
    @NotNull(message = "Table ID is required (from QR code)")
    private Long tableId;
    private Long posSessionId;
    @NotEmpty(message = "Order must have at least one item")
    private List<OrderItemRequest> items;
    private String customerName;  // optional: name for the order (walk-in)
    private String customerPhone; // optional: phone for the order
}
