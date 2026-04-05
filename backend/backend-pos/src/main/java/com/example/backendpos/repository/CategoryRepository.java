package com.example.backendpos.repository;
import com.example.backendpos.entity.Category;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface CategoryRepository extends JpaRepository<Category, Long> {
    List<Category> findByRestaurantIdAndActiveTrue(Long restaurantId);
    List<Category> findByRestaurantId(Long restaurantId);
}
