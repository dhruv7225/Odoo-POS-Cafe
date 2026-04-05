package com.example.backendpos.repository;
import com.example.backendpos.entity.PosSession;
import com.example.backendpos.enums.SessionStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface PosSessionRepository extends JpaRepository<PosSession, Long> {
    Optional<PosSession> findByRestaurantIdAndCashierIdAndStatus(Long restaurantId, Long cashierId, SessionStatus status);
    List<PosSession> findByRestaurantIdAndStatus(Long restaurantId, SessionStatus status);
    List<PosSession> findByRestaurantId(Long restaurantId);
    boolean existsByRestaurantIdAndCashierIdAndStatus(Long restaurantId, Long cashierId, SessionStatus status);
}
