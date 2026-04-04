package com.example.backendpos.entity;

import com.example.backendpos.enums.TicketStatus;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "kitchen_tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class KitchenTicket {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "order_id", nullable = false)
    private Order order;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "chef_id")
    private User chef;

    @Enumerated(EnumType.STRING)
    @Column(name = "ticket_status")
    @Builder.Default
    private TicketStatus ticketStatus = TicketStatus.TO_COOK;

    @Column(name = "sent_at")
    @Builder.Default
    private LocalDateTime sentAt = LocalDateTime.now();

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "completed_at")
    private LocalDateTime completedAt;

    @OneToMany(mappedBy = "kitchenTicket", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<KitchenTicketItem> ticketItems = new ArrayList<>();
}
