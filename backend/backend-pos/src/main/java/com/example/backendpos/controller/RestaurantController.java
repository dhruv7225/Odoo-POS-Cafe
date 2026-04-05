package com.example.backendpos.controller;

import com.example.backendpos.dto.request.RestaurantRequest;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.service.RestaurantService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/restaurants")
@RequiredArgsConstructor
public class RestaurantController {
    private final RestaurantService restaurantService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Restaurant>> create(@Valid @RequestBody RestaurantRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(restaurantService.create(request)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Restaurant>> update(@PathVariable Long id, @Valid @RequestBody RestaurantRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.update(id, request)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<Restaurant>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.getById(id)));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<Restaurant>>> getAll() {
        return ResponseEntity.ok(ApiResponse.ok(restaurantService.getAll()));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deactivate(@PathVariable Long id) {
        restaurantService.deactivate(id);
        return ResponseEntity.ok(ApiResponse.ok("Restaurant deactivated", null));
    }
}
