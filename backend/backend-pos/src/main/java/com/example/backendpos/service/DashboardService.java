package com.example.backendpos.service;

import com.example.backendpos.dto.response.DashboardResponse;

import java.time.LocalDate;

public interface DashboardService {
    DashboardResponse getDashboard(Long restaurantId, LocalDate from, LocalDate to);
    DashboardResponse getSessionDashboard(Long sessionId);
}
