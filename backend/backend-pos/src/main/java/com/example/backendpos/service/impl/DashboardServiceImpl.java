package com.example.backendpos.service.impl;

import com.example.backendpos.dto.response.DashboardResponse;
import com.example.backendpos.dto.response.DashboardResponse.CategorySalesSummary;
import com.example.backendpos.dto.response.DashboardResponse.ProductSalesSummary;
import com.example.backendpos.entity.Order;
import com.example.backendpos.entity.OrderItem;
import com.example.backendpos.entity.Payment;
import com.example.backendpos.entity.PosSession;
import com.example.backendpos.enums.OrderStatus;
import com.example.backendpos.enums.PaymentStatus;
import com.example.backendpos.exception.ResourceNotFoundException;
import com.example.backendpos.repository.*;
import com.example.backendpos.service.DashboardService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardServiceImpl implements DashboardService {
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final PosSessionRepository sessionRepository;

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getDashboard(Long restaurantId, LocalDate from, LocalDate to) {
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        List<Order> orders = orderRepository.findByRestaurantIdAndCreatedAtBetween(restaurantId, start, end);
        List<Payment> payments = paymentRepository.findByRestaurantIdAndPaidAtBetween(restaurantId, start, end);
        return buildDashboard(orders, payments);
    }

    @Override
    @Transactional(readOnly = true)
    public DashboardResponse getSessionDashboard(Long sessionId) {
        PosSession session = sessionRepository.findById(sessionId)
            .orElseThrow(() -> new ResourceNotFoundException("Session", "id", sessionId));
        List<Order> orders = orderRepository.findByPosSessionId(sessionId);
        List<Payment> payments = paymentRepository.findByPosSessionId(sessionId);
        return buildDashboard(orders, payments);
    }

    private DashboardResponse buildDashboard(List<Order> orders, List<Payment> payments) {
        BigDecimal totalSales = payments.stream()
            .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS)
            .map(Payment::getAmount)
            .reduce(BigDecimal.ZERO, BigDecimal::add);

        int totalOrders = orders.size();
        int completed = (int) orders.stream().filter(o -> o.getStatus() == OrderStatus.COMPLETED).count();
        int pending = (int) orders.stream().filter(o -> o.getStatus() != OrderStatus.COMPLETED && o.getStatus() != OrderStatus.CANCELLED).count();
        int cancelled = (int) orders.stream().filter(o -> o.getStatus() == OrderStatus.CANCELLED).count();

        BigDecimal avg = totalOrders > 0
            ? totalSales.divide(BigDecimal.valueOf(totalOrders), 2, RoundingMode.HALF_UP)
            : BigDecimal.ZERO;

        // Sales by payment method
        Map<String, BigDecimal> salesByMethod = payments.stream()
            .filter(p -> p.getPaymentStatus() == PaymentStatus.SUCCESS)
            .collect(Collectors.groupingBy(
                p -> p.getPaymentMethod().getName(),
                Collectors.reducing(BigDecimal.ZERO, Payment::getAmount, BigDecimal::add)
            ));

        // Top products
        Map<String, int[]> productQty = new LinkedHashMap<>();
        Map<String, BigDecimal> productRevenue = new LinkedHashMap<>();
        // Top categories
        Map<String, int[]> categoryQty = new LinkedHashMap<>();
        Map<String, BigDecimal> categoryRevenue = new LinkedHashMap<>();

        for (Order o : orders) {
            if (o.getStatus() != OrderStatus.CANCELLED) {
                for (OrderItem item : o.getItems()) {
                    String productName = item.getProduct().getName();
                    String categoryName = item.getProduct().getCategory().getName();

                    productQty.computeIfAbsent(productName, k -> new int[]{0})[0] += item.getQty();
                    productRevenue.merge(productName, item.getLineTotal(), BigDecimal::add);

                    categoryQty.computeIfAbsent(categoryName, k -> new int[]{0})[0] += item.getQty();
                    categoryRevenue.merge(categoryName, item.getLineTotal(), BigDecimal::add);
                }
            }
        }

        List<ProductSalesSummary> topProducts = productQty.entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
            .limit(10)
            .map(e -> ProductSalesSummary.builder()
                .productName(e.getKey()).totalQty(e.getValue()[0])
                .totalRevenue(productRevenue.getOrDefault(e.getKey(), BigDecimal.ZERO)).build())
            .toList();

        List<CategorySalesSummary> topCategories = categoryQty.entrySet().stream()
            .sorted((a, b) -> Integer.compare(b.getValue()[0], a.getValue()[0]))
            .limit(10)
            .map(e -> CategorySalesSummary.builder()
                .categoryName(e.getKey()).totalQty(e.getValue()[0])
                .totalRevenue(categoryRevenue.getOrDefault(e.getKey(), BigDecimal.ZERO)).build())
            .toList();

        return DashboardResponse.builder()
            .totalSales(totalSales).totalOrders(totalOrders)
            .completedOrders(completed).pendingOrders(pending).cancelledOrders(cancelled)
            .averageOrderValue(avg).salesByPaymentMethod(salesByMethod)
            .topProducts(topProducts).topCategories(topCategories).build();
    }
}
