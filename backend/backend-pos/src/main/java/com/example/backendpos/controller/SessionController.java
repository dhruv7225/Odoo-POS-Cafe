package com.example.backendpos.controller;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.*;
import com.example.backendpos.service.SessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sessions")
@RequiredArgsConstructor
public class SessionController {
    private final SessionService sessionService;

    @PostMapping("/open")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<SessionResponse>> open(@Valid @RequestBody SessionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok("Session opened", sessionService.openSession(request)));
    }

    @PostMapping("/close")
    @PreAuthorize("hasRole('CASHIER')")
    public ResponseEntity<ApiResponse<SessionResponse>> close(@Valid @RequestBody CloseSessionRequest request) {
        return ResponseEntity.ok(ApiResponse.ok("Session closed", sessionService.closeSession(request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<SessionResponse>> get(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getSession(id)));
    }

    @GetMapping("/restaurant/{restaurantId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','CASHIER')")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> getByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(sessionService.getSessionsByRestaurant(restaurantId)));
    }
}
