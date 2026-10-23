# Báo cáo Review & Audit Sản phẩm + Kế hoạch Nâng cấp Hệ thống TechPulse

## 1. Kết quả Audit Toàn diện Hệ thống Hiện tại

Qua quá trình rà soát mã nguồn (`server.ts`, `src/db/schema.ts`, `src/db/queries.ts`, `src/middleware/auth.ts` và toàn bộ các phân hệ React Frontend), hệ thống đã có nền tảng tách biệt Cửa hàng (Storefront) và Cổng Quản trị (Admin Portal) rõ ràng. Tuy nhiên, đợt audit phát hiện các điểm cần khắc phục và nâng cấp để đạt chuẩn vận hành thực tế (Production-grade):

### A. Audit Bảo mật API & Phân quyền (Security & Access Control)
1. **Lỗ hổng IDOR khi hủy đơn hàng (`POST /api/orders/:id/cancel`)**:
   - *Hiện trạng*: Endpoint cho phép hủy bất kỳ đơn hàng `PENDING` nào chỉ bằng `id` mà chưa kiểm tra người gọi có phải là chủ đơn hàng (`order.userId === currentUser.id`) hoặc xác minh thông tin đặt hàng (`orderCode` / `customerPhone`).
   - *Giải pháp*: Bắt buộc xác thực quyền sở hữu đơn hàng (User đang đăng nhập khớp `userId`/`email`, hoặc truyền kèm `orderCode` + `customerPhone` hợp lệ khi hủy từ mục Tra cứu vận đơn, hoặc có quyền `ROLE_ADMIN`).
2. **Rò rỉ thông tin cá nhân qua `GET /api/orders/:id`**:
   - *Hiện trạng*: Endpoint công khai trả về toàn bộ họ tên, số điện thoại, email, địa chỉ giao hàng của khách qua ID số nguyên liên tiếp (`1, 2, 3...`).
   - *Giải pháp*: Yêu cầu xác thực `requireAuth` (chỉ chủ đơn hàng hoặc `ROLE_ADMIN` mới được xem chi tiết theo ID); khách vãng lai chỉ tra cứu qua `/api/orders/lookup` với mã vận đơn `ORD-...` hoặc số điện thoại khớp.
3. **Lỗ hổng toàn vẹn dữ liệu khi xóa sản phẩm (`deleteProductFromDb` trong `src/db/queries.ts`)**:
   - *Hiện trạng*: Hàm xóa sản phẩm chưa xóa bản ghi trong bảng `wishlists` (gây lỗi khóa ngoại PostgreSQL nếu sản phẩm đang nằm trong danh sách yêu thích của khách) và lại xóa trực tiếp `orderItems` của các đơn hàng lịch sử (làm mất chi tiết hóa đơn cũ).
   - *Giải pháp*: Xóa sạch `wishlists` liên quan trước khi xóa sản phẩm; nếu sản phẩm đã phát sinh trong đơn hàng lịch sử, chặn xóa cứng hoặc cảnh báo Admin chuyển trạng thái ngừng kinh doanh (`stock = 0`) để bảo toàn chứng từ kế toán.

### B. Audit Dữ liệu & Nghiệp vụ Đánh giá / Tồn kho (Data & Business Logic)
1. **Độ lệch số lượng đánh giá (`reviewCount`) và thiếu công cụ Kiểm duyệt Review**:
   - *Hiện trạng*: Dữ liệu seed ban đầu gán cứng `reviewCount` (ví dụ: 64, 210) không khớp với số bản ghi thực tế trong bảng `reviews`, khiến điểm trung bình nhảy bất thường khi có đánh giá mới. Ngoài ra, Admin chưa có phân hệ để xem toàn bộ đánh giá, lọc đánh giá 1–2 sao, phản hồi khách hàng hoặc ẩn/xóa đánh giá spam.
   - *Giải pháp*: Đồng bộ chính xác `rating` và `reviewCount` từ dữ liệu thực tế; bổ sung công cụ **Quản lý & Kiểm duyệt Đánh giá (Product Review Moderation)** kèm tính năng **Phản hồi chính thức từ Admin (`adminReply`)** và **Ẩn/Hiện đánh giá (`status: APPROVED | HIDDEN`)**.
