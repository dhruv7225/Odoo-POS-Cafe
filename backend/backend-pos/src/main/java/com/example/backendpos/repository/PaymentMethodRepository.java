package com.example.backendpos.repository;
import com.example.backendpos.entity.PaymentMethod;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;
import java.util.Optional;
public interface PaymentMethodRepository extends JpaRepository<PaymentMethod, Long> {
    List<PaymentMethod> findByRestaurantIdAndActiveTrue(Long restaurantId);
    Optional<PaymentMethod> findByRestaurantIdAndCode(Long restaurantId, String code);
}
