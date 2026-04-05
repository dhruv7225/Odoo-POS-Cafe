package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.StaffAssignRequest;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.entity.RestaurantStaff;
import com.example.backendpos.entity.Role;
import com.example.backendpos.entity.User;
import com.example.backendpos.enums.RoleName;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ConflictException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.StaffService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
public class StaffServiceImpl implements StaffService {
    private final RestaurantStaffRepository staffRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;

    @Override
    @Transactional
    public RestaurantStaff assignStaff(StaffAssignRequest request) {
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        User user = userRepository.findById(request.getUserId())
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", request.getUserId()));

        RoleName roleName;
        try { roleName = RoleName.valueOf(request.getRoleName().toUpperCase()); }
        catch (IllegalArgumentException e) { throw new BadRequestException("Invalid role: " + request.getRoleName()); }

        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));

        // Check duplicate assignment
        staffRepository.findByRestaurantIdAndUserIdAndRoleId(
            request.getRestaurantId(), request.getUserId(), role.getId()
        ).ifPresent(s -> { throw new ConflictException("Staff already assigned with this role"); });

        // Add role to user if missing
        if (user.getRoles().stream().noneMatch(r -> r.getName() == roleName)) {
            user.getRoles().add(role);
            userRepository.save(user);
        }

        return staffRepository.save(RestaurantStaff.builder()
            .restaurant(restaurant).user(user).role(role)
            .isPrimary(request.getIsPrimary()).build());
    }

    @Override
    @Transactional
    public void removeStaff(Long staffId) {
        RestaurantStaff staff = staffRepository.findById(staffId)
            .orElseThrow(() -> new ResourceNotFoundException("Staff", "id", staffId));
        staff.setActive(false);
        staffRepository.save(staff);
    }

    @Override
    public List<RestaurantStaff> getStaffByRestaurant(Long restaurantId) {
        return staffRepository.findByRestaurantIdAndActiveTrue(restaurantId);
    }
}
