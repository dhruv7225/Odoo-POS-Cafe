package com.example.backendpos.service;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.entity.Floor;
import com.example.backendpos.entity.RestaurantTable;

import java.util.List;

public interface FloorTableService {
    Floor createFloor(FloorRequest request);
    Floor updateFloor(Long id, FloorRequest request);
    List<Floor> getFloors(Long restaurantId);
    void deleteFloor(Long id);
    RestaurantTable createTable(TableRequest request);
    RestaurantTable updateTable(Long id, TableRequest request);
    List<RestaurantTable> getTablesByFloor(Long floorId);
    List<RestaurantTable> getTablesByRestaurant(Long restaurantId);
    void toggleTableActive(Long tableId);
    RestaurantTable updateTableStatus(Long tableId, String status);
}
