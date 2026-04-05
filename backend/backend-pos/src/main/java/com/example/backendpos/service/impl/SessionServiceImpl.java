package com.example.backendpos.service.impl;

import com.example.backendpos.dto.request.*;
import com.example.backendpos.dto.response.SessionResponse;
import com.example.backendpos.entity.PosSession;
import com.example.backendpos.entity.Restaurant;
import com.example.backendpos.entity.User;
import com.example.backendpos.enums.SessionStatus;
import com.example.backendpos.exception.BadRequestException;
import com.example.backendpos.exception.ConflictException;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.SessionService;
import com.example.backendpos.util.SecurityUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class SessionServiceImpl implements SessionService {
    private final PosSessionRepository sessionRepository;
    private final RestaurantRepository restaurantRepository;
    private final UserRepository userRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    @Override
    @Transactional
    public SessionResponse openSession(SessionRequest request) {
        Long cashierId = SecurityUtil.getCurrentUserId();
        Restaurant restaurant = restaurantRepository.findById(request.getRestaurantId())
            .orElseThrow(() -> new ResourceNotFoundException("Restaurant", "id", request.getRestaurantId()));
        User cashier = userRepository.findById(cashierId)
            .orElseThrow(() -> new ResourceNotFoundException("User", "id", cashierId));

        if (sessionRepository.existsByRestaurantIdAndCashierIdAndStatus(
                request.getRestaurantId(), cashierId, SessionStatus.OPEN)) {
            throw new ConflictException("You already have an open session for this restaurant");
        }

        PosSession session = sessionRepository.save(PosSession.builder()
            .restaurant(restaurant).cashier(cashier)
            .openingCash(request.getOpeningCash()).build());
        return toResponse(session);
    }

    @Override
    @Transactional
    public SessionResponse closeSession(CloseSessionRequest request) {
        PosSession session = sessionRepository.findById(request.getSessionId())
            .orElseThrow(() -> new ResourceNotFoundException("Session", "id", request.getSessionId()));

        if (session.getStatus() == SessionStatus.CLOSED) {
            throw new BadRequestException("Session is already closed");
        }

        Long currentUserId = SecurityUtil.getCurrentUserId();
        if (!session.getCashier().getId().equals(currentUserId)) {
            throw new BadRequestException("Only the cashier who opened the session can close it");
        }

        BigDecimal totalSales = paymentRepository.sumBySessionId(session.getId());
        session.setClosedAt(LocalDateTime.now());
        session.setClosingCash(request.getClosingCash());
        session.setTotalSales(totalSales != null ? totalSales : BigDecimal.ZERO);
        session.setStatus(SessionStatus.CLOSED);
        session = sessionRepository.save(session);
        return toResponse(session);
    }

    @Override
    public SessionResponse getSession(Long sessionId) {
        PosSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        return toResponse(session);
    }

    @Override
    public List<SessionResponse> getSessionsByRestaurant(Long restaurantId) {
        return sessionRepository.findByRestaurantId(restaurantId).stream()
            .map(this::toResponse).toList();
    }

    private SessionResponse toResponse(PosSession s) {
        int orderCount = orderRepository.findByPosSessionId(s.getId()).size();
        return SessionResponse.builder()
            .id(s.getId()).restaurantId(s.getRestaurant().getId())
            .cashierName(s.getCashier().getFullName())
            .openedAt(s.getOpenedAt()).closedAt(s.getClosedAt())
            .openingCash(s.getOpeningCash()).closingCash(s.getClosingCash())
            .totalSales(s.getTotalSales()).status(s.getStatus().name())
            .orderCount(orderCount).build();
    }
}
