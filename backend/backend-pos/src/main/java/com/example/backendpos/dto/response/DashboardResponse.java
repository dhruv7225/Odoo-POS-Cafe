package com.example.backendpos.dto.response;
import lombok.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class DashboardResponse {
    private BigDecimal totalSales;
    private int totalOrders;
    private int completedOrders;
    private int pendingOrders;
    private int cancelledOrders;
    private BigDecimal averageOrderValue;
    private Map<String, BigDecimal> salesByPaymentMethod;
    private List<ProductSalesSummary> topProducts;
    private List<CategorySalesSummary> topCategories;

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class ProductSalesSummary {
        private String productName;
        private int totalQty;
        private BigDecimal totalRevenue;
    }

    @Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
    public static class CategorySalesSummary {
        private String categoryName;
        private int totalQty;
        private BigDecimal totalRevenue;
    }
}
