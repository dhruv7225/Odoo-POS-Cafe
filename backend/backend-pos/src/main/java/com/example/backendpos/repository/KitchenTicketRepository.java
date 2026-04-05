package com.example.backendpos.repository;
import com.example.backendpos.entity.KitchenTicket;
import com.example.backendpos.enums.TicketStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface KitchenTicketRepository extends JpaRepository<KitchenTicket, Long> {
    List<KitchenTicket> findByRestaurantIdAndTicketStatusIn(Long restaurantId, List<TicketStatus> statuses);
    Optional<KitchenTicket> findByOrderId(Long orderId);
    List<KitchenTicket> findByRestaurantIdOrderBySentAtDesc(Long restaurantId);
    List<KitchenTicket> findByChefId(Long chefId);
    @org.springframework.data.jpa.repository.Query(
        "SELECT t FROM KitchenTicket t WHERE t.restaurant.id = :restaurantId " +
        "AND (t.ticketStatus IN ('TO_COOK','PREPARING') OR (t.ticketStatus = 'COMPLETED' AND t.order.status = 'READY'))" +
        " ORDER BY t.sentAt ASC")
    List<KitchenTicket> findKitchenDisplayTickets(@org.springframework.data.repository.query.Param("restaurantId") Long restaurantId);
}