2. **Thiếu Nhật ký Biến động Tồn kho & Lịch sử Thao tác Admin (Inventory & Admin Audit Log)**:
   - *Hiện trạng*: Khi kho tăng/giảm do khách đặt hàng, hủy đơn, hoặc Admin bấm `-1 / +1 / +10 / +15`, hệ thống chỉ ghi đè con số cuối cùng mà không lưu lại lịch sử biến động (Ai thực hiện, thời gian nào, số lượng trước → sau, lý do).
   - *Giải pháp*: Xây dựng hệ thống **Audit & Inventory Log** tự động ghi nhận mọi biến động tồn kho (`ORDER_PLACED`, `ORDER_CANCELLED`, `MANUAL_ADJUST`, `PRODUCT_UPDATE`) và các thao tác quản trị quan trọng (`ROLE_CHANGE`, `COUPON_CHANGE`, `REVIEW_MODERATION`, `ORDER_STATUS`).

### C. Audit Giao diện UI/UX & Hiệu năng (Frontend & Visual Polish)
1. **Chuẩn hóa số liệu bảng biểu & chống lỗi ảnh (`Zero-Broken-Image Policy`)**:
   - Áp dụng `font-variant-numeric: tabular-nums` cho toàn bộ cột giá tiền, doanh thu, số lượng kho để các con số thẳng hàng tuyệt đối.
   - Bổ sung cơ chế fallback hình ảnh an toàn trên `ProductCard`, `ProductModal`, và `AdminProducts` để không bao giờ hiển thị khung ảnh vỡ.
2. **Nâng cấp trải nghiệm Đánh giá trên `ProductModal`**:
   - Cho phép khách hàng lọc đánh giá theo số sao (`Tất cả`, `5 Sao`, `4 Sao`, `1-3 Sao`) và hiển thị khung **Phản hồi từ TechPulse Store** ngay dưới nhận xét của khách hàng.

---

## 2. Kiến trúc & Các Hạng mục Triển khai Chi tiết

### Hạng mục 1: Nâng cấp Backend API, Bảo mật & Lưu trữ Nhật ký (`server.ts` & `src/db/queries.ts`)
- **Khắc phục bảo mật & toàn vẹn dữ liệu**:
  - Gia cố `GET /api/orders/:id` và `POST /api/orders/:id/cancel` để kiểm tra quyền sở hữu đơn hàng hoặc quyền `ROLE_ADMIN`.
  - Sửa `deleteProductFromDb` trong `src/db/queries.ts`: dọn dẹp `wishlists` trước khi xóa và kiểm tra ràng buộc `orderItems` để bảo vệ lịch sử hóa đơn.
  - Chuẩn hóa lại số liệu `reviewCount` và `rating` đồng bộ thực tế với bảng `reviews`.
- **API Quản lý & Kiểm duyệt Đánh giá Sản phẩm (Admin Review Moderation)**:
  - `GET /api/reviews` (`requireAdmin`): Lấy toàn bộ danh sách đánh giá kèm thông tin sản phẩm (`productName`, `productImage`), trạng thái hiển thị (`status`), và câu trả lời của Admin (`adminReply`).
  - `PATCH /api/reviews/:id/moderate` (`requireAdmin`): Duyệt/Ẩn đánh giá (`APPROVED` / `HIDDEN`) hoặc cập nhật phản hồi chính thức từ Admin (`adminReply`), tự động tính toán lại điểm sao trung bình của sản phẩm.
  - `DELETE /api/reviews/:id` (`requireAdmin`): Xóa đánh giá vi phạm/spam và cập nhật lại `rating`, `reviewCount` của sản phẩm.
