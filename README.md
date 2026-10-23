# 🚀 TechPulse E-Commerce — Spring Boot + ReactJS + MySQL

Hệ thống ứng dụng Web Quản lý Bán hàng & Sản phẩm Công nghệ (Full-Stack) với kiến trúc hiện đại:
- **Backend**: Spring Boot 3.3.5 (Java 17, Spring Security 6, JJWT 0.12.6, Multipart File Upload, Spring Data JPA, Hibernate ORM, Bean Validation, RESTful APIs, CORS Filter)
- **Frontend**: React 19 + Vite (Modern Responsive UI, Lucide Icons, Glassmorphism, VietQR Payment Gateway, Cart Drawer, Modals, File Upload Preview, Toast Notifications, Role Guarding)
- **Database**: MySQL 8.4 Server (`ecommerce_db`)

---

## 💳 Thanh toán Chuyển khoản VietQR (NAPAS 247)

Hệ thống tích hợp chuẩn VietQR động:
- Tự động sinh mã QR ngân hàng chuẩn NAPAS 247 theo từng đơn hàng với số tiền chính xác, mã đơn hàng và tên người nhận.
- Hỗ trợ nút sao chép nhanh (1-Click Copy) cho: **Số tài khoản**, **Số tiền**, **Nội dung chuyển khoản**.
- Đồng hồ đếm ngược 15 phút bảo mật cho từng phiên thanh toán.
- Khách hàng có thể quét mã bằng bất kỳ ứng dụng ngân hàng nào (Vietcombank, MB, Techcombank, VPBank, MoMo, v.v.).
- Quản trị viên có thể mở lại mã VietQR của bất kỳ đơn hàng nào trong tab **Đơn hàng**.

---

## 🔐 Tài khoản Trải nghiệm & Phân quyền (Spring Security + JWT)

Hệ thống đã tự động tạo sẵn 2 tài khoản mẫu trong MySQL:

| Vai trò | Tên đăng nhập (Username) | Mật khẩu (Password) | Quyền hạn |
| :--- | :--- | :--- | :--- |
| 👑 **Quản trị viên (Admin)** | `admin` | `admin123` | Xem cửa hàng, Mua hàng, Upload ảnh từ máy, Quản lý kho (CRUD), Quản lý đơn hàng, Xem thống kê |
| 👤 **Khách hàng (User)** | `user` | `user123` | Xem sản phẩm, Lọc danh mục, Thêm giỏ hàng, Đặt hàng trực tuyến, Quét mã VietQR |

*(Tại modal Đăng nhập trên giao diện có nút bấm nhanh **"⚡ Điền nhanh tài khoản thử nghiệm"** để đăng nhập ngay mà không cần gõ phím).*

---

## 📂 Cấu trúc thư mục dự án

```text
c:\Users\84123\OneDrive\Desktop\qq\
├── backend/                  # Mã nguồn Spring Boot Backend
│   ├── src/main/java/com/example/ecommerce/
│   │   ├── config/           # CorsConfig (hỗ trợ static uploads/**), GlobalExceptionHandler, DataInitializer (Seeder)
│   │   ├── controller/       # AuthController, FileUploadController, ProductController, CategoryController, OrderController, DashboardController
│   │   ├── dto/              # ApiResponse, AuthResponseDto, LoginRequestDto, RegisterRequestDto, ProductRequestDto, OrderRequestDto, DashboardStatsDto
│   │   ├── model/            # User, Product, Category, Order, OrderItem
│   │   ├── repository/       # UserRepository, ProductRepository, CategoryRepository, OrderRepository
│   │   ├── security/         # SecurityConfig, JwtTokenProvider, JwtAuthenticationFilter, CustomUserDetailsService
│   │   └── service/          # ProductService, CategoryService, OrderService
│   ├── uploads/              # Thư mục lưu trữ hình ảnh thực tế được tải lên từ máy tính
│   ├── src/main/resources/
│   │   └── application.properties # Cấu hình MySQL, JWT Secret, Multipart file size limits
│   ├── mvnw.cmd              # Maven Wrapper
│   └── pom.xml
└── frontend/                 # Mã nguồn React Frontend (Vite)
    ├── src/
    │   ├── components/       # Navbar, AuthModal, VietQRModal, Storefront, ProductCard, ProductModal, CartDrawer, CheckoutModal, AdminProducts, AdminOrders, Dashboard, Toast
    │   ├── services/api.js   # API Client kèm tự động gắn Authorization Header JWT & File Upload
    │   ├── App.jsx           # Quản lý State toàn cục & Role Guarding
    │   └── index.css         # Hệ thống Design Tokens, gradients, animations
    ├── index.html
    └── package.json
```

---

## 🛠 Hướng dẫn Khởi chạy Hệ thống

### 1. Cơ sở dữ liệu MySQL
- Đảm bảo MySQL service đang chạy trên cổng `3306`.
- Database: `ecommerce_db`
- Tài khoản: `root` / Mật khẩu: `root` (đã được cấu hình trong [application.properties](file:///c:/Users/84123/OneDrive/Desktop/qq/backend/src/main/resources/application.properties)).

### 2. Khởi chạy Backend (Spring Boot)
Mở terminal trong thư mục `backend/`:
```bash
cd backend
.\mvnw.cmd spring-boot:run
```
- Server REST API sẽ chạy tại: **`http://localhost:8080`**

### 3. Khởi chạy Frontend (React + Vite)
Mở terminal trong thư mục `frontend/`:
```bash
cd frontend
npm.cmd run dev
```
- Ứng dụng Web sẽ mở tại: **`http://localhost:5173`** (hoặc `http://127.0.0.1:5173`)
