package com.example.ecommerce.dto;

import lombok.*;
import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardStatsDto {
    private long totalProducts;
    private long totalCategories;
    private long totalOrders;
    private BigDecimal totalRevenue;
    private long pendingOrders;
    private long lowStockProducts;
}
