package com.example.backendpos.repository;
import com.example.backendpos.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductRepository extends JpaRepository<Product, Long> {
    List<Product> findByRestaurantIdAndActiveTrue(Long restaurantId);
    List<Product> findByCategoryIdAndActiveTrue(Long categoryId);
    List<Product> findByRestaurantIdAndKitchenEnabledTrue(Long restaurantId);
}
