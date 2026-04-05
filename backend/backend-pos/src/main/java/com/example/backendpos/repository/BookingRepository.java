package com.example.backendpos.repository;
import com.example.backendpos.entity.Booking;
import com.example.backendpos.enums.BookingStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import java.time.LocalDateTime;
import java.util.List;
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByRestaurantIdAndStatus(Long restaurantId, BookingStatus status);
    List<Booking> findByRestaurantIdAndBookingTimeBetween(Long restaurantId, LocalDateTime start, LocalDateTime end);
    List<Booking> findByCustomerId(Long customerId);
    List<Booking> findByTableIdAndStatusIn(Long tableId, List<BookingStatus> statuses);
}
