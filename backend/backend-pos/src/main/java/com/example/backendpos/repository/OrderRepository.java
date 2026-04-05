package com.example.backendpos.repository;
import com.example.backendpos.entity.Order;
import com.example.backendpos.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderNo(String orderNo);
    List<Order> findByRestaurantIdAndStatus(Long restaurantId, OrderStatus status);
    List<Order> findByPosSessionId(Long posSessionId);
    List<Order> findByRestaurantIdAndCreatedAtBetween(Long restaurantId, LocalDateTime start, LocalDateTime end);
    List<Order> findByTableIdAndStatusNot(Long tableId, OrderStatus status);
    List<Order> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    @Query("SELECT COALESCE(MAX(CAST(SUBSTRING(o.orderNo, LENGTH(:prefix) + 1) AS int)), 0) FROM Order o WHERE o.orderNo LIKE CONCAT(:prefix, '%')")
    int findMaxOrderNo(@Param("prefix") String prefix);
}
