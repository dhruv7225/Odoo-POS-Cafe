package com.example.backendpos.dto.response;
import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KitchenTicketResponse {
    private Long id;
    private Long orderId;
    private String orderNo;
    private String tableNo;
    private String chefName;
    private String ticketStatus;
    private LocalDateTime sentAt;
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;
    private List<KitchenItemResponse> items;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class KitchenItemResponse {
        private Long id;
        private String productName;
        private Integer qty;
        private String prepStatus;
        private LocalDateTime preparedAt;
    }
}
