package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/upload")
@Slf4j
public class FileUploadController {

    @Value("${app.upload.dir:uploads}")
    private String uploadDir;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(".jpg", ".jpeg", ".png", ".webp", ".gif");

    @PostMapping
    public ResponseEntity<ApiResponse<Map<String, String>>> uploadFile(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Vui lòng chọn một file ảnh hợp lệ."));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Tên file không hợp lệ."));
        }

        String ext = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex > 0) {
            ext = originalFilename.substring(dotIndex).toLowerCase();
        }

        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Chỉ chấp nhận các định dạng ảnh: JPG, PNG, WEBP, GIF."));
        }

        try {
            Path uploadPath = Paths.get(uploadDir).toAbsolutePath().normalize();
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }

            String newFilename = "prod_" + UUID.randomUUID().toString().substring(0, 8) + ext;
            Path targetLocation = uploadPath.resolve(newFilename);

            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            String fileUrl = "http://localhost:8080/uploads/" + newFilename;

            Map<String, String> responseData = new HashMap<>();
            responseData.put("url", fileUrl);
            responseData.put("filename", newFilename);

            log.info("Uploaded file saved: {} -> {}", originalFilename, fileUrl);

            return ResponseEntity.ok(ApiResponse.success(responseData, "Tải ảnh lên thành công!"));

        } catch (IOException ex) {
            log.error("Could not upload file", ex);
            return ResponseEntity.internalServerError().body(ApiResponse.error("Không thể lưu file trên máy chủ: " + ex.getMessage()));
        }
    }
}
