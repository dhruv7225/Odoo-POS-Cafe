package com.example.backendpos.service;

import com.example.backendpos.dto.request.BookingRequest;
import com.example.backendpos.entity.Booking;

import java.util.List;

public interface BookingService {
    Booking createBooking(BookingRequest request);
    Booking confirmBooking(Long bookingId);
    Booking cancelBooking(Long bookingId);
    Booking seatBooking(Long bookingId);
    Booking getBooking(Long bookingId);
    List<Booking> getBookingsByRestaurant(Long restaurantId);
}
