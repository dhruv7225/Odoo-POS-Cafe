package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.entity.Floor;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.entity.RestaurantTable;
import com.example.backendpos.enums.TableStatus;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.FloorTableService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FloorTableServiceImpl implements FloorTableService {
    private final FloorRepository floorRepository;
    private final RestaurantTableRepository tableRepository;
    private final RestaurantRepository restaurantRepository;

    @Override
    @Transactional
    public Floor createFloor(FloorRequest request) {
        Restaurant r = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        return floorRepository.save(Floor.builder()
            .restaurant(r).name(request.getName()).sortOrder(request.getSortOrder()).build());
    }

    @Override
    @Transactional
    public Floor updateFloor(Long id, FloorRequest request) {
        Floor f = floorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", id));
        f.setName(request.getName());
        if (request.getSortOrder() != null) f.setSortOrder(request.getSortOrder());
        return floorRepository.save(f);
    }

    @Override
    @Transactional(readOnly = true)
    public List<Floor> getFloors(Long restaurantId) {
        return floorRepository.findByRestaurantIdOrderBySortOrder(restaurantId);
    }

    @Override
    @Transactional
    public void deleteFloor(Long id) {
        Floor f = floorRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", id));
        List<RestaurantTable> tables = tableRepository.findByFloorIdAndActiveTrue(id);
        if (!tables.isEmpty()) {
            throw new BadRequestException("Cannot delete floor with active tables. Deactivate tables first.");
        }
        f.setActive(false);
        floorRepository.save(f);
    }

    @Override
    @Transactional
    public RestaurantTable createTable(TableRequest request) {
        Restaurant r = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        Floor f = floorRepository.findById(request.getFloorId())
            .orElseThrow(() -> new ResourceNotFoundException("Floor", "id", request.getFloorId()));
        if (!f.getRestaurant().getId().equals(r.getId())) {
            throw new BadRequestException("Floor does not belong to this restaurant");
        }
        return tableRepository.save(RestaurantTable.builder()
            .restaurant(r).floor(f).tableNo(request.getTableNo())
            .seats(request.getSeats()).status(TableStatus.AVAILABLE).build());
    }

    @Override
    @Transactional
    public RestaurantTable updateTable(Long id, TableRequest request) {
        RestaurantTable t = tableRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Table", "id", id));
        t.setTableNo(request.getTableNo());
        if (request.getSeats() != null) t.setSeats(request.getSeats());
        return tableRepository.save(t);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTable> getTablesByFloor(Long floorId) {
        return tableRepository.findByFloorIdAndActiveTrue(floorId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RestaurantTable> getTablesByRestaurant(Long restaurantId) {
        return tableRepository.findByRestaurantIdAndActiveTrue(restaurantId);
    }

    @Override
    @Transactional
    public void toggleTableActive(Long tableId) {
        RestaurantTable t = tableRepository.findById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Table", "id", tableId));
        t.setActive(!t.getActive());
        tableRepository.save(t);
    }

    @Override
    @Transactional
    public RestaurantTable updateTableStatus(Long tableId, String status) {
        RestaurantTable t = tableRepository.findById(tableId)
            .orElseThrow(() -> new ResourceNotFoundException("Table", "id", tableId));
        TableStatus tableStatus;
        try { tableStatus = TableStatus.valueOf(status.toUpperCase()); }
        catch (IllegalArgumentException e) {
            throw new BadRequestException("Invalid status: " + status +
                ". Valid: AVAILABLE, OCCUPIED, RESERVED, MAINTENANCE");
        }
        t.setStatus(tableStatus);
        return tableRepository.save(t);
    }
}
