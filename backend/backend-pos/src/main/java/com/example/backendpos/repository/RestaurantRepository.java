package com.example.backendpos.repository;
import com.example.backendpos.entity.Restaurant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findByCode(String code);
    boolean existsByCode(String code);
}
