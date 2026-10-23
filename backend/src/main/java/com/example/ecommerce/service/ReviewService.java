package com.example.ecommerce.service;

import com.example.ecommerce.dto.ReviewRequestDto;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.model.Review;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.ReviewRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final ProductRepository productRepository;

    public List<Review> getReviewsByProductId(Long productId) {
        return reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
    }

    @Transactional
    public Review addReview(Long productId, ReviewRequestDto dto) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + productId));

        Review review = Review.builder()
                .reviewerName(dto.getReviewerName())
                .reviewerEmail(dto.getReviewerEmail())
                .rating(dto.getRating())
                .comment(dto.getComment())
                .product(product)
                .build();

        Review savedReview = reviewRepository.save(review);

        // Recalculate average rating & count
        List<Review> allReviews = reviewRepository.findByProductIdOrderByCreatedAtDesc(productId);
        double avg = allReviews.stream()
                .mapToInt(Review::getRating)
                .average()
                .orElse(5.0);

        double roundedAvg = Math.round(avg * 10.0) / 10.0;
        product.setRating(roundedAvg);
        product.setReviewCount(allReviews.size());
        productRepository.save(product);

        log.info("[REVIEW] Đã thêm đánh giá {} sao cho sản phẩm '{}' (ID: {}). Điểm TB mới: {} (Tổng: {} đánh giá)",
                dto.getRating(), product.getName(), productId, roundedAvg, allReviews.size());

        return savedReview;
    }
}
