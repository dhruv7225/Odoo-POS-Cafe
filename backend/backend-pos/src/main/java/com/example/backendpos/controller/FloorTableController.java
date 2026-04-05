package com.example.backendpos.controller;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.entity.*;
import com.example.backendpos.service.FloorTableService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
@RequiredArgsConstructor
public class FloorTableController {
    private final FloorTableService floorTableService;

    @PostMapping("/floors")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Floor>> createFloor(@Valid @RequestBody FloorRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(floorTableService.createFloor(request)));
    }

    @PutMapping("/floors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Floor>> updateFloor(@PathVariable Long id, @Valid @RequestBody FloorRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(floorTableService.updateFloor(id, request)));
    }

    @GetMapping("/floors/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<Floor>>> getFloors(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(floorTableService.getFloors(restaurantId)));
    }

    @DeleteMapping("/floors/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> deleteFloor(@PathVariable Long id) {
        floorTableService.deleteFloor(id);
        return ResponseEntity.ok(ApiResponse.ok("Floor deactivated", null));
    }

    @PostMapping("/tables")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RestaurantTable>> createTable(@Valid @RequestBody TableRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(floorTableService.createTable(request)));
    }

    @PutMapping("/tables/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RestaurantTable>> updateTable(@PathVariable Long id, @Valid @RequestBody TableRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(floorTableService.updateTable(id, request)));
    }

    @GetMapping("/tables/floor/{floorId}")
    public ResponseEntity<ApiResponse<List<RestaurantTable>>> getTablesByFloor(@PathVariable Long floorId) {
        return ResponseEntity.ok(ApiResponse.ok(floorTableService.getTablesByFloor(floorId)));
    }

    @GetMapping("/tables/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<RestaurantTable>>> getTablesByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(floorTableService.getTablesByRestaurant(restaurantId)));
    }

    @PatchMapping("/tables/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER','WAITER')")
    public ResponseEntity<ApiResponse<Void>> toggleTable(@PathVariable Long id) {
        floorTableService.toggleTableActive(id);
        return ResponseEntity.ok(ApiResponse.ok("Table toggled", null));
    }

    /** Waiter updates table availability status */
    @PatchMapping("/tables/{id}/status")
    @PreAuthorize("hasAnyRole('WAITER','CASHIER','ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RestaurantTable>> updateTableStatus(
            @PathVariable Long id, @RequestParam String status) {
        return ResponseEntity.ok(ApiResponse.ok("Table status updated",
            floorTableService.updateTableStatus(id, status)));
    }
}