- **API Nhật ký Biến động Tồn kho & Lịch sử Thao tác Admin (`Audit & Inventory Logs`)**:
  - Tự động ghi nhận sự kiện vào nhật ký hệ thống mỗi khi:
    - Khách tạo đơn hàng (trừ kho) hoặc hủy đơn hàng (hoàn kho).
    - Admin điều chỉnh tồn kho nhanh (`PATCH /api/products/:id/stock`), thêm/sửa/xóa sản phẩm.
    - Admin đổi trạng thái đơn hàng, cấp quyền `ROLE_ADMIN`, hoặc kiểm duyệt đánh giá.
  - `GET /api/admin/audit-logs` (`requireAdmin`): Trả về danh sách nhật ký biến động tồn kho và lịch sử thao tác Admin (hỗ trợ lọc theo nhóm `INVENTORY`, `ORDER`, `PRODUCT`, `REVIEW`, `SECURITY`).

### Hạng mục 2: Phân hệ Quản trị Đánh giá & Nhật ký Hệ thống trong `AdminPortal.jsx`
- **Mở rộng Sidebar `AdminPortal.jsx` với 2 phân hệ chuyên sâu mới**:
  1. **Kiểm duyệt Đánh giá (`AdminReviews.jsx`)**:
     - Thống kê nhanh: Tổng số đánh giá, Điểm trung bình toàn sàn, Số đánh giá 5⭐, Số đánh giá cần chú ý (1–3⭐), Số đánh giá đã phản hồi.
     - Bộ lọc theo số sao (`Tất cả`, `5⭐`, `4⭐`, `1-3⭐ Cần xử lý`), theo trạng thái (`Hiển thị` / `Đã ẩn`), và tìm kiếm theo tên sản phẩm hoặc tên khách hàng.
     - Thao tác trực tiếp: Gửi/cập nhật **Phản hồi của Shop**, **Ẩn/Hiện** đánh giá trên trang sản phẩm, hoặc **Xóa** đánh giá spam.
  2. **Nhật ký Tồn kho & Audit (`AdminAuditLogs.jsx`)**:
     - Hiển thị bảng đối soát biến động tồn kho chi tiết: Thời gian, Người thực hiện (`@admin` / Khách đặt đơn), Loại sự kiện (`Xuất kho bán hàng`, `Hoàn kho hủy đơn`, `Nhập/Điều chỉnh kho thủ công`, `Thao tác Quản trị`), Sản phẩm/Đối tượng, Số lượng biến động (`Trước → Sau`, ví dụ: `4 → 19 (+15)`), và Ghi chú/Mã đơn.
     - Hỗ trợ bộ lọc theo loại biến động và nút **Xuất báo cáo Audit CSV**.

### Hạng mục 3: Tối ưu Giao diện Cửa hàng & Modal Chi tiết Sản phẩm (`ProductModal.jsx`, `TrackOrderModal.jsx`, `frontend/src/services/api.js`)
- Cập nhật `ProductModal.jsx`:
  - Chỉ hiển thị các đánh giá có trạng thái `APPROVED`.
  - Thêm thanh lọc nhanh đánh giá theo số sao (`Tất cả`, `5 Sao`, `4 Sao`, `Có phản hồi`).
  - Hiển thị khung **Phản hồi chính thức từ TechPulse Admin** bên dưới đánh giá của khách hàng.
- Cập nhật `TrackOrderModal.jsx` & `api.js`:
  - Truyền kèm mã đơn/số điện thoại xác thực khi khách bấm hủy đơn hàng `PENDING` để tương thích với cơ chế bảo mật chống IDOR mới.
  - Bổ sung các hàm gọi API mới trong `frontend/src/services/api.js` (`getAllReviewsAdmin`, `moderateReview`, `deleteReview`, `getAdminAuditLogs`).
