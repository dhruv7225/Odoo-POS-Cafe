package com.example.backendpos.service;

import com.example.backendpos.dto.request.StaffAssignRequest;
import com.example.backendpos.entity.RestaurantStaff;

import java.util.List;

public interface StaffService {
    RestaurantStaff assignStaff(StaffAssignRequest request);
    void removeStaff(Long staffId);
    List<RestaurantStaff> getStaffByRestaurant(Long restaurantId);
}
