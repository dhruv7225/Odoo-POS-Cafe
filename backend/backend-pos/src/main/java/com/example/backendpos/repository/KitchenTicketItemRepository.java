package com.example.backendpos.repository;
import com.example.backendpos.entity.KitchenTicketItem;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface KitchenTicketItemRepository extends JpaRepository<KitchenTicketItem, Long> {
    List<KitchenTicketItem> findByKitchenTicketId(Long kitchenTicketId);
}
