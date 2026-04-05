package com.example.backendpos.entity;

import com.example.backendpos.enums.PrepStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kitchen_ticket_items")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KitchenTicketItem {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "kitchen_ticket_id", nullable = false)
    private KitchenTicket kitchenTicket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_item_id", nullable = false)
    private OrderItem orderItem;

    @Enumerated(EnumType.STRING)
    @Column(name = "prep_status")
    @Builder.Default
    private PrepStatus prepStatus = PrepStatus.PENDING;

    @Column(name = "prepared_at")
    private LocalDateTime preparedAt;
}
