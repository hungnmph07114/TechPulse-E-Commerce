package com.example.ecommerce.service;

import com.example.ecommerce.dto.ProductRequestDto;
import com.example.ecommerce.model.Category;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    public Page<Product> getProducts(Long categoryId, String keyword, BigDecimal minPrice, BigDecimal maxPrice,
                                     String sortBy, int page, int size) {
        Sort sort = Sort.by(Sort.Direction.DESC, "createdAt");
        if ("price-asc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "price");
        } else if ("price-desc".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "price");
        } else if ("rating".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.DESC, "rating");
        } else if ("name".equalsIgnoreCase(sortBy)) {
            sort = Sort.by(Sort.Direction.ASC, "name");
        }

        Pageable pageable = PageRequest.of(page, size, sort);
        return productRepository.findProductsWithFilters(categoryId, keyword, minPrice, maxPrice, pageable);
    }

    public List<Product> getFeaturedProducts() {
        return productRepository.findByFeaturedTrue();
    }

    public Product getProductById(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy sản phẩm với ID: " + id));
    }

    @Transactional
    public Product createProduct(ProductRequestDto dto) {
        Category category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + dto.getCategoryId()));
        }

        Product product = Product.builder()
                .name(dto.getName())
                .description(dto.getDescription())
                .price(dto.getPrice())
                .originalPrice(dto.getOriginalPrice() != null ? dto.getOriginalPrice() : dto.getPrice())
                .stock(dto.getStock())
                .imageUrl(dto.getImageUrl())
                .category(category)
                .featured(dto.getFeatured() != null ? dto.getFeatured() : false)
                .rating(5.0)
                .reviewCount(0)
                .build();

        return productRepository.save(product);
    }

    @Transactional
    public Product updateProduct(Long id, ProductRequestDto dto) {
        Product product = getProductById(id);

        if (dto.getCategoryId() != null) {
            Category category = categoryRepository.findById(dto.getCategoryId())
                    .orElseThrow(() -> new RuntimeException("Không tìm thấy danh mục với ID: " + dto.getCategoryId()));
            product.setCategory(category);
        }

        product.setName(dto.getName());
        product.setDescription(dto.getDescription());
        product.setPrice(dto.getPrice());
        if (dto.getOriginalPrice() != null) {
            product.setOriginalPrice(dto.getOriginalPrice());
        }
        product.setStock(dto.getStock());
        if (dto.getImageUrl() != null && !dto.getImageUrl().isBlank()) {
            product.setImageUrl(dto.getImageUrl());
        }
        if (dto.getFeatured() != null) {
            product.setFeatured(dto.getFeatured());
        }

        return productRepository.save(product);
    }

    @Transactional
    public void deleteProduct(Long id) {
        Product product = getProductById(id);
        productRepository.delete(product);
    }
}
