package com.example.backendpos.repository;
import com.example.backendpos.entity.RestaurantStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface RestaurantStaffRepository extends JpaRepository<RestaurantStaff, Long> {
    List<RestaurantStaff> findByRestaurantIdAndActiveTrue(Long restaurantId);
    List<RestaurantStaff> findByUserIdAndActiveTrue(Long userId);
    Optional<RestaurantStaff> findByRestaurantIdAndUserIdAndRoleId(Long restaurantId, Long userId, Long roleId);
    boolean existsByRestaurantIdAndUserIdAndActiveTrue(Long restaurantId, Long userId);
}
