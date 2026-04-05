package com.example.backendpos.service;
import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.*;

public interface AuthService {
    AuthResponse signup(SignupRequest request);
    AuthResponse login(LoginRequest request);
}
