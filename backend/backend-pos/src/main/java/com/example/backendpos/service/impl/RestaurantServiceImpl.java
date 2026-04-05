package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.RestaurantRequest;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.exception.ConflictException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.RestaurantRepository;
import com.example.backendpos.service.RestaurantService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class RestaurantServiceImpl implements RestaurantService {
    private final RestaurantRepository restaurantRepository;


    @Override
    @Transactional
    public Restaurant create(RestaurantRequest request) {
        if (restaurantRepository.existsByCode(request.getCode())) {
            throw new ConflictException("Restaurant code already exists: " + request.getCode());
        }
        return restaurantRepository.save(Restaurant.builder()
            .name(request.getName()).code(request.getCode()).address(request.getAddress()).build());
    }

    @Override
    @Transactional
    public Restaurant update(Long id, RestaurantRequest request) {
        Restaurant r = getById(id);
        r.setName(request.getName());
        r.setAddress(request.getAddress());
        return restaurantRepository.save(r);
    }

    @Override
    @Transactional
    public Restaurant getById(Long id) {
        return restaurantRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", id));
    }

    @Override
    @Transactional
    public List<Restaurant> getAll() { return restaurantRepository.findAll(); }

    @Override
    @Transactional
    public void deactivate(Long id) {
        Restaurant r = getById(id);
        r.setStatus("INACTIVE");
        restaurantRepository.save(r);
    }
}
