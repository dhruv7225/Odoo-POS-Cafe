package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.*;
import com.example.backendpos.entity.Role;
import com.example.backendpos.entity.User;
import com.example.backendpos.enums.RoleName;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ConflictException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.security.JwtUtils;
import com.example.backendpos.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;

    @Override
    @Transactional
    public AuthResponse signup(SignupRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new ConflictException("Email already registered");
        }
        if (request.getPhone() != null && userRepository.existsByPhone(request.getPhone())) {
            throw new ConflictException("Phone already registered");
        }

        final RoleName roleName;
        if (request.getRoleName() != null && !request.getRoleName().isBlank()) {
            try {
                roleName = RoleName.valueOf(request.getRoleName().toUpperCase());
            } catch (IllegalArgumentException e) {
                throw new BadRequestException("Invalid role: " + request.getRoleName());
            }
        } else {
            roleName = RoleName.CUSTOMER;
        }

        Role role = roleRepository.findByName(roleName)
            .orElseThrow(() -> new ResourceNotFoundException("Role", "name", roleName));

        User user = User.builder()
            .fullName(request.getFullName())
            .email(request.getEmail())
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .phone(request.getPhone())
            .build();
        user.getRoles().add(role);
        user = userRepository.save(user);

        String token = jwtUtils.generateToken(user.getEmail());
        return AuthResponse.builder()
            .userId(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .token(token)
            .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()))
            .build();
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
            new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new ResourceNotFoundException("User", "email", request.getEmail()));

        if (!"ACTIVE".equals(user.getStatus())) {
            throw new BadRequestException("Account is not active");
        }

        String token = jwtUtils.generateToken(user.getEmail());
        return AuthResponse.builder()
            .userId(user.getId())
            .fullName(user.getFullName())
            .email(user.getEmail())
            .token(token)
            .roles(user.getRoles().stream().map(r -> r.getName().name()).collect(Collectors.toSet()))
            .build();
    }
}
