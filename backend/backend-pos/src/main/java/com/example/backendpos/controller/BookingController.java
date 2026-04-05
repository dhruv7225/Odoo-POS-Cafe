package com.example.backendpos.controller;

import com.example.backendpos.dto.request.BookingRequest;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.entity.Booking;
import com.example.backendpos.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {
    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<ApiResponse<Booking>> create(@Valid @RequestBody BookingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(bookingService.createBooking(request)));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    public ResponseEntity<ApiResponse<Booking>> confirm(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.confirmBooking(id)));
    }

    @PatchMapping("/{id}/cancel")
    public ResponseEntity<ApiResponse<Booking>> cancel(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.cancelBooking(id)));
    }

    @PatchMapping("/{id}/seat")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER','CASHIER')")
    public ResponseEntity<ApiResponse<Booking>> seat(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.seatBooking(id)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Booking>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getBooking(id)));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<Booking>>> getByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(bookingService.getBookingsByRestaurant(restaurantId)));
    }
}
