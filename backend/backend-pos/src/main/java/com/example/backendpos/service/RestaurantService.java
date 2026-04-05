package com.example.backendpos.service;

import com.example.backendpos.dto.request.RestaurantRequest;
import com.example.backendpos.entity.Restaurant;

import java.util.List;

public interface RestaurantService {
    Restaurant create(RestaurantRequest request);
    Restaurant update(Long id, RestaurantRequest request);
    Restaurant getById(Long id);
    List<Restaurant> getAll();
    void deactivate(Long id);
}
