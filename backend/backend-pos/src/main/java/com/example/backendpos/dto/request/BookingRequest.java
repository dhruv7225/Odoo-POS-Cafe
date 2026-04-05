package com.example.backendpos.dto.request;
import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor
public class BookingRequest {
    @NotNull private Long restaurantId;
    @NotNull private Long tableId;
    @NotNull @Future(message = "Booking time must be in the future")
    private LocalDateTime bookingTime;
    @Min(1) private Integer guestCount = 1;
    private BigDecimal advanceAmount = BigDecimal.ZERO;
    private String notes;
}
