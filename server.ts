import express, { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import {
  addReviewInDb,
  createCategoryInDb,
  createCouponInDb,
  createLocalUser,
  createOrderInDb,
  createProductInDb,
  deleteCategoryFromDb,
  deleteCouponFromDb,
  deleteProductFromDb,
  deleteReviewFromDb,
  deleteUserFromDb,
  findUserByUsernameOrEmail,
  getAllCategoriesFromDb,
  getAllCouponsFromDb,
  getAllOrdersFromDb,
  getAllProductsFromDb,
  getAllReviewsWithProductFromDb,
  getAllUsersWithStatsFromDb,
  getAuditLogsFromStore,
  getCouponByCodeFromDb,
  getProductByIdFromDb,
  getReviewsByProductFromDb,
  getUserWishlistIdsFromDb,
  hashPassword,
  moderateReviewInDb,
  recordAuditLog,
  toggleWishlistItemInDb,
  updateCategoryInDb,
  updateCouponInDb,
  updateOrderStatusInDb,
  updateProductInDb,
  updateUserPasswordInDb,
  updateUserProfileInDb,
  updateUserRoleInDb,
  verifyPassword,
} from './src/db/queries.ts';
import {
  AuthRequest,
  requireAdmin,
  requireAuth,
  resolveUserFromRequest,
  signJwt,
} from './src/middleware/auth.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Ensure uploads directory exists
const uploadDir = path.resolve(__dirname, 'backend', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure Multer for file uploads
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const newFilename = `prod_${crypto.randomUUID().substring(0, 8)}${ext}`;
    cb(null, newFilename);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

function apiSuccess<T>(data: T, message: string) {
  return {
    success: true,
    message,
    data,
    timestamp: new Date().toISOString(),
  };
}

function apiError(message: string) {
  return {
    success: false,
    message,
    data: null,
    timestamp: new Date().toISOString(),
  };
}

function calculateCouponDiscount(
  coupon: {
    code: string;
    active: boolean;
    usedCount: number;
    usageLimit: number;
    expiryDate: string;
    minOrderAmount: number;
    discountType: string;
    discountValue: number;
    maxDiscountAmount: number | null;
  },
  subtotal: number
): { valid: boolean; discount: number; reason?: string } {
  if (!coupon.active) {
    return { valid: false, discount: 0, reason: 'Mã giảm giá này hiện đã tạm ngưng!' };
  }
  if (coupon.usedCount >= coupon.usageLimit) {
    return { valid: false, discount: 0, reason: 'Mã giảm giá đã hết lượt sử dụng!' };
  }
  if (coupon.expiryDate) {
    const exp = new Date(coupon.expiryDate + 'T23:59:59');
    if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) {
      return { valid: false, discount: 0, reason: 'Mã giảm giá đã hết hạn sử dụng!' };
    }
  }
  if (subtotal < coupon.minOrderAmount) {
    const formattedMin = new Intl.NumberFormat('vi-VN').format(coupon.minOrderAmount);
    return {
      valid: false,
      discount: 0,
      reason: `Đơn hàng tối thiểu cần đạt ${formattedMin} ₫ để áp dụng mã ${coupon.code}`,
    };
  }

  let discount = 0;
  if (coupon.discountType === 'PERCENT') {
    discount = Math.round((subtotal * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount && coupon.maxDiscountAmount > 0) {
      discount = Math.min(discount, coupon.maxDiscountAmount);
    }
  } else {
    discount = coupon.discountValue;
  }
  discount = Math.min(discount, subtotal);
  return { valid: true, discount };
}

async function startServer() {
  const app = express();

  app.use(express.json({ limit: '15mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadDir));

  // ================= AUTH CONTROLLER =================

  app.post('/api/auth/firebase-sync', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const authHeader = req.headers.authorization || '';
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : '';

      return res.json(
        apiSuccess(
          {
            token,
            id: user.id,
            uid: user.uid,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            role: user.role,
          },
          'Đồng bộ tài khoản Google với PostgreSQL thành công'
        )
      );
    } catch (error: any) {
      console.error('Failed to sync Firebase user:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi đồng bộ tài khoản Google'));
    }
  });

  app.post('/api/auth/login', async (req: Request, res: Response) => {
    try {
      const { username, password } = req.body || {};
      if (!username || !password) {
        return res
          .status(400)
          .json(apiError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'));
      }

      const cleanInput = String(username).trim();
      const user = await findUserByUsernameOrEmail(cleanInput);

      if (!user || !verifyPassword(String(password), user.passwordHash)) {
        return res
          .status(401)
          .json(apiError('Tên đăng nhập hoặc mật khẩu không chính xác!'));
      }

      const token = signJwt(user);
      return res.json(
        apiSuccess(
          {
            token,
            id: user.id,
            uid: user.uid,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            role: user.role,
          },
          'Đăng nhập thành công'
        )
      );
    } catch (error: any) {
      console.error('Login error:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi đăng nhập hệ thống'));
    }
  });

  app.post('/api/auth/register', async (req: Request, res: Response) => {
    try {
      const { username, email, password, fullName, phone, address } = req.body || {};
      if (!username || !email || !password || !fullName) {
        return res.status(400).json(apiError('Vui lòng điền đầy đủ thông tin bắt buộc!'));
      }

      const cleanUsername = String(username).trim();
      const cleanEmail = String(email).trim();

      if (String(password).length < 6) {
        return res.status(400).json(apiError('Mật khẩu phải có ít nhất 6 ký tự!'));
      }

      const existingByUsername = await findUserByUsernameOrEmail(cleanUsername);
      if (existingByUsername) {
        return res
          .status(400)
          .json(apiError(`Username '${cleanUsername}' đã được sử dụng!`));
      }

      const existingByEmail = await findUserByUsernameOrEmail(cleanEmail);
      if (existingByEmail) {
        return res.status(400).json(apiError(`Email '${cleanEmail}' đã được đăng ký!`));
      }

      const newUser = await createLocalUser({
        username: cleanUsername,
        email: cleanEmail,
        passwordHash: hashPassword(String(password)),
        fullName: String(fullName).trim(),
        phone: phone ? String(phone).trim() : '',
        address: address ? String(address).trim() : '',
      });

      const token = signJwt(newUser);
      return res.status(201).json(
        apiSuccess(
          {
            token,
            id: newUser.id,
            uid: newUser.uid,
            username: newUser.username,
            email: newUser.email,
            fullName: newUser.fullName,
            phone: newUser.phone,
            address: newUser.address,
            role: newUser.role,
          },
          'Đăng ký tài khoản thành công'
        )
      );
    } catch (error: any) {
      console.error('Register error:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi đăng ký tài khoản'));
    }
  });

  app.get('/api/auth/me', async (req: Request, res: Response) => {
    try {
      const user = await resolveUserFromRequest(req);
      if (!user) {
        return res.json(apiSuccess(null, 'Chưa đăng nhập'));
      }
      return res.json(
        apiSuccess(
          {
            id: user.id,
            uid: user.uid,
            username: user.username,
            email: user.email,
            fullName: user.fullName,
            phone: user.phone,
            address: user.address,
            role: user.role,
          },
          'Thông tin tài khoản hiện tại'
        )
      );
    } catch (error: any) {
      console.error('Get me error:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi tải thông tin tài khoản'));
    }
  });

  app.put('/api/auth/profile', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const { fullName, email, phone, address } = req.body || {};

      if (!fullName || !String(fullName).trim()) {
        return res.status(400).json(apiError('Họ và tên không được để trống!'));
      }

      const updates: {
        fullName?: string;
        email?: string;
        phone?: string;
        address?: string;
      } = {
        fullName: String(fullName).trim(),
      };

      if (email && String(email).trim()) {
        const cleanEmail = String(email).trim();
        const duplicate = await findUserByUsernameOrEmail(cleanEmail);
        if (duplicate && duplicate.id !== user.id) {
          return res
            .status(400)
            .json(apiError('Email này đã được sử dụng bởi tài khoản khác!'));
        }
        updates.email = cleanEmail;
      }

      if (phone !== undefined) updates.phone = String(phone).trim();
      if (address !== undefined) updates.address = String(address).trim();

      const updatedUser = await updateUserProfileInDb(user.id, updates);

      return res.json(
        apiSuccess(
          {
            id: updatedUser.id,
            uid: updatedUser.uid,
            username: updatedUser.username,
            email: updatedUser.email,
            fullName: updatedUser.fullName,
            phone: updatedUser.phone,
            address: updatedUser.address,
            role: updatedUser.role,
          },
          'Cập nhật thông tin cá nhân thành công!'
        )
      );
    } catch (error: any) {
      console.error('Update profile error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật hồ sơ'));
    }
  });

  app.put('/api/auth/password', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const { currentPassword, newPassword } = req.body || {};

      if (!newPassword || String(newPassword).length < 6) {
        return res.status(400).json(apiError('Mật khẩu mới phải có tối thiểu 6 ký tự!'));
      }

      if (user.passwordHash !== 'firebase_oauth') {
        if (!currentPassword || !verifyPassword(String(currentPassword), user.passwordHash)) {
          return res.status(400).json(apiError('Mật khẩu hiện tại không chính xác!'));
        }
      }

      await updateUserPasswordInDb(user.id, hashPassword(String(newPassword)));
      return res.json(apiSuccess(null, 'Đổi mật khẩu thành công!'));
    } catch (error: any) {
      console.error('Update password error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể đổi mật khẩu'));
    }
  });

  // ================= ADMIN USER MANAGEMENT & WISHLIST CONTROLLER =================

  app.get('/api/users', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const usersList = await getAllUsersWithStatsFromDb();
      return res.json(apiSuccess(usersList, 'Lấy danh sách tài khoản khách hàng thành công'));
    } catch (error: any) {
      console.error('Get users error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh sách khách hàng'));
    }
  });

  app.patch('/api/users/:id/role', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const targetId = Number(req.params.id);
      const currentAdmin = req.currentUser!;
      const newRole = String(req.body?.role || '').trim().toUpperCase();

      if (newRole !== 'ROLE_ADMIN' && newRole !== 'ROLE_USER') {
        return res.status(400).json(apiError('Quyền hạn không hợp lệ (chỉ hỗ trợ ROLE_ADMIN hoặc ROLE_USER)'));
      }

      if (targetId === currentAdmin.id && newRole !== 'ROLE_ADMIN') {
        return res.status(400).json(apiError('Bạn không thể tự hạ quyền Quản trị viên của chính mình!'));
      }

      const updated = await updateUserRoleInDb(targetId, newRole);
      if (!updated) {
        return res.status(404).json(apiError('Không tìm thấy tài khoản người dùng!'));
      }

      recordAuditLog({
        category: 'SECURITY',
        action: 'USER_ROLE_CHANGE',
        actor: currentAdmin.username || 'admin',
        targetName: `@${updated.username} (${updated.email})`,
        targetId: updated.id,
        prevStock: null,
        newStock: null,
        delta: null,
        details: `Thay đổi phân quyền RBAC tài khoản @${updated.username} sang ${newRole}`,
      });

      return res.json(
        apiSuccess(
          updated,
          `Đã cập nhật quyền tài khoản @${updated.username} thành ${
            newRole === 'ROLE_ADMIN' ? 'Quản trị viên' : 'Khách hàng'
          }`
        )
      );
    } catch (error: any) {
      console.error('Update user role error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật quyền người dùng'));
    }
  });

  app.delete('/api/users/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const targetId = Number(req.params.id);
      const currentAdmin = req.currentUser!;

      if (targetId === currentAdmin.id) {
        return res.status(400).json(apiError('Bạn không thể tự xóa tài khoản Quản trị viên đang đăng nhập!'));
      }

      const ok = await deleteUserFromDb(targetId);
      if (!ok) {
        return res.status(404).json(apiError('Không tìm thấy tài khoản cần xóa!'));
      }

      return res.json(apiSuccess(null, 'Đã xóa tài khoản người dùng thành công'));
    } catch (error: any) {
      console.error('Delete user error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể xóa tài khoản người dùng'));
    }
  });

  app.get('/api/wishlist', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const wishlistIds = await getUserWishlistIdsFromDb(user.id);
      return res.json(apiSuccess(wishlistIds, 'Lấy danh sách yêu thích từ PostgreSQL thành công'));
    } catch (error: any) {
      console.error('Get wishlist error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh sách yêu thích'));
    }
  });

  app.post('/api/wishlist/toggle', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const productId = Number(req.body?.productId);
      if (!productId || isNaN(productId)) {
        return res.status(400).json(apiError('Mã sản phẩm không hợp lệ'));
      }
      const result = await toggleWishlistItemInDb(user.id, productId);
      return res.json(
        apiSuccess(
          result,
          result.added
            ? 'Đã lưu sản phẩm vào danh sách yêu thích trên PostgreSQL'
            : 'Đã bỏ sản phẩm khỏi danh sách yêu thích'
        )
      );
    } catch (error: any) {
      console.error('Toggle wishlist error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật danh sách yêu thích'));
    }
  });

  // ================= CATEGORY CONTROLLER =================

  app.get('/api/categories', async (_req: Request, res: Response) => {
    try {
      const list = await getAllCategoriesFromDb();
      return res.json(apiSuccess(list, 'Lấy danh sách danh mục thành công'));
    } catch (error: any) {
      console.error('Get categories error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh mục'));
    }
  });

  app.get('/api/categories/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const list = await getAllCategoriesFromDb();
      const category = list.find((c) => c.id === id);
      if (!category) {
        return res.status(404).json(apiError(`Không tìm thấy danh mục có ID: ${id}`));
      }
      return res.json(apiSuccess(category, 'Lấy thông tin danh mục thành công'));
    } catch (error: any) {
      console.error('Get category error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh mục'));
    }
  });

  app.post('/api/categories', requireAdmin, async (req: Request, res: Response) => {
    try {
      const { name, slug, icon, description } = req.body || {};
      if (!name || !String(name).trim()) {
        return res.status(400).json(apiError('Tên danh mục không được để trống!'));
      }

      const cleanName = String(name).trim();
      const generatedSlug = slug
        ? String(slug).trim().toLowerCase()
        : cleanName
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');

      const list = await getAllCategoriesFromDb();
      if (
        list.some(
          (c) =>
            c.slug.toLowerCase() === generatedSlug ||
            c.name.toLowerCase() === cleanName.toLowerCase()
        )
      ) {
        return res.status(400).json(apiError('Tên hoặc đường dẫn (slug) danh mục đã tồn tại!'));
      }

      const newCat = await createCategoryInDb({
        name: cleanName,
        slug: generatedSlug || `cat-${Date.now()}`,
        icon: icon ? String(icon).trim() : 'box',
        description: description ? String(description).trim() : '',
      });
      return res.status(201).json(apiSuccess(newCat, 'Tạo danh mục mới thành công'));
    } catch (error: any) {
      console.error('Create category error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tạo danh mục'));
    }
  });

  app.put('/api/categories/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { name, slug, icon, description } = req.body || {};
      const updates: { name?: string; slug?: string; icon?: string; description?: string } = {};

      if (name !== undefined && String(name).trim()) updates.name = String(name).trim();
      if (slug !== undefined && String(slug).trim()) {
        updates.slug = String(slug).trim().toLowerCase();
      }
      if (icon !== undefined) updates.icon = String(icon).trim() || 'box';
      if (description !== undefined) updates.description = String(description).trim();

      const updated = await updateCategoryInDb(id, updates);
      if (!updated) {
        return res.status(404).json(apiError(`Không tìm thấy danh mục có ID: ${id}`));
      }

      return res.json(apiSuccess(updated, 'Cập nhật danh mục thành công'));
    } catch (error: any) {
      console.error('Update category error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật danh mục'));
    }
  });

  app.delete('/api/categories/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const allProducts = await getAllProductsFromDb();
      const linkedProducts = allProducts.filter((p) => p.category && p.category.id === id);

      if (linkedProducts.length > 0) {
        return res.status(400).json(
          apiError(
            `Không thể xóa danh mục này vì đang có ${linkedProducts.length} sản phẩm thuộc danh mục. Vui lòng chuyển sản phẩm sang danh mục khác trước!`
          )
        );
      }

      await deleteCategoryFromDb(id);
      return res.json(apiSuccess(null, 'Xóa danh mục thành công'));
    } catch (error: any) {
      console.error('Delete category error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể xóa danh mục'));
    }
  });

  // ================= COUPON / VOUCHER CONTROLLER =================

  app.get('/api/coupons/active', async (_req: Request, res: Response) => {
    try {
      const all = await getAllCouponsFromDb();
      const activeCoupons = all.filter((c) => {
        if (!c.active) return false;
        if (c.usedCount >= c.usageLimit) return false;
        if (c.expiryDate) {
          const exp = new Date(c.expiryDate + 'T23:59:59');
          if (!isNaN(exp.getTime()) && exp.getTime() < Date.now()) return false;
        }
        return true;
      });
      return res.json(
        apiSuccess(activeCoupons, 'Lấy danh sách mã giảm giá đang hoạt động')
      );
    } catch (error: any) {
      console.error('Get active coupons error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải mã giảm giá'));
    }
  });

  app.post('/api/coupons/validate', async (req: Request, res: Response) => {
    try {
      const { code, orderTotal, orderAmount } = req.body || {};
      if (!code || !String(code).trim()) {
        return res.status(400).json(apiError('Vui lòng nhập mã giảm giá!'));
      }

      const cleanCode = String(code).trim().toUpperCase();
      const coupon = await getCouponByCodeFromDb(cleanCode);
      if (!coupon) {
        return res
          .status(404)
          .json(apiError(`Mã giảm giá '${cleanCode}' không tồn tại!`));
      }

      const subtotal = Number(orderAmount ?? orderTotal) || 0;
      const evaluation = calculateCouponDiscount(coupon, subtotal);
      if (!evaluation.valid) {
        return res
          .status(400)
          .json(apiError(evaluation.reason || 'Mã giảm giá không hợp lệ!'));
      }

      return res.json(
        apiSuccess(
          {
            coupon,
            discountAmount: evaluation.discount,
            finalAmount: Math.max(0, subtotal - evaluation.discount),
          },
          `Áp dụng mã ${coupon.code} thành công!`
        )
      );
    } catch (error: any) {
      console.error('Validate coupon error:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi kiểm tra mã giảm giá'));
    }
  });

  app.get('/api/coupons', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const all = await getAllCouponsFromDb();
      return res.json(apiSuccess(all, 'Lấy toàn bộ danh sách mã giảm giá thành công'));
    } catch (error: any) {
      console.error('Get coupons error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải mã giảm giá'));
    }
  });

  app.post('/api/coupons', requireAdmin, async (req: Request, res: Response) => {
    try {
      const {
        code,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        active,
        expiryDate,
      } = req.body || {};

      if (!code || !String(code).trim()) {
        return res.status(400).json(apiError('Mã giảm giá (Code) không được để trống!'));
      }

      const cleanCode = String(code).trim().toUpperCase().replace(/\s+/g, '');
      const existing = await getCouponByCodeFromDb(cleanCode);
      if (existing) {
        return res.status(400).json(apiError(`Mã giảm giá '${cleanCode}' đã tồn tại!`));
      }

      const val = Number(discountValue);
      if (isNaN(val) || val <= 0) {
        return res.status(400).json(apiError('Giá trị giảm giá phải lớn hơn 0!'));
      }

      const newCoupon = await createCouponInDb({
        code: cleanCode,
        description: description ? String(description).trim() : `Mã ưu đãi ${cleanCode}`,
        discountType: discountType === 'FIXED' ? 'FIXED' : 'PERCENT',
        discountValue: val,
        minOrderAmount: Math.max(0, Number(minOrderAmount) || 0),
        maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : null,
        usageLimit: Math.max(1, Number(usageLimit) || 50),
        active: active !== undefined ? Boolean(active) : true,
        expiryDate: expiryDate ? String(expiryDate) : '2027-12-31',
      });

      return res.status(201).json(apiSuccess(newCoupon, 'Tạo mã giảm giá thành công'));
    } catch (error: any) {
      console.error('Create coupon error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tạo mã giảm giá'));
    }
  });

  app.put('/api/coupons/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const {
        code,
        description,
        discountType,
        discountValue,
        minOrderAmount,
        maxDiscountAmount,
        usageLimit,
        active,
        expiryDate,
      } = req.body || {};

      const updates: Record<string, any> = {};
      if (code !== undefined && String(code).trim()) {
        updates.code = String(code).trim().toUpperCase().replace(/\s+/g, '');
      }
      if (description !== undefined) updates.description = String(description).trim();
      if (discountType === 'PERCENT' || discountType === 'FIXED') {
        updates.discountType = discountType;
      }
      if (discountValue !== undefined) {
        updates.discountValue = Math.max(0, Number(discountValue));
      }
      if (minOrderAmount !== undefined) {
        updates.minOrderAmount = Math.max(0, Number(minOrderAmount));
      }
      if (maxDiscountAmount !== undefined) {
        updates.maxDiscountAmount = maxDiscountAmount ? Number(maxDiscountAmount) : null;
      }
      if (usageLimit !== undefined) {
        updates.usageLimit = Math.max(1, Number(usageLimit));
      }
      if (active !== undefined) updates.active = Boolean(active);
      if (expiryDate !== undefined) updates.expiryDate = String(expiryDate);

      const updated = await updateCouponInDb(id, updates);
      if (!updated) {
        return res.status(404).json(apiError('Không tìm thấy mã giảm giá!'));
      }

      return res.json(apiSuccess(updated, 'Cập nhật mã giảm giá thành công'));
    } catch (error: any) {
      console.error('Update coupon error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật mã giảm giá'));
    }
  });

  app.delete('/api/coupons/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const ok = await deleteCouponFromDb(id);
      if (!ok) {
        return res.status(404).json(apiError('Không tìm thấy mã giảm giá!'));
      }
      return res.json(apiSuccess(null, 'Xóa mã giảm giá thành công'));
    } catch (error: any) {
      console.error('Delete coupon error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể xóa mã giảm giá'));
    }
  });

  // ================= PRODUCT CONTROLLER =================

  app.get('/api/products/featured', async (_req: Request, res: Response) => {
    try {
      const all = await getAllProductsFromDb();
      const featuredList = all.filter((p) => p.featured);
      return res.json(apiSuccess(featuredList, 'Lấy danh sách sản phẩm nổi bật thành công'));
    } catch (error: any) {
      console.error('Get featured products error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải sản phẩm nổi bật'));
    }
  });

  app.get('/api/products', async (req: Request, res: Response) => {
    try {
      const { categoryId, search, keyword, featured, sortBy, minPrice, maxPrice } = req.query;
      const searchQuery = search ?? keyword;
      let result = await getAllProductsFromDb();

      if (categoryId) {
        const cid = Number(categoryId);
        result = result.filter((p) => p.category && p.category.id === cid);
      }
      if (searchQuery && String(searchQuery).trim() !== '') {
        const q = String(searchQuery).trim().toLowerCase();
        result = result.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.description && p.description.toLowerCase().includes(q)) ||
            (p.category && p.category.name.toLowerCase().includes(q))
        );
      }
      if (featured !== undefined) {
        const isFeatured = String(featured) === 'true';
        result = result.filter((p) => p.featured === isFeatured);
      }

      if (minPrice !== undefined && String(minPrice) !== '') {
        const min = Number(minPrice);
        if (!isNaN(min)) result = result.filter((p) => p.price >= min);
      }
      if (maxPrice !== undefined && String(maxPrice) !== '') {
        const max = Number(maxPrice);
        if (!isNaN(max) && max > 0) result = result.filter((p) => p.price <= max);
      }

      if (sortBy) {
        switch (String(sortBy)) {
          case 'price_asc':
          case 'price-asc':
            result.sort((a, b) => a.price - b.price);
            break;
          case 'price_desc':
          case 'price-desc':
            result.sort((a, b) => b.price - a.price);
            break;
          case 'rating':
            result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
            break;
          case 'name':
            result.sort((a, b) => a.name.localeCompare(b.name, 'vi'));
            break;
          case 'createdAt':
          case 'newest':
          default:
            result.sort((a, b) => b.id - a.id);
            break;
        }
      } else {
        result.sort((a, b) => b.id - a.id);
      }

      return res.json(apiSuccess(result, 'Lấy danh sách sản phẩm thành công'));
    } catch (error: any) {
      console.error('Get products error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh sách sản phẩm'));
    }
  });

  app.get('/api/products/:id', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const product = await getProductByIdFromDb(id);
      if (!product) {
        return res.status(404).json(apiError(`Không tìm thấy sản phẩm có ID: ${id}`));
      }
      return res.json(apiSuccess(product, 'Lấy thông tin sản phẩm thành công'));
    } catch (error: any) {
      console.error('Get product error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải thông tin sản phẩm'));
    }
  });

  app.post('/api/products', requireAdmin, async (req: Request, res: Response) => {
    try {
      const dto = req.body || {};
      if (!dto.name || dto.price === undefined || dto.stock === undefined) {
        return res
          .status(400)
          .json(apiError('Vui lòng nhập đầy đủ tên sản phẩm, giá bán và tồn kho'));
      }

      const newProduct = await createProductInDb({
        name: String(dto.name).trim(),
        description: dto.description ? String(dto.description) : '',
        price: Number(dto.price),
        originalPrice:
          dto.originalPrice !== undefined && dto.originalPrice !== null
            ? Number(dto.originalPrice)
            : Number(dto.price),
        stock: Number(dto.stock),
        imageUrl: dto.imageUrl
          ? String(dto.imageUrl)
          : 'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=800&q=80',
        featured: Boolean(dto.featured),
        categoryId: dto.categoryId ? Number(dto.categoryId) : null,
      });

      return res.status(201).json(apiSuccess(newProduct, 'Thêm sản phẩm mới thành công'));
    } catch (error: any) {
      console.error('Create product error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tạo sản phẩm mới'));
    }
  });

  app.put('/api/products/:id', requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const dto = req.body || {};

      const updated = await updateProductInDb(id, {
        name: dto.name !== undefined ? String(dto.name).trim() : undefined,
        description: dto.description !== undefined ? String(dto.description) : undefined,
        price: dto.price !== undefined ? Number(dto.price) : undefined,
        originalPrice:
          dto.originalPrice !== undefined && dto.originalPrice !== null
            ? Number(dto.originalPrice)
            : dto.price !== undefined
              ? Number(dto.price)
              : undefined,
        stock: dto.stock !== undefined ? Number(dto.stock) : undefined,
        imageUrl: dto.imageUrl !== undefined ? String(dto.imageUrl) : undefined,
        featured: dto.featured !== undefined ? Boolean(dto.featured) : undefined,
        categoryId: dto.categoryId !== undefined ? (dto.categoryId ? Number(dto.categoryId) : null) : undefined,
      });

      if (!updated) {
        return res.status(404).json(apiError(`Không tìm thấy sản phẩm có ID: ${id}`));
      }

      return res.json(apiSuccess(updated, 'Cập nhật sản phẩm thành công'));
    } catch (error: any) {
      console.error('Update product error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật sản phẩm'));
    }
  });

  app.delete('/api/products/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existing = await getProductByIdFromDb(id);
      if (!existing) {
        return res.status(404).json(apiError(`Không tìm thấy sản phẩm có ID: ${id}`));
      }
      const ok = await deleteProductFromDb(id);
      if (!ok) {
        return res.status(404).json(apiError(`Không tìm thấy sản phẩm có ID: ${id}`));
      }

      recordAuditLog({
        category: 'PRODUCT',
        action: 'PRODUCT_DELETED',
        actor: req.currentUser?.username || 'admin',
        targetName: existing.name,
        targetId: id,
        prevStock: existing.stock,
        newStock: 0,
        delta: -existing.stock,
        details: `Xóa sản phẩm "${existing.name}" khỏi danh mục thiết bị`,
      });

      return res.json(apiSuccess(null, 'Xóa sản phẩm thành công'));
    } catch (error: any) {
      console.error('Delete product error:', error);
      return res.status(400).json(apiError(error.message || 'Không thể xóa sản phẩm'));
    }
  });

  app.patch('/api/products/:id/stock', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const existing = await getProductByIdFromDb(id);
      if (!existing) {
        return res.status(404).json(apiError(`Không tìm thấy sản phẩm có ID: ${id}`));
      }

      const { stock, delta, reason } = req.body || {};
      let nextStock = existing.stock;
      if (stock !== undefined && stock !== null) {
        nextStock = Math.max(0, Number(stock));
      } else if (delta !== undefined && delta !== null) {
        nextStock = Math.max(0, existing.stock + Number(delta));
      }

      const updated = await updateProductInDb(id, { stock: nextStock });
      const actualDelta = nextStock - existing.stock;

      recordAuditLog({
        category: 'INVENTORY',
        action: actualDelta >= 0 ? 'STOCK_RESTOCK' : 'STOCK_DEDUCT',
        actor: req.currentUser?.username || 'admin',
        targetName: existing.name,
        targetId: existing.id,
        prevStock: existing.stock,
        newStock: nextStock,
        delta: actualDelta,
        details: reason
          ? String(reason)
          : `Điều chỉnh tồn kho trực tiếp từ Admin (${existing.stock} → ${nextStock}, chênh lệch ${actualDelta >= 0 ? '+' + actualDelta : actualDelta})`,
      });

      return res.json(
        apiSuccess(
          updated,
          `Đã cập nhật tồn kho "${existing.name}": ${existing.stock} → ${nextStock}`
        )
      );
    } catch (error: any) {
      console.error('Update product stock error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật tồn kho'));
    }
  });

  // ================= REVIEW & MODERATION CONTROLLER =================

  app.get('/api/reviews', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const allReviews = await getAllReviewsWithProductFromDb();
      return res.json(
        apiSuccess(allReviews, 'Lấy toàn bộ danh sách đánh giá sản phẩm thành công')
      );
    } catch (error: any) {
      console.error('Get all reviews error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh sách đánh giá'));
    }
  });

  app.patch('/api/reviews/:id/moderate', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const { status, adminReply } = req.body || {};
      const actor = req.currentUser?.username || 'admin';

      const updated = await moderateReviewInDb(id, {
        status,
        adminReply,
        actor,
      });

      if (!updated) {
        return res.status(404).json(apiError('Không tìm thấy đánh giá cần kiểm duyệt!'));
      }

      recordAuditLog({
        category: 'REVIEW',
        action:
          adminReply !== undefined ? 'REVIEW_REPLIED' : status === 'HIDDEN' ? 'REVIEW_HIDDEN' : 'REVIEW_APPROVED',
        actor,
        targetName: `${updated.productName} (${updated.reviewerName} • ${updated.rating}⭐)`,
        targetId: updated.id,
        prevStock: null,
        newStock: null,
        delta: null,
        details:
          adminReply !== undefined
            ? `Phản hồi đánh giá của ${updated.reviewerName}: "${String(adminReply).slice(0, 80)}"`
            : `Cập nhật trạng thái hiển thị đánh giá #${updated.id} sang ${updated.status}`,
      });

      return res.json(
        apiSuccess(updated, 'Đã cập nhật kiểm duyệt / phản hồi đánh giá thành công!')
      );
    } catch (error: any) {
      console.error('Moderate review error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể kiểm duyệt đánh giá'));
    }
  });

  app.delete('/api/reviews/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const deleted = await deleteReviewFromDb(id);
      if (!deleted) {
        return res.status(404).json(apiError('Không tìm thấy đánh giá cần xóa!'));
      }

      recordAuditLog({
        category: 'REVIEW',
        action: 'REVIEW_DELETED',
        actor: req.currentUser?.username || 'admin',
        targetName: `Review #${id} (${deleted.reviewerName} • ${deleted.rating}⭐)`,
        targetId: id,
        prevStock: null,
        newStock: null,
        delta: null,
        details: `Xóa vĩnh viễn đánh giá của "${deleted.reviewerName}" trên sản phẩm ID #${deleted.productId}`,
      });

      return res.json(apiSuccess(null, 'Đã xóa đánh giá và cập nhật lại điểm sao sản phẩm'));
    } catch (error: any) {
      console.error('Delete review error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể xóa đánh giá'));
    }
  });

  app.get('/api/products/:productId/reviews', async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.productId);
      const productReviews = await getReviewsByProductFromDb(productId, false);
      return res.json(apiSuccess(productReviews, 'Lấy danh sách đánh giá thành công'));
    } catch (error: any) {
      console.error('Get reviews error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải đánh giá'));
    }
  });

  app.post('/api/products/:productId/reviews', async (req: Request, res: Response) => {
    try {
      const productId = Number(req.params.productId);
      const product = await getProductByIdFromDb(productId);
      if (!product) {
        return res.status(404).json(apiError(`Không tìm thấy sản phẩm có ID: ${productId}`));
      }

      const { reviewerName, reviewerEmail, rating, comment } = req.body || {};
      if (!reviewerName || !comment || rating === undefined) {
        return res.status(400).json(apiError('Vui lòng nhập đầy đủ tên, số sao và nhận xét'));
      }

      const newReview = await addReviewInDb({
        productId,
        reviewerName: String(reviewerName).trim(),
        reviewerEmail: reviewerEmail ? String(reviewerEmail).trim() : '',
        rating: Math.min(5, Math.max(1, Number(rating))),
        comment: String(comment).trim(),
      });

      recordAuditLog({
        category: 'REVIEW',
        action: 'NEW_CUSTOMER_REVIEW',
        actor: String(reviewerName).trim(),
        targetName: product.name,
        targetId: newReview.id,
        prevStock: null,
        newStock: null,
        delta: null,
        details: `Khách hàng gửi đánh giá ${newReview.rating}⭐: "${String(comment).trim().slice(0, 80)}"`,
      });

      return res.status(201).json(apiSuccess(newReview, 'Gửi đánh giá sản phẩm thành công'));
    } catch (error: any) {
      console.error('Create review error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể gửi đánh giá'));
    }
  });

  // ================= ORDER CONTROLLER =================

  app.post('/api/orders', async (req: Request, res: Response) => {
    try {
      const dto = req.body || {};
      if (
        !dto.customerName ||
        !dto.customerPhone ||
        !dto.shippingAddress ||
        !Array.isArray(dto.items) ||
        dto.items.length === 0
      ) {
        return res
          .status(400)
          .json(apiError('Vui lòng nhập đầy đủ thông tin giao hàng và giỏ hàng'));
      }

      const currentUser = await resolveUserFromRequest(req);
      let subtotal = 0;
      const preparedItems: Array<{
        productId: number;
        productName: string;
        productImage: string;
        selectedVariant: string;
        quantity: number;
        price: number;
        newStock: number;
      }> = [];

      // Consolidate stock checks if multiple variants of the same product are in the cart
      const stockUsageByProduct = new Map<number, number>();

      for (const itemReq of dto.items) {
        const product = await getProductByIdFromDb(Number(itemReq.productId));
        if (!product) {
          return res
            .status(404)
            .json(apiError(`Không tìm thấy sản phẩm có ID: ${itemReq.productId}`));
        }
        const qty = Number(itemReq.quantity) || 1;
        const usedSoFar = stockUsageByProduct.get(product.id) || 0;
        if (product.stock < usedSoFar + qty) {
          return res
            .status(400)
            .json(
              apiError(
                `Sản phẩm '${product.name}' chỉ còn ${product.stock} sản phẩm trong kho!`
              )
            );
        }
        stockUsageByProduct.set(product.id, usedSoFar + qty);

        const unitPrice =
          itemReq.unitPrice && Number(itemReq.unitPrice) >= product.price
            ? Number(itemReq.unitPrice)
            : product.price;
        const selectedVariant = itemReq.selectedVariant ? String(itemReq.selectedVariant).trim() : '';

        subtotal += unitPrice * qty;
        preparedItems.push({
          productId: product.id,
          productName: product.name,
          productImage: product.imageUrl,
          selectedVariant,
          quantity: qty,
          price: unitPrice,
          newStock: Math.max(0, product.stock - (usedSoFar + qty)),
        });
      }

      let discountAmount = 0;
      let appliedCouponCode: string | null = null;
      let couponIdToIncrement: { id: number; newUsedCount: number } | null = null;

      if (dto.couponCode && String(dto.couponCode).trim()) {
        const cleanCode = String(dto.couponCode).trim().toUpperCase();
        const coupon = await getCouponByCodeFromDb(cleanCode);
        if (!coupon) {
          return res
            .status(400)
            .json(apiError(`Mã giảm giá '${cleanCode}' không tồn tại!`));
        }
        const evalRes = calculateCouponDiscount(coupon, subtotal);
        if (!evalRes.valid) {
          return res
            .status(400)
            .json(apiError(evalRes.reason || 'Mã giảm giá không hợp lệ!'));
        }
        discountAmount = evalRes.discount;
        appliedCouponCode = coupon.code;
        couponIdToIncrement = { id: coupon.id, newUsedCount: coupon.usedCount + 1 };
      }

      const shippingFee = Math.max(0, Number(dto.shippingFee) || 0);
      const totalAmount = Math.max(0, subtotal - discountAmount + shippingFee);
      const orderCode =
        'ORD-' + crypto.randomUUID().replace(/-/g, '').substring(0, 8).toUpperCase();

      const newOrder = await createOrderInDb({
        orderCode,
        userId: currentUser ? currentUser.id : null,
        customerName: String(dto.customerName).trim(),
        customerEmail: dto.customerEmail
          ? String(dto.customerEmail).trim()
          : currentUser?.email || '',
        customerPhone: String(dto.customerPhone).trim(),
        shippingAddress: String(dto.shippingAddress).trim(),
        notes: dto.notes ? String(dto.notes) : '',
        paymentMethod: dto.paymentMethod ? String(dto.paymentMethod) : 'COD',
        subtotalAmount: subtotal,
        discountAmount,
        shippingFee,
        couponCode: appliedCouponCode,
        totalAmount,
        items: preparedItems,
        couponIdToIncrement,
      });

      for (const item of preparedItems) {
        recordAuditLog({
          category: 'ORDER',
          action: 'ORDER_PLACED',
          actor: `${newOrder.customerName} (${newOrder.customerPhone})`,
          targetName: item.productName,
          targetId: newOrder.orderCode,
          prevStock: item.newStock + item.quantity,
          newStock: item.newStock,
          delta: -item.quantity,
          details: `Xuất kho ${item.quantity} SP cho đơn hàng ${newOrder.orderCode} (${newOrder.paymentMethod})`,
        });
      }

      return res.status(201).json(apiSuccess(newOrder, 'Đặt hàng thành công'));
    } catch (error: any) {
      console.error('Create order error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tạo đơn hàng'));
    }
  });

  app.get('/api/orders/my-orders', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const user = req.currentUser!;
      const allOrders = await getAllOrdersFromDb();
      const myOrders = allOrders.filter(
        (o) =>
          o.userId === user.id ||
          (user.email &&
            o.customerEmail &&
            o.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
          (user.phone && o.customerPhone && o.customerPhone === user.phone)
      );
      return res.json(apiSuccess(myOrders, 'Lấy lịch sử đơn hàng cá nhân thành công'));
    } catch (error: any) {
      console.error('Get my orders error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải lịch sử đơn hàng'));
    }
  });

  app.get('/api/orders/lookup', async (req: Request, res: Response) => {
    try {
      const { code, phone } = req.query;
      const cleanCode = code ? String(code).trim().toUpperCase() : '';
      const cleanPhone = phone ? String(phone).trim() : '';

      if (!cleanCode && !cleanPhone) {
        return res
          .status(400)
          .json(apiError('Vui lòng nhập Mã đơn hàng (ORD-...) hoặc Số điện thoại để tra cứu!'));
      }

      const allOrders = await getAllOrdersFromDb();
      const matched = allOrders.filter((o) => {
        const matchCode = cleanCode
          ? o.orderCode.toUpperCase().includes(cleanCode)
          : true;
        const matchPhone = cleanPhone ? o.customerPhone.includes(cleanPhone) : true;
        return matchCode && matchPhone;
      });

      return res.json(apiSuccess(matched, `Tìm thấy ${matched.length} đơn hàng phù hợp`));
    } catch (error: any) {
      console.error('Lookup orders error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tra cứu đơn hàng'));
    }
  });

  app.post('/api/orders/:id/cancel', async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const allOrders = await getAllOrdersFromDb();
      const order = allOrders.find((o) => o.id === id);

      if (!order) {
        return res.status(404).json(apiError('Không tìm thấy đơn hàng!'));
      }

      const currentUser = await resolveUserFromRequest(req);
      const isAdmin = currentUser?.role === 'ROLE_ADMIN';
      const isOwnerByUser =
        currentUser &&
        (order.userId === currentUser.id ||
          (currentUser.email &&
            order.customerEmail &&
            order.customerEmail.toLowerCase() === currentUser.email.toLowerCase()) ||
          (currentUser.phone && order.customerPhone === currentUser.phone));

      const providedCode = String(req.body?.orderCode || req.query.orderCode || '')
        .trim()
        .toUpperCase();
      const providedPhone = String(req.body?.customerPhone || req.query.customerPhone || '').trim();
      const isVerifiedByLookup =
        (providedCode && providedCode === order.orderCode.toUpperCase()) ||
        (providedPhone && providedPhone === order.customerPhone);

      if (!isAdmin && !isOwnerByUser && !isVerifiedByLookup) {
        return res
          .status(403)
          .json(
            apiError(
              'Bạn không có quyền hủy đơn hàng này. Vui lòng đăng nhập đúng tài khoản mua hàng hoặc xác thực mã vận đơn!'
            )
          );
      }

      if (order.status !== 'PENDING' && !isAdmin) {
        return res
          .status(400)
          .json(
            apiError(
              'Chỉ có thể hủy đơn hàng khi đang ở trạng thái Chờ xử lý (PENDING)!'
            )
          );
      }

      if (order.status === 'CANCELLED') {
        return res.status(400).json(apiError('Đơn hàng này đã được hủy trước đó!'));
      }

      const updated = await updateOrderStatusInDb(id, 'CANCELLED');

      for (const item of order.items || []) {
        recordAuditLog({
          category: 'ORDER',
          action: 'ORDER_CANCELLED_RESTOCK',
          actor: currentUser?.username || order.customerName,
          targetName: item.product.name,
          targetId: order.orderCode,
          prevStock: null,
          newStock: null,
          delta: item.quantity,
          details: `Hoàn kho +${item.quantity} SP do hủy đơn hàng ${order.orderCode}`,
        });
      }

      return res.json(
        apiSuccess(updated, 'Đã hủy đơn hàng và hoàn lại số lượng tồn kho thành công!')
      );
    } catch (error: any) {
      console.error('Cancel order error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể hủy đơn hàng'));
    }
  });

  app.get('/api/orders', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const list = await getAllOrdersFromDb();
      return res.json(apiSuccess(list, 'Lấy danh sách đơn hàng thành công'));
    } catch (error: any) {
      console.error('Get all orders error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải danh sách đơn hàng'));
    }
  });

  app.get('/api/orders/:id', requireAuth, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const user = req.currentUser!;
      const list = await getAllOrdersFromDb();
      const order = list.find((o) => o.id === id);
      if (!order) {
        return res.status(404).json(apiError(`Không tìm thấy đơn hàng có ID: ${id}`));
      }

      const isOwner =
        user.role === 'ROLE_ADMIN' ||
        order.userId === user.id ||
        (user.email &&
          order.customerEmail &&
          order.customerEmail.toLowerCase() === user.email.toLowerCase());

      if (!isOwner) {
        return res.status(403).json(apiError('Bạn không có quyền truy cập chi tiết đơn hàng này!'));
      }

      return res.json(apiSuccess(order, 'Lấy thông tin đơn hàng thành công'));
    } catch (error: any) {
      console.error('Get order error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải thông tin đơn hàng'));
    }
  });

  app.patch('/api/orders/:id/status', requireAdmin, async (req: AuthRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const newStatus = String(req.query.status || req.body?.status || '').toUpperCase();
      if (!newStatus) {
        return res.status(400).json(apiError('Trạng thái đơn hàng không hợp lệ'));
      }

      const updated = await updateOrderStatusInDb(id, newStatus);
      if (!updated) {
        return res.status(404).json(apiError(`Không tìm thấy đơn hàng có ID: ${id}`));
      }

      recordAuditLog({
        category: 'ORDER',
        action: 'ORDER_STATUS_UPDATED',
        actor: req.currentUser?.username || 'admin',
        targetName: `Đơn hàng ${updated.orderCode} (${updated.customerName})`,
        targetId: updated.orderCode,
        prevStock: null,
        newStock: null,
        delta: null,
        details: `Cập nhật trạng thái vận đơn ${updated.orderCode} sang ${newStatus}`,
      });

      return res.json(apiSuccess(updated, 'Cập nhật trạng thái đơn hàng thành công'));
    } catch (error: any) {
      console.error('Update order status error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể cập nhật trạng thái đơn hàng'));
    }
  });

  // ================= PAYMENT WEBHOOK CONTROLLER =================

  app.post('/api/payment/webhook', async (req: Request, res: Response) => {
    try {
      const payload = req.body || {};
      let content = '';
      if (payload.content) content = String(payload.content);
      else if (payload.description) content = String(payload.description);
      else if (Array.isArray(payload.data) && payload.data[0]?.description) {
        content = String(payload.data[0].description);
      }

      if (!content) {
        return res
          .status(400)
          .json(apiError('Không tìm thấy nội dung chuyển khoản trong Webhook payload'));
      }

      const upperContent = content.toUpperCase();
      const list = await getAllOrdersFromDb();
      for (const order of list) {
        const cleanCode = order.orderCode.replace(/-/g, '').toUpperCase();
        if (
          upperContent.includes(order.orderCode.toUpperCase()) ||
          upperContent.includes(cleanCode)
        ) {
          const updated = await updateOrderStatusInDb(order.id, 'COMPLETED');
          return res.json(
            apiSuccess(
              updated,
              `Xác nhận thanh toán tự động thành công cho đơn: ${order.orderCode}`
            )
          );
        }
      }

      return res.json(
        apiSuccess(null, 'Đã nhận Webhook nhưng không khớp với mã đơn hàng nào')
      );
    } catch (error: any) {
      console.error('Webhook error:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi xử lý Webhook thanh toán'));
    }
  });

  app.get('/api/payment/order-status/:orderId', async (req: Request, res: Response) => {
    try {
      const param = String(req.params.orderId).trim();
      const list = await getAllOrdersFromDb();
      const order = list.find(
        (o) =>
          o.id === Number(param) ||
          o.orderCode.toUpperCase() === param.toUpperCase()
      );
      if (!order) {
        return res.status(404).json(apiError('Không tìm thấy đơn hàng'));
      }
      return res.json(
        apiSuccess(
          {
            orderId: order.id,
            orderCode: order.orderCode,
            status: order.status,
            isPaid: order.status === 'COMPLETED',
            totalAmount: order.totalAmount,
          },
          'Trạng thái thanh toán đơn hàng'
        )
      );
    } catch (error: any) {
      console.error('Order payment status error:', error);
      return res.status(500).json(apiError(error.message || 'Lỗi kiểm tra thanh toán'));
    }
  });

  app.get('/api/payment/webhook-info', (_req: Request, res: Response) => {
    return res.json(
      apiSuccess(
        {
          webhookUrl: '/api/payment/webhook',
          supportedGateways: ['SePay', 'Casso', 'VietQR'],
          status: 'ACTIVE',
        },
        'Thông tin cấu hình Webhook tự động'
      )
    );
  });

  const handleSimulatePayment = async (req: Request, res: Response) => {
    try {
      const rawParam = String(req.params.orderCode || req.params.orderId || '').trim();
      const upperCode = rawParam.toUpperCase();
      const list = await getAllOrdersFromDb();
      const order = list.find(
        (o) =>
          o.id === Number(rawParam) ||
          o.orderCode.toUpperCase() === upperCode ||
          o.orderCode.replace(/-/g, '').toUpperCase() === upperCode.replace(/-/g, '')
      );

      if (!order) {
        return res.status(404).json(apiError(`Không tìm thấy đơn hàng: ${rawParam}`));
      }

      const updated = await updateOrderStatusInDb(order.id, 'COMPLETED');
      return res.json(
        apiSuccess(
          updated,
          `Thanh toán thành công! Đơn hàng ${order.orderCode} đã chuyển sang trạng thái HOÀN THÀNH.`
        )
      );
    } catch (error: any) {
      console.error('Simulate payment error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể xác nhận thanh toán'));
    }
  };

  app.post('/api/payment/simulate/:orderCode', handleSimulatePayment);
  app.post('/api/payment/simulate-transfer/:orderId', handleSimulatePayment);

  // ================= DASHBOARD CONTROLLER =================

  app.get('/api/dashboard/stats', requireAdmin, async (_req: Request, res: Response) => {
    try {
      const [allProducts, allCategories, allOrders, allCoupons] = await Promise.all([
        getAllProductsFromDb(),
        getAllCategoriesFromDb(),
        getAllOrdersFromDb(),
        getAllCouponsFromDb(),
      ]);

      const totalProducts = allProducts.length;
      const totalCategories = allCategories.length;
      const totalOrders = allOrders.length;

      const validOrders = allOrders.filter((o) => o.status !== 'CANCELLED');
      const totalRevenue = validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const completedRevenue = allOrders
        .filter((o) => o.status === 'COMPLETED')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const pendingRevenue = allOrders
        .filter((o) => o.status === 'PENDING' || o.status === 'PROCESSING')
        .reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      const totalDiscountGiven = validOrders.reduce(
        (sum, o) => sum + (o.discountAmount || 0),
        0
      );

      const averageOrderValue =
        validOrders.length > 0 ? Math.round(totalRevenue / validOrders.length) : 0;

      const cancelledOrders = allOrders.filter((o) => o.status === 'CANCELLED').length;
      const completedOrders = allOrders.filter((o) => o.status === 'COMPLETED').length;
      const pendingOnlyOrders = allOrders.filter((o) => o.status === 'PENDING').length;
      const processingOrders = allOrders.filter((o) => o.status === 'PROCESSING').length;

      const totalInventoryUnits = allProducts.reduce((sum, p) => sum + (p.stock || 0), 0);
      const totalInventoryValue = allProducts.reduce(
        (sum, p) => sum + (p.price || 0) * (p.stock || 0),
        0
      );

      const lowStockItems = allProducts
        .filter((p) => p.stock <= 5)
        .map((p) => ({
          ...p,
          categoryName: p.category?.name || 'Khác',
        }))
        .sort((a, b) => a.stock - b.stock);
      const lowStockProducts = lowStockItems.length;

      // Compute product sales & category revenue breakdown from validOrders
      const productSalesMap = new Map<
        number,
        { unitsSold: number; revenue: number }
      >();
      const categoryRevenueMap = new Map<
        string,
        { categoryName: string; revenue: number; unitsSold: number; productCount: number; stockUnits: number }
      >();

      for (const cat of allCategories) {
        categoryRevenueMap.set(cat.name, {
          categoryName: cat.name,
          revenue: 0,
          unitsSold: 0,
          productCount: 0,
          stockUnits: 0,
        });
      }

      const productById = new Map<number, any>();
      for (const p of allProducts) {
        productById.set(p.id, p);
        const catName = p.category?.name || 'Khác';
        const existingCat = categoryRevenueMap.get(catName) || {
          categoryName: catName,
          revenue: 0,
          unitsSold: 0,
          productCount: 0,
          stockUnits: 0,
        };
        existingCat.productCount += 1;
        existingCat.stockUnits += p.stock || 0;
        categoryRevenueMap.set(catName, existingCat);
      }

      for (const order of validOrders) {
        for (const item of order.items || []) {
          const pid = Number(item.product?.id);
          const itemRev = Number((item.price || 0) * (item.quantity || 0));
          const qty = Number(item.quantity || 0);

          const prevProd = productSalesMap.get(pid) || { unitsSold: 0, revenue: 0 };
          prevProd.unitsSold += qty;
          prevProd.revenue += itemRev;
          productSalesMap.set(pid, prevProd);

          const prodObj = productById.get(pid);
          const catName = prodObj?.category?.name || 'Khác';
          const catEntry = categoryRevenueMap.get(catName) || {
            categoryName: catName,
            revenue: 0,
            unitsSold: 0,
            productCount: 0,
            stockUnits: 0,
          };
          catEntry.revenue += itemRev;
          catEntry.unitsSold += qty;
          categoryRevenueMap.set(catName, catEntry);
        }
      }

      const revenueByCategory = Array.from(categoryRevenueMap.values()).sort(
        (a, b) => b.revenue - a.revenue
      );

      const topSellingProducts = allProducts
        .map((p) => {
          const sales = productSalesMap.get(p.id) || { unitsSold: 0, revenue: 0 };
          return {
            id: p.id,
            name: p.name,
            categoryName: p.category?.name || 'Khác',
            price: p.price,
            stock: p.stock,
            imageUrl: p.imageUrl,
            unitsSold: sales.unitsSold,
            revenue: sales.revenue,
          };
        })
        .sort((a, b) => b.revenue - a.revenue || b.unitsSold - a.unitsSold)
        .slice(0, 6);

      // Payment method breakdown
      const paymentMethodBreakdown = ['BANK', 'MOMO', 'COD'].map((method) => {
        const matched = validOrders.filter(
          (o) => (o.paymentMethod || 'COD').toUpperCase() === method
        );
        return {
          method,
          count: matched.length,
          revenue: matched.reduce((sum, o) => sum + (o.totalAmount || 0), 0),
        };
      });

      const recentOrders = allOrders.slice(0, 6);

      return res.json(
        apiSuccess(
          {
            totalProducts,
            totalCategories,
            totalOrders,
            totalRevenue,
            completedRevenue,
            pendingRevenue,
            totalDiscountGiven,
            averageOrderValue,
            completedOrders,
            pendingOrders: pendingOnlyOrders,
            processingOrders,
            cancelledOrders,
            totalInventoryUnits,
            totalInventoryValue,
            lowStockProducts,
            lowStockList: lowStockItems,
            activeCoupons: allCoupons.filter((c) => c.active).length,
            totalCoupons: allCoupons.length,
            revenueByCategory,
            topSellingProducts,
            paymentMethodBreakdown,
            recentOrders,
          },
          'Lấy thống kê tổng quan từ PostgreSQL thành công'
        )
      );
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải thống kê hệ thống'));
    }
  });

  app.get('/api/admin/audit-logs', requireAdmin, async (req: Request, res: Response) => {
    try {
      const category = req.query.category ? String(req.query.category).toUpperCase() : '';
      let logs = getAuditLogsFromStore();
      if (category && category !== 'ALL') {
        logs = logs.filter((l) => l.category === category);
      }
      return res.json(
        apiSuccess(logs, 'Lấy nhật ký biến động tồn kho & lịch sử thao tác Admin thành công')
      );
    } catch (error: any) {
      console.error('Get audit logs error:', error);
      return res.status(500).json(apiError(error.message || 'Không thể tải nhật ký hệ thống'));
    }
  });

  // ================= FILE UPLOAD CONTROLLER =================

  const handleImageUpload = (req: Request, res: Response) => {
    if (!req.file) {
      return res.status(400).json(apiError('Vui lòng chọn file ảnh để tải lên!'));
    }

    const ext = path.extname(req.file.originalname).toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      fs.unlinkSync(req.file.path);
      return res
        .status(400)
        .json(apiError('Chỉ hỗ trợ định dạng ảnh: JPG, JPEG, PNG, WEBP, GIF'));
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    return res.json(apiSuccess({ url: fileUrl, imageUrl: fileUrl }, 'Tải ảnh lên thành công!'));
  };

  app.post('/api/upload', requireAdmin, upload.single('file'), handleImageUpload);
  app.post('/api/upload/image', requireAdmin, upload.single('file'), handleImageUpload);

  // ================= ORDER TRACKING HELPER & AI CHATBOT CONTROLLER =================

  app.get('/api/orders/recent-codes', async (_req: Request, res: Response) => {
    try {
      const allOrders = await getAllOrdersFromDb();
      const recent = allOrders.slice(0, 4).map((o) => ({
        orderCode: o.orderCode,
        status: o.status,
        customerName: o.customerName,
        totalAmount: o.totalAmount,
      }));
      return res.json(apiSuccess(recent, 'Lấy danh sách mã đơn hàng mẫu thành công'));
    } catch (error: any) {
      return res.status(500).json(apiError(error.message || 'Không thể tải mã đơn mẫu'));
    }
  });

  app.post('/api/ai/chat', async (req: Request, res: Response) => {
    try {
      const { message, history, modelType } = req.body || {};
      if (!message || !String(message).trim()) {
        return res.status(400).json(apiError('Vui lòng nhập nội dung tin nhắn'));
      }

      const [allProducts, allCoupons, allOrders] = await Promise.all([
        getAllProductsFromDb(),
        getAllCouponsFromDb(),
        getAllOrdersFromDb(),
      ]);

      const productSummary = allProducts
        .slice(0, 12)
        .map(
          (p) =>
            `- ${p.name} (${p.category?.name || 'Công nghệ'}): ${new Intl.NumberFormat('vi-VN').format(
              p.price
            )} ₫ (Tồn kho: ${p.stock}, Đánh giá: ${p.rating}⭐)`
        )
        .join('\n');

      const activeVoucherSummary = allCoupons
        .filter((c) => c.active && c.usedCount < c.usageLimit)
        .map(
          (c) =>
            `- Mã ${c.code}: ${c.description} (Đơn tối thiểu: ${new Intl.NumberFormat('vi-VN').format(
              c.minOrderAmount
            )} ₫)`
        )
        .join('\n');

      // Check if user message mentions any order code like ORD-...
      const upperMsg = String(message).toUpperCase();
      const matchedOrder = allOrders.find(
        (o) =>
          upperMsg.includes(o.orderCode.toUpperCase()) ||
          upperMsg.includes(o.orderCode.replace(/-/g, '').toUpperCase())
      );

      const orderContext = matchedOrder
        ? `\n[THÔNG TIN ĐƠN HÀNG KHÁCH ĐANG HỎI]: Mã đơn ${matchedOrder.orderCode}, Khách hàng: ${matchedOrder.customerName}, Trạng thái: ${matchedOrder.status}, Tổng thanh toán: ${new Intl.NumberFormat('vi-VN').format(matchedOrder.totalAmount)} ₫, Địa chỉ: ${matchedOrder.shippingAddress}, Sản phẩm: ${matchedOrder.items.map((i) => `${i.product.name} x${i.quantity}`).join(', ')}.`
        : '';

      const systemInstruction = `Bạn là Chuyên viên Tư vấn Công nghệ & Hỗ trợ Đơn hàng của hệ thống bán lẻ chính hãng TechPulse Store VN.
Nhiệm vụ của bạn:
1. Tư vấn sản phẩm công nghệ (Apple, Samsung, Dell, Sony...), so sánh cấu hình, báo giá chính xác theo dữ liệu kho PostgreSQL bên dưới.
2. Giới thiệu các mã giảm giá (Voucher) phù hợp để giúp khách tiết kiệm chi phí.
3. Hướng dẫn khách hàng kiểm tra tiến trình vận đơn (qua nút 'Theo dõi đơn' trên thanh công cụ hoặc cung cấp mã ORD-... ngay trong khung chat) và giải đáp chính sách bảo hành 12 tháng chính hãng, miễn phí vận chuyển cho đơn từ 5.000.000 ₫.
4. Trả lời ngắn gọn, lịch sự, rõ ràng bằng tiếng Việt, trình bày dễ đọc.

[DỮ LIỆU SẢN PHẨM TRONG KHO POSTGRESQL HIỆN TẠI]:
${productSummary}

[MÃ GIẢM GIÁ ĐANG HOẠT ĐỘNG]:
${activeVoucherSummary || 'Hiện không có mã giảm giá nào.'}${orderContext}`;

      const selectedModel =
        modelType === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.8-flash';

      const formattedHistory = Array.isArray(history)
        ? history
            .filter((h) => h && (h.role === 'user' || h.role === 'model') && h.text)
            .map((h) => ({
              role: h.role as 'user' | 'model',
              parts: [{ text: String(h.text) }],
            }))
        : [];

      const chat = ai.chats.create({
        model: selectedModel,
        history: formattedHistory,
        config: {
          systemInstruction,
          temperature: 0.7,
        },
      });

      const response = await chat.sendMessage({
        message: String(message).trim(),
      });

      const replyText =
        response.text ||
        'Xin lỗi, hiện tại mình chưa thể phản hồi ngay. Bạn vui lòng thử lại sau giây lát nhé!';

      return res.json(
        apiSuccess(
          {
            reply: replyText,
            model: selectedModel,
            matchedOrder: matchedOrder || null,
          },
          'Phản hồi tư vấn thành công'
        )
      );
    } catch (error: any) {
      console.error('Gemini Chat error:', error);
      return res
        .status(500)
        .json(apiError(error.message || 'Không thể kết nối với trợ lý tư vấn'));
    }
  });

  // ================= VITE MIDDLEWARE / STATIC =================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      configFile: path.resolve(__dirname, 'vite.config.js'),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(
      `TechPulse Full-Stack Server (PostgreSQL + Drizzle ORM + Firebase Auth) listening on http://0.0.0.0:${PORT}`
    );
  });
}

startServer();
