package com.example.ecommerce.config;

import com.example.ecommerce.model.Category;
import com.example.ecommerce.model.Order;
import com.example.ecommerce.model.OrderItem;
import com.example.ecommerce.model.Product;
import com.example.ecommerce.model.User;
import com.example.ecommerce.repository.CategoryRepository;
import com.example.ecommerce.repository.OrderRepository;
import com.example.ecommerce.repository.ProductRepository;
import com.example.ecommerce.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class DataInitializer implements CommandLineRunner {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;
    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final com.example.ecommerce.repository.ReviewRepository reviewRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        seedUsers();
        seedReviews();

        if (categoryRepository.count() > 0) {
            log.info("Cơ sở dữ liệu danh mục & sản phẩm đã có dữ liệu.");
            return;
        }

        log.info("Bắt đầu khởi tạo dữ liệu mẫu cho hệ thống E-Commerce...");

        // 1. Tạo danh mục
        Category phoneCat = Category.builder()
                .name("Điện thoại & Tablet")
                .slug("phones")
                .icon("smartphone")
                .description("iPhone, Samsung Galaxy, iPad chính hãng")
                .build();

        Category laptopCat = Category.builder()
                .name("Laptop & Máy tính")
                .slug("laptops")
                .icon("laptop")
                .description("MacBook Pro, Dell XPS, ASUS ROG cao cấp")
                .build();

        Category audioCat = Category.builder()
                .name("Âm thanh & Tai nghe")
                .slug("audio")
                .icon("headphones")
                .description("Sony WH-1000XM5, AirPods Pro, Loa Marshall")
                .build();

        Category watchCat = Category.builder()
                .name("Smartwatch & Vòng đeo tay")
                .slug("watches")
                .icon("watch")
                .description("Apple Watch Ultra, Garmin Fenix, Galaxy Watch")
                .build();

        Category accessoryCat = Category.builder()
                .name("Phụ kiện & Gaming Gear")
                .slug("accessories")
                .icon("gamepad")
                .description("Bàn phím cơ Keychron, Chuột Logitech Master")
                .build();

        categoryRepository.saveAll(Arrays.asList(phoneCat, laptopCat, audioCat, watchCat, accessoryCat));

        // 2. Tạo sản phẩm mẫu
        List<Product> products = new ArrayList<>();

        products.add(Product.builder()
                .name("iPhone 16 Pro Max 256GB - Titan Tự Nhiên")
                .description("Chip A18 Pro cực mạnh, camera tiềm vọng zoom 5x, viền titan siêu nhẹ, nút Điều Khiển Camera hoàn toàn mới.")
                .price(new BigDecimal("32990000"))
                .originalPrice(new BigDecimal("34990000"))
                .stock(24)
                .imageUrl("https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80")
                .rating(4.9)
                .reviewCount(128)
                .featured(true)
                .category(phoneCat)
                .build());

        products.add(Product.builder()
                .name("Samsung Galaxy S24 Ultra 5G 512GB")
                .description("Quyền năng Galaxy AI, bút S-Pen tích hợp, khung viền titan và cảm biến chính 200MP siêu sắc nét.")
                .price(new BigDecimal("29490000"))
                .originalPrice(new BigDecimal("31990000"))
                .stock(18)
                .imageUrl("https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80")
                .rating(4.8)
                .reviewCount(95)
                .featured(true)
                .category(phoneCat)
                .build());

        products.add(Product.builder()
                .name("MacBook Pro 16 inch M3 Max (36GB RAM / 1TB SSD)")
                .description("Sức mạnh vượt bậc với vi xử lý Apple M3 Max, màn hình Liquid Retina XDR 120Hz siêu sống động và thời lượng pin 22 giờ.")
                .price(new BigDecimal("68990000"))
                .originalPrice(new BigDecimal("72990000"))
                .stock(10)
                .imageUrl("https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80")
                .rating(5.0)
                .reviewCount(64)
                .featured(true)
                .category(laptopCat)
                .build());

        products.add(Product.builder()
                .name("Dell XPS 14 OLED 2026 Core Ultra 7")
                .description("Thiết kế nhôm nguyên khối tương lai, trackpad tàng hình, màn hình cảm ứng 3.2K OLED 120Hz đỉnh cao.")
                .price(new BigDecimal("45990000"))
                .originalPrice(new BigDecimal("48990000"))
                .stock(12)
                .imageUrl("https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80")
                .rating(4.7)
                .reviewCount(42)
                .featured(false)
                .category(laptopCat)
                .build());

        products.add(Product.builder()
                .name("Sony WH-1000XM5 Chống Ồn Chủ Động Cao Cấp")
                .description("Công nghệ chống ồn hàng đầu thế giới với bộ vi xử lý V1 & QN1, thời lượng pin 30 giờ, âm thanh Hi-Res LDAC.")
                .price(new BigDecimal("7490000"))
                .originalPrice(new BigDecimal("8490000"))
                .stock(35)
                .imageUrl("https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80")
                .rating(4.9)
                .reviewCount(210)
                .featured(true)
                .category(audioCat)
                .build());

        products.add(Product.builder()
                .name("Loa Bluetooth Marshall Stanmore III")
                .description("Âm thanh cổ điển đậm chất rock n' roll, kết nối Bluetooth 5.2, thiết kế bọc da viền đồng sang trọng vượt thời gian.")
                .price(new BigDecimal("9990000"))
                .originalPrice(new BigDecimal("10990000"))
                .stock(15)
                .imageUrl("https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80")
                .rating(4.8)
                .reviewCount(78)
                .featured(false)
                .category(audioCat)
                .build());

        products.add(Product.builder()
                .name("Apple Watch Ultra 2 GPS + Cellular 49mm")
                .description("Vỏ titan 49mm chuẩn quân đội, màn hình 3000 nits siêu sáng, GPS kép tần số và pin 72 giờ ở chế độ tiết kiệm pin.")
                .price(new BigDecimal("20490000"))
                .originalPrice(new BigDecimal("21990000"))
                .stock(14)
                .imageUrl("https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80")
                .rating(4.9)
                .reviewCount(89)
                .featured(true)
                .category(watchCat)
                .build());

        products.add(Product.builder()
                .name("Bàn phím cơ Keychron Q1 Pro Wireless RGB")
                .description("Thân vỏ full nhôm CNC, gõ êm mượt gasket mount, kết nối không dây đa thiết bị, hotswap switch cao cấp.")
                .price(new BigDecimal("4290000"))
                .originalPrice(new BigDecimal("4690000"))
                .stock(20)
                .imageUrl("https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80")
                .rating(4.8)
                .reviewCount(56)
                .featured(false)
                .category(accessoryCat)
                .build());

        products.add(Product.builder()
                .name("Chuột không dây Logitech MX Master 3S")
                .description("Con lăn điện từ MagSpeed cuộn 1000 dòng/giây, cảm biến 8000 DPI trên mọi bề mặt kể cả mặt kính.")
                .price(new BigDecimal("2490000"))
                .originalPrice(new BigDecimal("2790000"))
                .stock(4)
                .imageUrl("https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80")
                .rating(4.9)
                .reviewCount(175)
                .featured(false)
                .category(accessoryCat)
                .build());

        productRepository.saveAll(products);

        // 3. Tạo 2 đơn hàng mẫu
        Product p1 = products.get(0);
        Product p2 = products.get(4);

        Order sampleOrder1 = Order.builder()
                .orderCode("ORD-DEMO-001")
                .customerName("Nguyễn Văn An")
                .customerEmail("an.nguyen@gmail.com")
                .customerPhone("0908123456")
                .shippingAddress("123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh")
                .notes("Giao giờ hành chính")
                .paymentMethod("COD")
                .status("COMPLETED")
                .createdAt(LocalDateTime.now().minusDays(2))
                .items(new ArrayList<>())
                .build();

        OrderItem item1 = OrderItem.builder()
                .order(sampleOrder1)
                .product(p1)
                .quantity(1)
                .price(p1.getPrice())
                .build();

        sampleOrder1.getItems().add(item1);
        sampleOrder1.setTotalAmount(p1.getPrice());
        orderRepository.save(sampleOrder1);

        Order sampleOrder2 = Order.builder()
                .orderCode("ORD-DEMO-002")
                .customerName("Trần Thị Mai")
                .customerEmail("mai.tran@gmail.com")
                .customerPhone("0912987654")
                .shippingAddress("45 Lê Lợi, Quận Hải Châu, Đà Nẵng")
                .notes("Gọi trước khi giao")
                .paymentMethod("MOMO")
                .status("PENDING")
                .createdAt(LocalDateTime.now().minusHours(3))
                .items(new ArrayList<>())
                .build();

        OrderItem item2 = OrderItem.builder()
                .order(sampleOrder2)
                .product(p2)
                .quantity(1)
                .price(p2.getPrice())
                .build();

        sampleOrder2.getItems().add(item2);
        sampleOrder2.setTotalAmount(p2.getPrice());
        orderRepository.save(sampleOrder2);

        log.info("Khởi tạo dữ liệu mẫu thành công.");
    }

    private void seedUsers() {
        if (!userRepository.existsByUsername("admin")) {
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .email("admin@techpulse.vn")
                    .fullName("Quản Trị Viên Hệ Thống")
                    .phone("0900000001")
                    .role("ROLE_ADMIN")
                    .build();
            userRepository.save(admin);
            log.info("Tài khoản Quản trị viên (Admin) mặc định đã được tạo: admin / admin123");
        }

        if (!userRepository.existsByUsername("user")) {
            User user = User.builder()
                    .username("user")
                    .password(passwordEncoder.encode("user123"))
                    .email("user@gmail.com")
                    .fullName("Nguyễn Khách Hàng")
                    .phone("0900000002")
                    .role("ROLE_USER")
                    .build();
            userRepository.save(user);
            log.info("Tài khoản Khách hàng (User) mặc định đã được tạo: user / user123");
        }
    }

    private void seedReviews() {
        if (reviewRepository.count() > 0) {
            return;
        }

        List<Product> products = productRepository.findAll();
        if (products.isEmpty()) {
            return;
        }

        // Tìm iPhone 16 Pro Max (thường là product đầu tiên)
        Product iphone = products.stream()
                .filter(p -> p.getName().contains("iPhone 16 Pro Max"))
                .findFirst()
                .orElse(products.get(0));

        com.example.ecommerce.model.Review r1 = com.example.ecommerce.model.Review.builder()
                .reviewerName("Trần Minh Quân")
                .reviewerEmail("quan.tran@gmail.com")
                .rating(5)
                .comment("Máy cầm nhẹ hơn hẳn bản 15 Pro Max nhờ viền titan xịn xò. Camera chụp đêm xuất sắc, nút Camera Control bấm chụp rất nhạy!")
                .product(iphone)
                .createdAt(LocalDateTime.now().minusDays(2))
                .build();

        com.example.ecommerce.model.Review r2 = com.example.ecommerce.model.Review.builder()
                .reviewerName("Nguyễn Hoàng Long")
                .reviewerEmail("longnh@hotmail.com")
                .rating(5)
                .comment("Pin trâu dùng cả ngày thoải mái, loa ngoài nghe rất ấm và chi tiết. Shop giao hàng hỏa tốc trong 2 tiếng, đóng gói cẩn thận 10 điểm!")
                .product(iphone)
                .createdAt(LocalDateTime.now().minusDays(5))
                .build();

        reviewRepository.saveAll(Arrays.asList(r1, r2));

        // Cập nhật rating cho iphone
        iphone.setRating(5.0);
        iphone.setReviewCount(2);
        productRepository.save(iphone);

        // Tìm sản phẩm thứ 2 (ví dụ MacBook hoặc tai nghe)
        if (products.size() > 1) {
            Product secondProduct = products.get(1);
            com.example.ecommerce.model.Review r3 = com.example.ecommerce.model.Review.builder()
                    .reviewerName("Lê Thu Hà")
                    .reviewerEmail("thuha.tech@yahoo.com")
                    .rating(5)
                    .comment("Thiết kế quá sang trọng, bàn phím gõ êm, màn hình hiển thị màu chuẩn 100% sRGB cho dân đồ họa. Rất đáng đồng tiền bát gạo!")
                    .product(secondProduct)
                    .createdAt(LocalDateTime.now().minusDays(1))
                    .build();
            reviewRepository.save(r3);
            secondProduct.setRating(5.0);
            secondProduct.setReviewCount(1);
            productRepository.save(secondProduct);
        }

        log.info("Đã khởi tạo đánh giá sản phẩm mẫu (Reviews & Ratings).");
    }
}
