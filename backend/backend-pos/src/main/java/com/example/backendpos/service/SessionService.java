package com.example.backendpos.service;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.SessionResponse;

import java.util.List;

public interface SessionService {
    SessionResponse openSession(SessionRequest request);
    SessionResponse closeSession(CloseSessionRequest request);
    SessionResponse getSession(Long sessionId);
    List<SessionResponse> getSessionsByRestaurant(Long restaurantId);
}
