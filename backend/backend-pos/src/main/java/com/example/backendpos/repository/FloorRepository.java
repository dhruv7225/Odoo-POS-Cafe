package com.example.backendpos.repository;
import com.example.backendpos.entity.Floor;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface FloorRepository extends JpaRepository<Floor, Long> {
    List<Floor> findByRestaurantIdAndActiveTrueOrderBySortOrder(Long restaurantId);
    List<Floor> findByRestaurantIdOrderBySortOrder(Long restaurantId);
}
