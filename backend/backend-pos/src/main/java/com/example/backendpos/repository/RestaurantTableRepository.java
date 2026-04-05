package com.example.backendpos.repository;
import com.example.backendpos.entity.RestaurantTable;
import com.example.backendpos.enums.TableStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface RestaurantTableRepository extends JpaRepository<RestaurantTable, Long> {
    List<RestaurantTable> findByRestaurantIdAndActiveTrue(Long restaurantId);
    List<RestaurantTable> findByFloorIdAndActiveTrue(Long floorId);
    List<RestaurantTable> findByRestaurantIdAndStatus(Long restaurantId, TableStatus status);
}
