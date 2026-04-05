package com.example.backendpos.repository;
import com.example.backendpos.entity.ProductTopping;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductToppingRepository extends JpaRepository<ProductTopping, Long> {
    List<ProductTopping> findByProductIdAndActiveTrue(Long productId);
}
