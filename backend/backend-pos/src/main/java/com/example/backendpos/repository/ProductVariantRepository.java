package com.example.backendpos.repository;
import com.example.backendpos.entity.ProductVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
public interface ProductVariantRepository extends JpaRepository<ProductVariant, Long> {
    List<ProductVariant> findByProductIdAndActiveTrue(Long productId);
}
