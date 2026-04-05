package com.example.backendpos.repository;
import com.example.backendpos.entity.Payment;
import com.example.backendpos.enums.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByOrderId(Long orderId);
    List<Payment> findByBookingId(Long bookingId);
    List<Payment> findByPosSessionId(Long posSessionId);
    List<Payment> findByRestaurantIdAndPaidAtBetween(Long restaurantId, LocalDateTime start, LocalDateTime end);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.order.id = :orderId AND p.paymentStatus = :status")
    BigDecimal sumByOrderIdAndStatus(@Param("orderId") Long orderId, @Param("status") PaymentStatus status);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.posSession.id = :sessionId AND p.paymentStatus = 'SUCCESS'")
    BigDecimal sumBySessionId(@Param("sessionId") Long sessionId);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.booking.id = :bookingId AND p.paymentType = 'ADVANCE' AND p.paymentStatus = :status")
    BigDecimal sumAdvanceByBookingIdAndStatus(@Param("bookingId") Long bookingId, @Param("status") PaymentStatus status);
}
