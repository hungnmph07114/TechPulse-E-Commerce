package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ApiResponse;
import com.example.ecommerce.dto.ReviewRequestDto;
import com.example.ecommerce.model.Review;
import com.example.ecommerce.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products/{productId}/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<Review>>> getProductReviews(@PathVariable Long productId) {
        List<Review> reviews = reviewService.getReviewsByProductId(productId);
        return ResponseEntity.ok(ApiResponse.success(reviews, "Lấy danh sách đánh giá thành công"));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<Review>> addReview(
            @PathVariable Long productId,
            @Valid @RequestBody ReviewRequestDto dto) {
        Review review = reviewService.addReview(productId, dto);
        return ResponseEntity.ok(ApiResponse.success(review, "Cảm ơn bạn đã gửi đánh giá sản phẩm!"));
    }
}
