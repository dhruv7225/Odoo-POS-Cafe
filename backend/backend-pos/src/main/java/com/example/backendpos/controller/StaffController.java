package com.example.backendpos.controller;

import com.example.backendpos.dto.request.StaffAssignRequest;
import com.example.backendpos.dto.response.ApiResponse;
import com.example.backendpos.entity.RestaurantStaff;
import com.example.backendpos.service.StaffService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/staff")
@RequiredArgsConstructor
public class StaffController {
    private final StaffService staffService;

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<RestaurantStaff>> assign(@Valid @RequestBody StaffAssignRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.ok(staffService.assignStaff(request)));
    }

    @DeleteMapping("/{staffId}")
    @PreAuthorize("hasAnyRole('ADMIN','MANAGER')")
    public ResponseEntity<ApiResponse<Void>> remove(@PathVariable Long staffId) {
        staffService.removeStaff(staffId);
        return ResponseEntity.ok(ApiResponse.ok("Staff removed", null));
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<ApiResponse<List<RestaurantStaff>>> getByRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ApiResponse.ok(staffService.getStaffByRestaurant(restaurantId)));
    }
}
