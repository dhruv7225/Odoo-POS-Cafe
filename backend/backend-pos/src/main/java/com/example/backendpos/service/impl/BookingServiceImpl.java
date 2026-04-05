package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.BookingRequest;
import com.example.backendpos.entity.Booking;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.entity.RestaurantTable;
import com.example.backendpos.entity.User;
import com.example.backendpos.enums.BookingStatus;
import com.example.backendpos.enums.TableStatus;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ConflictException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.BookingService;
import com.example.backendpos.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingServiceImpl implements BookingService {
    private final BookingRepository bookingRepository;
    private final RestaurantRepository restaurantRepository;
    private final RestaurantTableRepository tableRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional
    public Booking createBooking(BookingRequest request) {
        Long customerId = SecurityUtil.getCurrentUserId();
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        RestaurantTable table = tableRepository.findById(request.getTableId())
            .orElseThrow(() -> new ResourceNotFoundException("Table", "id", request.getTableId()));
        User customer = userRepository.findById(customerId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", customerId));

        if (!table.getRestaurant().getId().equals(restaurant.getId())) {
            throw new BadRequestException("Table does not belong to this restaurant");
        }
        if (table.getSeats() < request.getGuestCount()) {
            throw new BadRequestException("Table has only " + table.getSeats() + " seats, but " + request.getGuestCount() + " guests requested");
        }

        // Check for conflicting bookings
        List<Booking> conflicting = bookingRepository.findByTableIdAndStatusIn(
            request.getTableId(), List.of(BookingStatus.PENDING, BookingStatus.CONFIRMED));
        for (Booking b : conflicting) {
            if (Math.abs(java.time.Duration.between(b.getBookingTime(), request.getBookingTime()).toHours()) < 2) {
                throw new ConflictException("Table already booked around that time");
            }
        }

        return bookingRepository.save(Booking.builder()
            .restaurant(restaurant).customer(customer).table(table)
            .bookingTime(request.getBookingTime()).guestCount(request.getGuestCount())
            .advanceAmount(request.getAdvanceAmount()).notes(request.getNotes()).build());
    }

    @Override @Transactional
    public Booking confirmBooking(Long bookingId) {
        Booking b = getBooking(bookingId);
        if (b.getStatus() != BookingStatus.PENDING) throw new BadRequestException("Booking is not in PENDING status");
        b.setStatus(BookingStatus.CONFIRMED);
        return bookingRepository.save(b);
    }

    @Override @Transactional
    public Booking cancelBooking(Long bookingId) {
        Booking b = getBooking(bookingId);
        if (b.getStatus() == BookingStatus.COMPLETED || b.getStatus() == BookingStatus.CANCELLED)
            throw new BadRequestException("Cannot cancel a " + b.getStatus() + " booking");
        b.setStatus(BookingStatus.CANCELLED);
        return bookingRepository.save(b);
    }

    @Override @Transactional
    public Booking seatBooking(Long bookingId) {
        Booking b = getBooking(bookingId);
        if (b.getStatus() != BookingStatus.CONFIRMED) throw new BadRequestException("Booking must be CONFIRMED to seat");
        b.setStatus(BookingStatus.SEATED);
        RestaurantTable t = b.getTable();
        t.setStatus(TableStatus.OCCUPIED);
        tableRepository.save(t);
        return bookingRepository.save(b);
    }

    @Override
    public Booking getBooking(Long bookingId) {
        return bookingRepository.findById(bookingId)
            .orElseThrow(() -> new ResourceNotFoundException("Booking", "id", bookingId));
    }

    @Override
    public List<Booking> getBookingsByRestaurant(Long restaurantId) {
        return bookingRepository.findByRestaurantIdAndStatus(restaurantId, BookingStatus.PENDING);
    }
}
