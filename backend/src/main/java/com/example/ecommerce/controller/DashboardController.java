package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ApiResponse;
import com.example.ecommerce.dto.DashboardStatsDto;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final OrderRepository orderRepository;

    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<DashboardStatsDto>> getStats() {
        long totalProducts = productRepository.count();
        long totalCategories = categoryRepository.count();
        long totalOrders = orderRepository.count();
        BigDecimal totalRevenue = orderRepository.calculateTotalRevenue();
        long pendingOrders = orderRepository.countByStatus("PENDING");
        long lowStockProducts = productRepository.countLowStockProducts(5);

        DashboardStatsDto stats = DashboardStatsDto.builder()
                .totalProducts(totalProducts)
                .totalCategories(totalCategories)
                .totalOrders(totalOrders)
                .totalRevenue(totalRevenue != null ? totalRevenue : BigDecimal.ZERO)
                .pendingOrders(pendingOrders)
                .lowStockProducts(lowStockProducts)
                .build();

        return ResponseEntity.ok(ApiResponse.success(stats, "Lấy dữ liệu thống kê thành công"));
    }
}
