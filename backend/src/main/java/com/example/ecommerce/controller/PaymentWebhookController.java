package com.example.ecommerce.controller;

import com.example.ecommerce.dto.ApiResponse;
import com.example.ecommerce.model.Order;
import com.example.ecommerce.repository.OrderRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@RestController
@RequestMapping("/api/payment")
@RequiredArgsConstructor
public class PaymentWebhookController {

    private final OrderRepository orderRepository;

    /**
     * Webhook endpoint nhận thông báo biến động số dư tự động từ SePay, PayOS hoặc Cass.vn
     * Tự động kiểm tra mã đơn hàng và số tiền chuyển khoản để hoàn tất đơn hàng.
     */
    @PostMapping("/webhook")
    public ResponseEntity<Map<String, Object>> handlePaymentWebhook(
            @RequestBody(required = false) Map<String, Object> payload,
            @RequestHeader(value = "Authorization", required = false) String authHeader) {

        log.info("[PAYMENT WEBHOOK] Nhận dữ liệu webhook thanh toán: {}", payload);

        Map<String, Object> response = new HashMap<>();

        if (payload == null || payload.isEmpty()) {
            response.put("success", false);
            response.put("message", "Payload rỗng");
            return ResponseEntity.badRequest().body(response);
        }

        try {
            // 1. Trích xuất nội dung chuyển khoản và số tiền từ nhiều chuẩn webhook (SePay / PayOS / Generic)
            String content = extractContent(payload);
            BigDecimal amount = extractAmount(payload);

            log.info("[PAYMENT WEBHOOK] Nội dung: '{}', Số tiền nhận: {}", content, amount);

            // 2. Tìm mã đơn hàng từ nội dung (ví dụ: ORD-XXXXXXXX hoặc ORDXXXXXXXX)
            String detectedCode = extractOrderCode(content, payload);

            if (detectedCode == null || detectedCode.isEmpty()) {
                log.warn("[PAYMENT WEBHOOK] Không tìm thấy mã đơn hàng hợp lệ trong nội dung: {}", content);
                response.put("success", false);
                response.put("message", "Không tìm thấy mã đơn hàng (ORD-...) trong nội dung chuyển khoản");
                return ResponseEntity.ok(response);
            }

            log.info("[PAYMENT WEBHOOK] Phát hiện mã đơn hàng: {}", detectedCode);

            // 3. Tìm đơn hàng trong CSDL MySQL
            Optional<Order> orderOpt = orderRepository.findByOrderCodeIgnoreCase(detectedCode);

            // Nếu không thấy, thử tìm kiếm linh hoạt (loại bỏ dấu gạch ngang hoặc theo ID)
            if (orderOpt.isEmpty()) {
                String cleanCode = detectedCode.replace("-", "").toUpperCase();
                List<Order> allOrders = orderRepository.findAll();
                orderOpt = allOrders.stream()
                        .filter(o -> o.getOrderCode().replace("-", "").equalsIgnoreCase(cleanCode))
                        .findFirst();
            }

            // Nếu vẫn không thấy và chuỗi là số, thử tìm theo ID
            if (orderOpt.isEmpty() && detectedCode.matches("\\d+")) {
                try {
                    Long orderId = Long.parseLong(detectedCode);
                    orderOpt = orderRepository.findById(orderId);
                } catch (Exception ignored) {}
            }

            if (orderOpt.isEmpty()) {
                log.warn("[PAYMENT WEBHOOK] Không tìm thấy đơn hàng trong CSDL với mã: {}", detectedCode);
                response.put("success", false);
                response.put("message", "Không tìm thấy đơn hàng với mã: " + detectedCode);
                return ResponseEntity.ok(response);
            }

            Order order = orderOpt.get();

            // 4. Nếu đơn hàng đã hoàn tất từ trước
            if ("COMPLETED".equalsIgnoreCase(order.getStatus())) {
                log.info("[PAYMENT WEBHOOK] Đơn hàng {} đã ở trạng thái COMPLETED từ trước", order.getOrderCode());
                response.put("success", true);
                response.put("message", "Đơn hàng đã thanh toán thành công trước đó");
                response.put("orderCode", order.getOrderCode());
                return ResponseEntity.ok(response);
            }

            // 5. Kiểm tra số tiền chuyển (cho phép sai số nhỏ nếu có phí)
            if (amount != null && amount.compareTo(BigDecimal.ZERO) > 0) {
                if (amount.compareTo(order.getTotalAmount()) < 0) {
                    log.warn("[PAYMENT WEBHOOK] Số tiền nhận ({}) nhỏ hơn tổng tiền đơn hàng ({})", amount, order.getTotalAmount());
                    response.put("success", false);
                    response.put("message", "Số tiền chuyển khoản không đủ: " + amount + " < " + order.getTotalAmount());
                    return ResponseEntity.ok(response);
                }
            }

            // 6. Cập nhật trạng thái đơn hàng sang COMPLETED tự động
            order.setStatus("COMPLETED");
            order.setPaymentMethod("VIETQR_AUTO");
            orderRepository.save(order);

            log.info("[PAYMENT WEBHOOK] ✅ ĐÃ TỰ ĐỘNG XÁC NHẬN THANH TOÁN CHO ĐƠN HÀNG: {} (Số tiền: {})",
                    order.getOrderCode(), order.getTotalAmount());

            response.put("success", true);
            response.put("message", "Thanh toán thành công! Đơn hàng đã được tự động xác nhận.");
            response.put("orderCode", order.getOrderCode());
            response.put("orderId", order.getId());
            response.put("amount", order.getTotalAmount());
            return ResponseEntity.ok(response);

        } catch (Exception e) {
            log.error("[PAYMENT WEBHOOK] Lỗi xử lý webhook: ", e);
            response.put("success", false);
            response.put("message", "Lỗi xử lý server: " + e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }

    /**
     * API kiểm tra trạng thái thanh toán theo Order ID (Dùng cho giao diện Polling tự động kiểm tra)
     * Public không cần token JWT để khách thanh toán có thể xem được.
     */
    @GetMapping("/order-status/{orderId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> checkOrderStatus(@PathVariable Long orderId) {
        Optional<Order> orderOpt = orderRepository.findById(orderId);
        if (orderOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Order order = orderOpt.get();
        boolean isPaid = "COMPLETED".equalsIgnoreCase(order.getStatus());

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", order.getId());
        data.put("orderCode", order.getOrderCode());
        data.put("status", order.getStatus());
        data.put("isPaid", isPaid);
        data.put("totalAmount", order.getTotalAmount());
        data.put("customerName", order.getCustomerName());

        return ResponseEntity.ok(ApiResponse.success(data, "Kiểm tra trạng thái đơn hàng thành công"));
    }

    /**
     * API giả lập chuyển khoản thành công (Dành riêng cho Môi trường Test / Dev)
     * Giúp người dùng hoặc quản trị viên thử nghiệm tính năng tự động mà không cần tốn tiền thật.
     */
    @PostMapping("/simulate-transfer/{orderId}")
    public ResponseEntity<ApiResponse<Map<String, Object>>> simulatePaymentTransfer(@PathVariable Long orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new RuntimeException("Không tìm thấy đơn hàng ID: " + orderId));

        order.setStatus("COMPLETED");
        order.setPaymentMethod("VIETQR_AUTO");
        Order saved = orderRepository.save(order);

        log.info("[SIMULATION] ✅ Giả lập thanh toán VietQR thành công cho đơn: {}", saved.getOrderCode());

        Map<String, Object> data = new HashMap<>();
        data.put("orderId", saved.getId());
        data.put("orderCode", saved.getOrderCode());
        data.put("status", saved.getStatus());
        data.put("isPaid", true);
        data.put("totalAmount", saved.getTotalAmount());

        return ResponseEntity.ok(ApiResponse.success(data, "Giả lập thanh toán thành công! Trạng thái đơn đã chuyển sang COMPLETED."));
    }

    /**
     * API lấy thông tin cấu hình webhook
     */
    @GetMapping("/webhook-info")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getWebhookInfo() {
        Map<String, Object> info = new HashMap<>();
        info.put("webhookUrl", "http://localhost:8080/api/payment/webhook");
        info.put("supportedProviders", Arrays.asList("SePay", "PayOS", "Cass.vn", "Custom Banking App"));
        info.put("formatRequirement", "Nội dung chuyển khoản cần chứa mã đơn hàng dạng ORD-XXXXXXXX (hoặc ORDXXXXXXXX)");
        info.put("status", "ACTIVE");

        return ResponseEntity.ok(ApiResponse.success(info, "Thông tin Webhook thanh toán VietQR"));
    }

    // Helper: trích xuất nội dung chuyển tiền
    private String extractContent(Map<String, Object> payload) {
        // SePay: transactionContent hoặc content
        if (payload.containsKey("transactionContent") && payload.get("transactionContent") != null) {
            return String.valueOf(payload.get("transactionContent"));
        }
        if (payload.containsKey("content") && payload.get("content") != null) {
            return String.valueOf(payload.get("content"));
        }
        // PayOS: data.description
        if (payload.get("data") instanceof Map<?, ?> dataMap) {
            if (dataMap.containsKey("description") && dataMap.get("description") != null) {
                return String.valueOf(dataMap.get("description"));
            }
        }
        // Generic: description, notes
        if (payload.containsKey("description") && payload.get("description") != null) {
            return String.valueOf(payload.get("description"));
        }
        return "";
    }

    // Helper: trích xuất số tiền
    private BigDecimal extractAmount(Map<String, Object> payload) {
        // SePay: amountIn, transferAmount
        Object amt = payload.get("amountIn");
        if (amt == null) amt = payload.get("transferAmount");
        if (amt == null) amt = payload.get("amount");

        // PayOS: data.amount
        if (amt == null && payload.get("data") instanceof Map<?, ?> dataMap) {
            amt = dataMap.get("amount");
        }

        if (amt != null) {
            try {
                return new BigDecimal(String.valueOf(amt));
            } catch (Exception ignored) {}
        }
        return BigDecimal.ZERO;
    }

    // Helper: trích xuất mã đơn hàng từ nội dung
    private String extractOrderCode(String content, Map<String, Object> payload) {
        // Nếu payload có trực tiếp orderCode (ví dụ PayOS hoặc SePay code)
        if (payload.containsKey("orderCode") && payload.get("orderCode") != null) {
            return String.valueOf(payload.get("orderCode"));
        }
        if (payload.get("data") instanceof Map<?, ?> dataMap) {
            if (dataMap.containsKey("orderCode") && dataMap.get("orderCode") != null) {
                return String.valueOf(dataMap.get("orderCode"));
            }
        }

        if (content == null || content.isEmpty()) {
            return null;
        }

        // Tìm mẫu "ORD-XXXXXXXX" hoặc "ORD XXXXXXXX" hoặc "ORDXXXXXXXX"
        Pattern pattern = Pattern.compile("(ORD[-_ ]?[A-Za-z0-9]{6,12})", Pattern.CASE_INSENSITIVE);
        Matcher matcher = pattern.matcher(content);
        if (matcher.find()) {
            return matcher.group(1).trim().replace(" ", "-");
        }

        // Tìm mẫu "DH-XXXXXX"
        Pattern dhPattern = Pattern.compile("(DH[-_ ]?[0-9]+)", Pattern.CASE_INSENSITIVE);
        Matcher dhMatcher = dhPattern.matcher(content);
        if (dhMatcher.find()) {
            return dhMatcher.group(1).trim().replace(" ", "-");
        }

        return null;
    }
}
