import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { and, desc, eq, ilike, or } from 'drizzle-orm';
import { db } from './index.ts';
import {
  categories,
  coupons,
  orderItems,
  orders,
  products,
  reviews,
  users,
  wishlists,
} from './schema.ts';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../backend');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const REVIEW_MODERATION_FILE = path.join(DATA_DIR, 'review_moderation.json');
const AUDIT_LOGS_FILE = path.join(DATA_DIR, 'audit_logs.json');

export interface ReviewModerationMeta {
  status: 'APPROVED' | 'HIDDEN';
  adminReply: string;
  repliedBy: string;
  repliedAt: string | null;
}

export interface AuditLogEntry {
  id: string;
  category: 'INVENTORY' | 'ORDER' | 'PRODUCT' | 'REVIEW' | 'SECURITY';
  action: string;
  actor: string;
  targetName: string;
  targetId?: number | string;
  prevStock?: number | null;
  newStock?: number | null;
  delta?: number | null;
  details: string;
  createdAt: string;
}

function loadReviewModerationMap(): Record<string, ReviewModerationMeta> {
  try {
    if (fs.existsSync(REVIEW_MODERATION_FILE)) {
      return JSON.parse(fs.readFileSync(REVIEW_MODERATION_FILE, 'utf-8'));
    }
  } catch (err) {
    console.error('Failed to read review moderation file:', err);
  }
  const initial: Record<string, ReviewModerationMeta> = {
    '1': {
      status: 'APPROVED',
      adminReply:
        'Cảm ơn anh Minh Quân đã tin tưởng lựa chọn iPhone 16 Pro Max chính hãng tại TechPulse! Chúc anh có trải nghiệm tuyệt vời cùng siêu phẩm mới ạ.',
      repliedBy: 'admin',
      repliedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    },
  };
  try {
    fs.writeFileSync(REVIEW_MODERATION_FILE, JSON.stringify(initial, null, 2), 'utf-8');
  } catch {}
  return initial;
}

function saveReviewModerationMap(map: Record<string, ReviewModerationMeta>) {
  try {
    fs.writeFileSync(REVIEW_MODERATION_FILE, JSON.stringify(map, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write review moderation file:', err);
  }
}

export function getAuditLogsFromStore(): AuditLogEntry[] {
  try {
    if (fs.existsSync(AUDIT_LOGS_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(AUDIT_LOGS_FILE, 'utf-8'));
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (err) {
    console.error('Failed to read audit logs:', err);
  }

  const seededLogs: AuditLogEntry[] = [
    {
      id: 'AUD-1004',
      category: 'INVENTORY',
      action: 'LOW_STOCK_ALERT',
      actor: 'system',
      targetName: 'Chuột không dây Logitech MX Master 3S',
      targetId: 9,
      prevStock: 6,
      newStock: 4,
      delta: -2,
      details: 'Cảnh báo tồn kho chạm ngưỡng an toàn (<= 5 sản phẩm)',
      createdAt: new Date(Date.now() - 3600 * 1000 * 2).toISOString(),
    },
    {
      id: 'AUD-1003',
      category: 'ORDER',
      action: 'ORDER_PLACED',
      actor: 'Trần Thị Mai (0912987654)',
      targetName: 'Sony WH-1000XM5 Chống Ồn Chủ Động Cao Cấp',
      targetId: 'ORD-DEMO-002',
      prevStock: 36,
      newStock: 35,
      delta: -1,
      details: 'Trừ kho tự động khi khởi tạo đơn hàng ORD-DEMO-002 (VietQR)',
      createdAt: new Date(Date.now() - 3600 * 1000 * 5).toISOString(),
    },
    {
      id: 'AUD-1002',
      category: 'REVIEW',
      action: 'REVIEW_REPLIED',
      actor: 'admin',
      targetName: 'iPhone 16 Pro Max 256GB - Titan Tự Nhiên',
      targetId: 1,
      prevStock: null,
      newStock: null,
      delta: null,
      details: 'Quản trị viên đã phản hồi đánh giá 5 sao của khách hàng Trần Minh Quân',
      createdAt: new Date(Date.now() - 3600 * 1000 * 18).toISOString(),
    },
    {
      id: 'AUD-1001',
      category: 'INVENTORY',
      action: 'INITIAL_STOCK_SYNC',
      actor: 'admin',
      targetName: 'Kho thiết bị chính hãng TechPulse (9 SKU)',
      targetId: 'ALL',
      prevStock: 0,
      newStock: 152,
      delta: 152,
      details: 'Đồng bộ dữ liệu kiểm kê kho tiêu chuẩn trên PostgreSQL',
      createdAt: new Date(Date.now() - 3600 * 1000 * 36).toISOString(),
    },
  ];
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(seededLogs, null, 2), 'utf-8');
  } catch {}
  return seededLogs;
}

export function recordAuditLog(
  entry: Omit<AuditLogEntry, 'id' | 'createdAt'>
): AuditLogEntry {
  const logs = getAuditLogsFromStore();
  const newEntry: AuditLogEntry = {
    ...entry,
    id: 'AUD-' + crypto.randomUUID().substring(0, 6).toUpperCase(),
    createdAt: new Date().toISOString(),
  };
  const updated = [newEntry, ...logs].slice(0, 250);
  try {
    fs.writeFileSync(AUDIT_LOGS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to save audit log:', err);
  }
  return newEntry;
}

const JWT_SECRET = process.env.JWT_SECRET || 'techpulse_production_hmac_sha256_secret_key_2026';

export function hashPassword(password: string): string {
  return 'sha256:' + crypto.createHmac('sha256', JWT_SECRET).update(password).digest('hex');
}

export function verifyPassword(plain: string, stored: string): boolean {
  if (stored.startsWith('sha256:')) {
    return hashPassword(plain) === stored;
  }
  return plain === stored;
}

export interface ProductWithCategory {
  id: number;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  imageUrl: string;
  rating: number;
  reviewCount: number;
  featured: boolean;
  category: {
    id: number;
    name: string;
    slug: string;
    icon: string;
    description: string;
  } | null;
  createdAt: string;
}

export interface OrderWithItems {
  id: number;
  orderCode: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
  paymentMethod: string;
  status: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  couponCode: string | null;
  totalAmount: number;
  createdAt: string;
  items: Array<{
    id: number;
    product: {
      id: number;
      name: string;
      imageUrl: string;
      price: number;
    };
    selectedVariant: string;
    quantity: number;
    price: number;
  }>;
}

let isSeeded = false;
let seedingPromise: Promise<void> | null = null;

export async function ensureDatabaseSeeded(): Promise<void> {
  if (isSeeded) return;
  if (seedingPromise) return seedingPromise;

  seedingPromise = (async () => {
    try {
      const existingCats = await db.select().from(categories);
      if (existingCats.length > 0) {
        isSeeded = true;
        return;
      }

      // 1. Seed Users
      const insertedUsers = await db
        .insert(users)
        .values([
          {
            uid: 'local-admin-1',
            username: 'admin',
            passwordHash: hashPassword('admin123'),
            email: 'admin@techpulse.vn',
            fullName: 'Quản Trị Viên Hệ Thống',
            phone: '0900000001',
            address: 'Tòa nhà Bitexco, Quận 1, TP. Hồ Chí Minh',
            role: 'ROLE_ADMIN',
          },
          {
            uid: 'local-user-2',
            username: 'user',
            passwordHash: hashPassword('user123'),
            email: 'user@gmail.com',
            fullName: 'Nguyễn Khách Hàng',
            phone: '0900000002',
            address: '123 Nguyễn Huệ, Phường Bến Nghé, Quận 1, TP. Hồ Chí Minh',
            role: 'ROLE_USER',
          },
        ])
        .onConflictDoNothing()
        .returning();

      const demoUser = insertedUsers.find((u) => u.username === 'user') || insertedUsers[0];

      // 2. Seed Categories
      const insertedCats = await db
        .insert(categories)
        .values([
          {
            name: 'Điện thoại & Tablet',
            slug: 'phones',
            icon: 'smartphone',
            description: 'iPhone, Samsung Galaxy, iPad chính hãng',
          },
          {
            name: 'Laptop & Máy tính',
            slug: 'laptops',
            icon: 'laptop',
            description: 'MacBook Pro, Dell XPS, ASUS ROG cao cấp',
          },
          {
            name: 'Âm thanh & Tai nghe',
            slug: 'audio',
            icon: 'headphones',
            description: 'Sony WH-1000XM5, AirPods Pro, Loa Marshall',
          },
          {
            name: 'Smartwatch & Vòng đeo tay',
            slug: 'watches',
            icon: 'watch',
            description: 'Apple Watch Ultra, Garmin Fenix, Galaxy Watch',
          },
          {
            name: 'Phụ kiện & Gaming Gear',
            slug: 'accessories',
            icon: 'gamepad',
            description: 'Bàn phím cơ Keychron, Chuột Logitech Master',
          },
        ])
        .onConflictDoNothing()
        .returning();

      const catBySlug = new Map(insertedCats.map((c) => [c.slug, c.id]));

      // 3. Seed Products
      const insertedProducts = await db
        .insert(products)
        .values([
          {
            name: 'iPhone 16 Pro Max 256GB - Titan Tự Nhiên',
            description:
              'Chip A18 Pro cực mạnh, camera tiềm vọng zoom 5x, viền titan siêu nhẹ, nút Điều Khiển Camera hoàn toàn mới.',
            price: 32990000,
            originalPrice: 34990000,
            stock: 24,
            imageUrl:
              'https://images.unsplash.com/photo-1695048133142-1a20484d2569?auto=format&fit=crop&w=800&q=80',
            rating: 5.0,
            reviewCount: 2,
            featured: true,
            categoryId: catBySlug.get('phones') ?? null,
          },
          {
            name: 'Samsung Galaxy S24 Ultra 5G 512GB',
            description:
              'Quyền năng Galaxy AI, bút S-Pen tích hợp, khung viền titan và cảm biến chính 200MP siêu sắc nét.',
            price: 29490000,
            originalPrice: 31990000,
            stock: 18,
            imageUrl:
              'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?auto=format&fit=crop&w=800&q=80',
            rating: 5.0,
            reviewCount: 1,
            featured: true,
            categoryId: catBySlug.get('phones') ?? null,
          },
          {
            name: 'MacBook Pro 16 inch M3 Max (36GB RAM / 1TB SSD)',
            description:
              'Sức mạnh vượt bậc với vi xử lý Apple M3 Max, màn hình Liquid Retina XDR 120Hz siêu sống động và thời lượng pin 22 giờ.',
            price: 68990000,
            originalPrice: 72990000,
            stock: 10,
            imageUrl:
              'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80',
            rating: 5.0,
            reviewCount: 64,
            featured: true,
            categoryId: catBySlug.get('laptops') ?? null,
          },
          {
            name: 'Dell XPS 14 OLED 2026 Core Ultra 7',
            description:
              'Thiết kế nhôm nguyên khối tương lai, trackpad tàng hình, màn hình cảm ứng 3.2K OLED 120Hz đỉnh cao.',
            price: 45990000,
            originalPrice: 48990000,
            stock: 12,
            imageUrl:
              'https://images.unsplash.com/photo-1593642632823-8f785ba67e45?auto=format&fit=crop&w=800&q=80',
            rating: 4.7,
            reviewCount: 42,
            featured: false,
            categoryId: catBySlug.get('laptops') ?? null,
          },
          {
            name: 'Sony WH-1000XM5 Chống Ồn Chủ Động Cao Cấp',
            description:
              'Công nghệ chống ồn hàng đầu thế giới với bộ vi xử lý V1 & QN1, thời lượng pin 30 giờ, âm thanh Hi-Res LDAC.',
            price: 7490000,
            originalPrice: 8490000,
            stock: 35,
            imageUrl:
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80',
            rating: 4.9,
            reviewCount: 210,
            featured: true,
            categoryId: catBySlug.get('audio') ?? null,
          },
          {
            name: 'Loa Bluetooth Marshall Stanmore III',
            description:
              "Âm thanh cổ điển đậm chất rock n' roll, kết nối Bluetooth 5.2, thiết kế bọc da viền đồng sang trọng vượt thời gian.",
            price: 9990000,
            originalPrice: 10990000,
            stock: 15,
            imageUrl:
              'https://images.unsplash.com/photo-1545454675-3531b543be5d?auto=format&fit=crop&w=800&q=80',
            rating: 4.8,
            reviewCount: 78,
            featured: false,
            categoryId: catBySlug.get('audio') ?? null,
          },
          {
            name: 'Apple Watch Ultra 2 GPS + Cellular 49mm',
            description:
              'Vỏ titan 49mm chuẩn quân đội, màn hình 3000 nits siêu sáng, GPS kép tần số và pin 72 giờ ở chế độ tiết kiệm pin.',
            price: 20490000,
            originalPrice: 21990000,
            stock: 14,
            imageUrl:
              'https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?auto=format&fit=crop&w=800&q=80',
            rating: 4.9,
            reviewCount: 89,
            featured: true,
            categoryId: catBySlug.get('watches') ?? null,
          },
          {
            name: 'Bàn phím cơ Keychron Q1 Pro Wireless RGB',
            description:
              'Thân vỏ full nhôm CNC, gõ êm mượt gasket mount, kết nối không dây đa thiết bị, hotswap switch cao cấp.',
            price: 4290000,
            originalPrice: 4690000,
            stock: 20,
            imageUrl:
              'https://images.unsplash.com/photo-1587829741301-dc798b83add3?auto=format&fit=crop&w=800&q=80',
            rating: 4.8,
            reviewCount: 56,
            featured: false,
            categoryId: catBySlug.get('accessories') ?? null,
          },
          {
            name: 'Chuột không dây Logitech MX Master 3S',
            description:
              'Con lăn điện từ MagSpeed cuộn 1000 dòng/giây, cảm biến 8000 DPI trên mọi bề mặt kể cả mặt kính.',
            price: 2490000,
            originalPrice: 2790000,
            stock: 4,
            imageUrl:
              'https://images.unsplash.com/photo-1615663245857-ac93bb7c39e7?auto=format&fit=crop&w=800&q=80',
            rating: 4.9,
            reviewCount: 175,
            featured: false,
            categoryId: catBySlug.get('accessories') ?? null,
          },
        ])
        .returning();

      // 4. Seed Reviews
      if (insertedProducts.length >= 2) {
        await db.insert(reviews).values([
          {
            productId: insertedProducts[0].id,
            reviewerName: 'Trần Minh Quân',
            reviewerEmail: 'quan.tran@gmail.com',
            rating: 5,
            comment:
              'Máy cầm nhẹ hơn hẳn bản 15 Pro Max nhờ viền titan xịn xò. Camera chụp đêm xuất sắc, nút Camera Control bấm chụp rất nhạy!',
          },
          {
            productId: insertedProducts[0].id,
            reviewerName: 'Nguyễn Hoàng Long',
            reviewerEmail: 'longnh@hotmail.com',
            rating: 5,
            comment:
              'Pin trâu dùng cả ngày thoải mái, loa ngoài nghe rất ấm và chi tiết. Shop giao hàng hỏa tốc trong 2 tiếng, đóng gói cẩn thận 10 điểm!',
          },
          {
            productId: insertedProducts[1].id,
            reviewerName: 'Lê Thu Hà',
            reviewerEmail: 'thuha.tech@yahoo.com',
            rating: 5,
            comment:
              'Thiết kế quá sang trọng, bút S-Pen ghi chú cực nhạy, màn hình hiển thị rực rỡ. Rất đáng đồng tiền bát gạo!',
          },
        ]);
      }

      // 5. Seed Coupons
      await db
        .insert(coupons)
        .values([
          {
            code: 'TECHPULSE10',
            description: 'Giảm 10% (tối đa 1.500.000đ) cho đơn từ 5.000.000đ',
            discountType: 'PERCENT',
            discountValue: 10,
            minOrderAmount: 5000000,
            maxDiscountAmount: 1500000,
            usageLimit: 100,
            usedCount: 12,
            active: true,
            expiryDate: '2027-12-31',
          },
          {
            code: 'GIAM500K',
            description: 'Giảm trực tiếp 500.000đ cho đơn hàng từ 10.000.000đ',
            discountType: 'FIXED',
            discountValue: 500000,
            minOrderAmount: 10000000,
            maxDiscountAmount: 500000,
            usageLimit: 50,
            usedCount: 5,
            active: true,
            expiryDate: '2027-12-31',
          },
          {
            code: 'VIP2026',
            description: 'Ưu đãi VIP giảm 2.000.000đ cho đơn hàng Flagship từ 30.000.000đ',
            discountType: 'FIXED',
            discountValue: 2000000,
            minOrderAmount: 30000000,
            maxDiscountAmount: 2000000,
            usageLimit: 30,
            usedCount: 3,
            active: true,
            expiryDate: '2027-12-31',
          },
          {
            code: 'WELCOME200K',
            description: 'Chào bạn mới: Giảm 200.000đ cho mọi đơn hàng từ 2.000.000đ',
            discountType: 'FIXED',
            discountValue: 200000,
            minOrderAmount: 2000000,
            maxDiscountAmount: 200000,
            usageLimit: 200,
            usedCount: 28,
            active: true,
            expiryDate: '2027-12-31',
          },
        ])
        .onConflictDoNothing();

      // 6. Seed Demo Orders
      if (insertedProducts.length >= 5) {
        const order1 = await db
          .insert(orders)
          .values({
            orderCode: 'ORD-DEMO-001',
            userId: demoUser?.id ?? null,
            customerName: 'Nguyễn Khách Hàng',
            customerEmail: 'user@gmail.com',
            customerPhone: '0900000002',
            shippingAddress: '123 Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh',
            notes: 'Giao giờ hành chính',
            paymentMethod: 'COD',
            status: 'COMPLETED',
            subtotalAmount: insertedProducts[0].price,
            discountAmount: 0,
            couponCode: null,
            totalAmount: insertedProducts[0].price,
          })
          .onConflictDoNothing()
          .returning();

        if (order1[0]) {
          await db.insert(orderItems).values({
            orderId: order1[0].id,
            productId: insertedProducts[0].id,
            productName: insertedProducts[0].name,
            productImage: insertedProducts[0].imageUrl,
            quantity: 1,
            price: insertedProducts[0].price,
          });
        }

        const order2 = await db
          .insert(orders)
          .values({
            orderCode: 'ORD-DEMO-002',
            userId: demoUser?.id ?? null,
            customerName: 'Trần Thị Mai',
            customerEmail: 'mai.tran@gmail.com',
            customerPhone: '0912987654',
            shippingAddress: '45 Lê Lợi, Quận Hải Châu, Đà Nẵng',
            notes: 'Gọi trước khi giao',
            paymentMethod: 'BANK',
            status: 'PENDING',
            subtotalAmount: insertedProducts[4].price,
            discountAmount: 0,
            couponCode: null,
            totalAmount: insertedProducts[4].price,
          })
          .onConflictDoNothing()
          .returning();

        if (order2[0]) {
          await db.insert(orderItems).values({
            orderId: order2[0].id,
            productId: insertedProducts[4].id,
            productName: insertedProducts[4].name,
            productImage: insertedProducts[4].imageUrl,
            quantity: 1,
            price: insertedProducts[4].price,
          });
        }
      }

      isSeeded = true;
    } catch (error) {
      console.error('Database seeding failed:', error);
      throw new Error('Failed to initialize PostgreSQL seed data.', { cause: error });
    } finally {
      seedingPromise = null;
    }
  })();

  return seedingPromise;
}

// ================= USER QUERIES =================

export async function getOrCreateFirebaseUser(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    await ensureDatabaseSeeded();
    const cleanEmail = (email || `${uid}@firebase.user`).toLowerCase();
    const defaultUsername = cleanEmail.split('@')[0] + '_' + uid.slice(0, 5);
    const defaultRole =
      cleanEmail === 'nguyenmanhhung0423@gmail.com' || cleanEmail === 'admin@techpulse.vn'
        ? 'ROLE_ADMIN'
        : 'ROLE_USER';

    const result = await db
      .insert(users)
      .values({
        uid,
        username: defaultUsername,
        passwordHash: 'firebase_oauth',
        email: cleanEmail,
        fullName: displayName || cleanEmail.split('@')[0],
        phone: '',
        address: '',
        role: defaultRole,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: cleanEmail,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database query failed in getOrCreateFirebaseUser:', error);
    throw new Error('Không thể đồng bộ tài khoản người dùng với PostgreSQL.', { cause: error });
  }
}

export async function findUserByUsernameOrEmail(identifier: string) {
  try {
    await ensureDatabaseSeeded();
    const clean = identifier.trim();
    const rows = await db
      .select()
      .from(users)
      .where(or(ilike(users.username, clean), ilike(users.email, clean)));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in findUserByUsernameOrEmail:', error);
    throw new Error('Lỗi truy vấn thông tin tài khoản.', { cause: error });
  }
}

export async function findUserById(id: number) {
  try {
    await ensureDatabaseSeeded();
    const rows = await db.select().from(users).where(eq(users.id, id));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in findUserById:', error);
    throw new Error('Lỗi truy vấn thông tin người dùng.', { cause: error });
  }
}

export async function createLocalUser(data: {
  username: string;
  email: string;
  passwordHash: string;
  fullName: string;
  phone: string;
  address: string;
}) {
  try {
    await ensureDatabaseSeeded();
    const uid = `local-${crypto.randomUUID()}`;
    const result = await db
      .insert(users)
      .values({
        uid,
        username: data.username,
        email: data.email,
        passwordHash: data.passwordHash,
        fullName: data.fullName,
        phone: data.phone,
        address: data.address,
        role: 'ROLE_USER',
      })
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createLocalUser:', error);
    throw new Error('Không thể tạo tài khoản mới trong PostgreSQL.', { cause: error });
  }
}

export async function updateUserProfileInDb(
  userId: number,
  updates: { fullName?: string; email?: string; phone?: string; address?: string }
) {
  try {
    const result = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in updateUserProfileInDb:', error);
    throw new Error('Không thể cập nhật hồ sơ cá nhân.', { cause: error });
  }
}

export async function updateUserPasswordInDb(userId: number, passwordHash: string) {
  try {
    const result = await db
      .update(users)
      .set({ passwordHash })
      .where(eq(users.id, userId))
      .returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in updateUserPasswordInDb:', error);
    throw new Error('Không thể cập nhật mật khẩu.', { cause: error });
  }
}

export async function getAllUsersWithStatsFromDb() {
  try {
    await ensureDatabaseSeeded();
    const [userRows, orderRows] = await Promise.all([
      db.select().from(users).orderBy(desc(users.id)),
      db.select().from(orders),
    ]);

    return userRows.map((u) => {
      const userOrders = orderRows.filter(
        (o) =>
          o.userId === u.id ||
          (u.email && o.customerEmail && o.customerEmail.toLowerCase() === u.email.toLowerCase())
      );
      const completedOrders = userOrders.filter((o) => o.status === 'COMPLETED');
      const totalSpent = completedOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);

      return {
        id: u.id,
        uid: u.uid,
        username: u.username,
        email: u.email,
        fullName: u.fullName,
        phone: u.phone,
        address: u.address,
        role: u.role,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
        orderCount: userOrders.length,
        completedOrderCount: completedOrders.length,
        totalSpent,
      };
    });
  } catch (error) {
    console.error('Database query failed in getAllUsersWithStatsFromDb:', error);
    throw new Error('Không thể tải danh sách khách hàng từ PostgreSQL.', { cause: error });
  }
}

export async function updateUserRoleInDb(userId: number, role: string) {
  try {
    const updated = await db
      .update(users)
      .set({ role })
      .where(eq(users.id, userId))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Database query failed in updateUserRoleInDb:', error);
    throw new Error('Không thể cập nhật quyền tài khoản.', { cause: error });
  }
}

export async function deleteUserFromDb(userId: number) {
  try {
    // Unlink any orders referencing this user first so foreign key doesn't block deletion
    await db.update(orders).set({ userId: null }).where(eq(orders.userId, userId));
    await db.delete(wishlists).where(eq(wishlists.userId, userId));
    const deleted = await db.delete(users).where(eq(users.id, userId)).returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteUserFromDb:', error);
    throw new Error('Không thể xóa tài khoản người dùng.', { cause: error });
  }
}

// ================= WISHLIST QUERIES =================

export async function getUserWishlistIdsFromDb(userId: number): Promise<number[]> {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select()
      .from(wishlists)
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.id));
    return rows.map((r) => r.productId);
  } catch (error) {
    console.error('Database query failed in getUserWishlistIdsFromDb:', error);
    throw new Error('Không thể tải danh sách yêu thích từ PostgreSQL.', { cause: error });
  }
}

export async function toggleWishlistItemInDb(
  userId: number,
  productId: number
): Promise<{ added: boolean; wishlistIds: number[] }> {
  try {
    const existing = await db
      .select()
      .from(wishlists)
      .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));

    let added = false;
    if (existing.length > 0) {
      await db
        .delete(wishlists)
        .where(and(eq(wishlists.userId, userId), eq(wishlists.productId, productId)));
      added = false;
    } else {
      await db.insert(wishlists).values({ userId, productId });
      added = true;
    }

    const wishlistIds = await getUserWishlistIdsFromDb(userId);
    return { added, wishlistIds };
  } catch (error) {
    console.error('Database query failed in toggleWishlistItemInDb:', error);
    throw new Error('Không thể cập nhật danh sách yêu thích.', { cause: error });
  }
}


// ================= CATEGORY QUERIES =================

export async function getAllCategoriesFromDb() {
  try {
    await ensureDatabaseSeeded();
    return await db.select().from(categories).orderBy(categories.id);
  } catch (error) {
    console.error('Database query failed in getAllCategoriesFromDb:', error);
    throw new Error('Không thể tải danh sách danh mục từ PostgreSQL.', { cause: error });
  }
}

export async function createCategoryInDb(data: {
  name: string;
  slug: string;
  icon: string;
  description: string;
}) {
  try {
    await ensureDatabaseSeeded();
    const result = await db.insert(categories).values(data).returning();
    return result[0];
  } catch (error) {
    console.error('Database query failed in createCategoryInDb:', error);
    throw new Error('Không thể tạo danh mục mới.', { cause: error });
  }
}

export async function updateCategoryInDb(
  id: number,
  data: { name?: string; slug?: string; icon?: string; description?: string }
) {
  try {
    const result = await db
      .update(categories)
      .set(data)
      .where(eq(categories.id, id))
      .returning();
    return result[0] || null;
  } catch (error) {
    console.error('Database query failed in updateCategoryInDb:', error);
    throw new Error('Không thể cập nhật danh mục.', { cause: error });
  }
}

export async function deleteCategoryFromDb(id: number) {
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (error) {
    console.error('Database query failed in deleteCategoryFromDb:', error);
    throw new Error('Không thể xóa danh mục.', { cause: error });
  }
}

// ================= PRODUCT QUERIES =================

export async function getAllProductsFromDb(): Promise<ProductWithCategory[]> {
  try {
    await ensureDatabaseSeeded();
    const [prodRows, catRows] = await Promise.all([
      db.select().from(products).orderBy(desc(products.id)),
      db.select().from(categories),
    ]);
    const catMap = new Map(catRows.map((c) => [c.id, c]));

    return prodRows.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      imageUrl: p.imageUrl,
      rating: p.rating,
      reviewCount: p.reviewCount,
      featured: p.featured,
      category: p.categoryId ? catMap.get(p.categoryId) || null : null,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Database query failed in getAllProductsFromDb:', error);
    throw new Error('Không thể tải danh sách sản phẩm từ PostgreSQL.', { cause: error });
  }
}

export async function getProductByIdFromDb(id: number): Promise<ProductWithCategory | null> {
  try {
    await ensureDatabaseSeeded();
    const rows = await db.select().from(products).where(eq(products.id, id));
    const p = rows[0];
    if (!p) return null;

    let category = null;
    if (p.categoryId) {
      const catRows = await db
        .select()
        .from(categories)
        .where(eq(categories.id, p.categoryId));
      category = catRows[0] || null;
    }

    return {
      id: p.id,
      name: p.name,
      description: p.description,
      price: p.price,
      originalPrice: p.originalPrice,
      stock: p.stock,
      imageUrl: p.imageUrl,
      rating: p.rating,
      reviewCount: p.reviewCount,
      featured: p.featured,
      category,
      createdAt: p.createdAt ? p.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in getProductByIdFromDb:', error);
    throw new Error('Không thể tải thông tin sản phẩm.', { cause: error });
  }
}

export async function createProductInDb(data: {
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  stock: number;
  imageUrl: string;
  featured: boolean;
  categoryId: number | null;
}): Promise<ProductWithCategory> {
  try {
    await ensureDatabaseSeeded();
    const inserted = await db
      .insert(products)
      .values({
        name: data.name,
        description: data.description,
        price: data.price,
        originalPrice: data.originalPrice,
        stock: data.stock,
        imageUrl: data.imageUrl,
        rating: 5.0,
        reviewCount: 0,
        featured: data.featured,
        categoryId: data.categoryId,
      })
      .returning();

    const prod = await getProductByIdFromDb(inserted[0].id);
    if (!prod) throw new Error('Product creation verification failed');
    return prod;
  } catch (error) {
    console.error('Database query failed in createProductInDb:', error);
    throw new Error('Không thể tạo sản phẩm mới.', { cause: error });
  }
}

export async function updateProductInDb(
  id: number,
  data: {
    name?: string;
    description?: string;
    price?: number;
    originalPrice?: number;
    stock?: number;
    imageUrl?: string;
    featured?: boolean;
    categoryId?: number | null;
  }
): Promise<ProductWithCategory | null> {
  try {
    const updated = await db
      .update(products)
      .set(data)
      .where(eq(products.id, id))
      .returning();
    if (!updated[0]) return null;
    return await getProductByIdFromDb(id);
  } catch (error) {
    console.error('Database query failed in updateProductInDb:', error);
    throw new Error('Không thể cập nhật sản phẩm.', { cause: error });
  }
}

export async function deleteProductFromDb(id: number): Promise<boolean> {
  try {
    // Check if product is referenced in historical orders to preserve invoice integrity
    const existingOrderItems = await db
      .select()
      .from(orderItems)
      .where(eq(orderItems.productId, id));

    if (existingOrderItems.length > 0) {
      throw new Error(
        `Sản phẩm này đã phát sinh trong ${existingOrderItems.length} chi tiết đơn hàng lịch sử. Để bảo toàn chứng từ kế toán, vui lòng cập nhật tồn kho = 0 (Ngừng kinh doanh) thay vì xóa vĩnh viễn!`
      );
    }

    await db.delete(wishlists).where(eq(wishlists.productId, id));
    await db.delete(reviews).where(eq(reviews.productId, id));
    const deleted = await db.delete(products).where(eq(products.id, id)).returning();
    return deleted.length > 0;
  } catch (error: any) {
    console.error('Database query failed in deleteProductFromDb:', error);
    throw new Error(error.message || 'Không thể xóa sản phẩm.', { cause: error });
  }
}

// ================= REVIEW QUERIES =================

export async function recalculateProductRatingInDb(productId: number) {
  const allReviews = await db
    .select()
    .from(reviews)
    .where(eq(reviews.productId, productId));
  const modMap = loadReviewModerationMap();
  const visibleReviews = allReviews.filter(
    (r) => (modMap[String(r.id)]?.status || 'APPROVED') === 'APPROVED'
  );

  const count = visibleReviews.length;
  const avg =
    count > 0
      ? Math.round(
          (visibleReviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10
        ) / 10
      : 5.0;

  await db
    .update(products)
    .set({
      rating: avg,
      reviewCount: count,
    })
    .where(eq(products.id, productId));
}

export async function getReviewsByProductFromDb(
  productId: number,
  includeHidden = false
) {
  try {
    await ensureDatabaseSeeded();
    const rows = await db
      .select()
      .from(reviews)
      .where(eq(reviews.productId, productId))
      .orderBy(desc(reviews.id));
    const modMap = loadReviewModerationMap();

    return rows
      .map((r) => {
        const meta = modMap[String(r.id)] || {
          status: 'APPROVED' as const,
          adminReply: '',
          repliedBy: '',
          repliedAt: null,
        };
        return {
          id: r.id,
          productId: r.productId,
          reviewerName: r.reviewerName,
          reviewerEmail: r.reviewerEmail || '',
          rating: r.rating,
          comment: r.comment,
          status: meta.status,
          adminReply: meta.adminReply,
          repliedBy: meta.repliedBy,
          repliedAt: meta.repliedAt,
          createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
        };
      })
      .filter((r) => (includeHidden ? true : r.status === 'APPROVED'));
  } catch (error) {
    console.error('Database query failed in getReviewsByProductFromDb:', error);
    throw new Error('Không thể tải đánh giá sản phẩm.', { cause: error });
  }
}

export async function getAllReviewsWithProductFromDb() {
  try {
    await ensureDatabaseSeeded();
    const [reviewRows, prodRows] = await Promise.all([
      db.select().from(reviews).orderBy(desc(reviews.id)),
      db.select().from(products),
    ]);
    const prodMap = new Map(prodRows.map((p) => [p.id, p]));
    const modMap = loadReviewModerationMap();

    return reviewRows.map((r) => {
      const prod = prodMap.get(r.productId);
      const meta = modMap[String(r.id)] || {
        status: 'APPROVED' as const,
        adminReply: '',
        repliedBy: '',
        repliedAt: null,
      };
      return {
        id: r.id,
        productId: r.productId,
        productName: prod?.name || `Sản phẩm #${r.productId}`,
        productImage: prod?.imageUrl || '',
        reviewerName: r.reviewerName,
        reviewerEmail: r.reviewerEmail || '',
        rating: r.rating,
        comment: r.comment,
        status: meta.status,
        adminReply: meta.adminReply,
        repliedBy: meta.repliedBy,
        repliedAt: meta.repliedAt,
        createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
      };
    });
  } catch (error) {
    console.error('Database query failed in getAllReviewsWithProductFromDb:', error);
    throw new Error('Không thể tải toàn bộ danh sách đánh giá.', { cause: error });
  }
}

export async function addReviewInDb(data: {
  productId: number;
  reviewerName: string;
  reviewerEmail: string;
  rating: number;
  comment: string;
}) {
  try {
    const inserted = await db.insert(reviews).values(data).returning();
    const r = inserted[0];

    const modMap = loadReviewModerationMap();
    modMap[String(r.id)] = {
      status: 'APPROVED',
      adminReply: '',
      repliedBy: '',
      repliedAt: null,
    };
    saveReviewModerationMap(modMap);

    await recalculateProductRatingInDb(data.productId);

    return {
      id: r.id,
      productId: r.productId,
      reviewerName: r.reviewerName,
      reviewerEmail: r.reviewerEmail || '',
      rating: r.rating,
      comment: r.comment,
      status: 'APPROVED',
      adminReply: '',
      repliedBy: '',
      repliedAt: null,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in addReviewInDb:', error);
    throw new Error('Không thể gửi đánh giá sản phẩm.', { cause: error });
  }
}

export async function moderateReviewInDb(
  reviewId: number,
  updates: { status?: 'APPROVED' | 'HIDDEN'; adminReply?: string; actor?: string }
) {
  try {
    const rows = await db.select().from(reviews).where(eq(reviews.id, reviewId));
    const r = rows[0];
    if (!r) return null;

    const modMap = loadReviewModerationMap();
    const prev = modMap[String(r.id)] || {
      status: 'APPROVED' as const,
      adminReply: '',
      repliedBy: '',
      repliedAt: null,
    };

    const nextMeta: ReviewModerationMeta = {
      status:
        updates.status === 'HIDDEN' || updates.status === 'APPROVED'
          ? updates.status
          : prev.status,
      adminReply:
        updates.adminReply !== undefined ? String(updates.adminReply).trim() : prev.adminReply,
      repliedBy:
        updates.adminReply !== undefined
          ? String(updates.adminReply).trim()
            ? updates.actor || 'admin'
            : ''
          : prev.repliedBy,
      repliedAt:
        updates.adminReply !== undefined
          ? String(updates.adminReply).trim()
            ? new Date().toISOString()
            : null
          : prev.repliedAt,
    };

    modMap[String(r.id)] = nextMeta;
    saveReviewModerationMap(modMap);

    await recalculateProductRatingInDb(r.productId);

    const prod = await getProductByIdFromDb(r.productId);
    return {
      id: r.id,
      productId: r.productId,
      productName: prod?.name || `Sản phẩm #${r.productId}`,
      productImage: prod?.imageUrl || '',
      reviewerName: r.reviewerName,
      reviewerEmail: r.reviewerEmail || '',
      rating: r.rating,
      comment: r.comment,
      status: nextMeta.status,
      adminReply: nextMeta.adminReply,
      repliedBy: nextMeta.repliedBy,
      repliedAt: nextMeta.repliedAt,
      createdAt: r.createdAt ? r.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Database query failed in moderateReviewInDb:', error);
    throw new Error('Không thể cập nhật kiểm duyệt đánh giá.', { cause: error });
  }
}

export async function deleteReviewFromDb(reviewId: number) {
  try {
    const rows = await db.select().from(reviews).where(eq(reviews.id, reviewId));
    const existing = rows[0];
    if (!existing) return null;

    await db.delete(reviews).where(eq(reviews.id, reviewId));

    const modMap = loadReviewModerationMap();
    delete modMap[String(reviewId)];
    saveReviewModerationMap(modMap);

    await recalculateProductRatingInDb(existing.productId);
    return existing;
  } catch (error) {
    console.error('Database query failed in deleteReviewFromDb:', error);
    throw new Error('Không thể xóa đánh giá sản phẩm.', { cause: error });
  }
}

// ================= COUPON QUERIES =================

export async function getAllCouponsFromDb() {
  try {
    await ensureDatabaseSeeded();
    return await db.select().from(coupons).orderBy(desc(coupons.id));
  } catch (error) {
    console.error('Database query failed in getAllCouponsFromDb:', error);
    throw new Error('Không thể tải danh sách mã giảm giá.', { cause: error });
  }
}

export async function getCouponByCodeFromDb(code: string) {
  try {
    await ensureDatabaseSeeded();
    const clean = code.trim().toUpperCase();
    const rows = await db.select().from(coupons).where(ilike(coupons.code, clean));
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getCouponByCodeFromDb:', error);
    throw new Error('Không thể kiểm tra mã giảm giá.', { cause: error });
  }
}

export async function createCouponInDb(data: {
  code: string;
  description: string;
  discountType: string;
  discountValue: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  usageLimit: number;
  active: boolean;
  expiryDate: string;
}) {
  try {
    const inserted = await db
      .insert(coupons)
      .values({
        ...data,
        usedCount: 0,
      })
      .returning();
    return inserted[0];
  } catch (error) {
    console.error('Database query failed in createCouponInDb:', error);
    throw new Error('Không thể tạo mã giảm giá.', { cause: error });
  }
}

export async function updateCouponInDb(
  id: number,
  data: Partial<{
    code: string;
    description: string;
    discountType: string;
    discountValue: number;
    minOrderAmount: number;
    maxDiscountAmount: number | null;
    usageLimit: number;
    active: boolean;
    expiryDate: string;
    usedCount: number;
  }>
) {
  try {
    const updated = await db
      .update(coupons)
      .set(data)
      .where(eq(coupons.id, id))
      .returning();
    return updated[0] || null;
  } catch (error) {
    console.error('Database query failed in updateCouponInDb:', error);
    throw new Error('Không thể cập nhật mã giảm giá.', { cause: error });
  }
}

export async function deleteCouponFromDb(id: number) {
  try {
    const deleted = await db.delete(coupons).where(eq(coupons.id, id)).returning();
    return deleted.length > 0;
  } catch (error) {
    console.error('Database query failed in deleteCouponFromDb:', error);
    throw new Error('Không thể xóa mã giảm giá.', { cause: error });
  }
}

// ================= ORDER QUERIES =================

export async function getAllOrdersFromDb(): Promise<OrderWithItems[]> {
  try {
    await ensureDatabaseSeeded();
    const [orderRows, itemRows] = await Promise.all([
      db.select().from(orders).orderBy(desc(orders.id)),
      db.select().from(orderItems),
    ]);

    const itemsByOrder = new Map<number, typeof itemRows>();
    for (const item of itemRows) {
      const list = itemsByOrder.get(item.orderId) || [];
      list.push(item);
      itemsByOrder.set(item.orderId, list);
    }

    return orderRows.map((o) => ({
      id: o.id,
      orderCode: o.orderCode,
      userId: o.userId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      notes: o.notes,
      paymentMethod: o.paymentMethod,
      status: o.status,
      subtotalAmount: o.subtotalAmount,
      discountAmount: o.discountAmount,
      shippingFee: o.shippingFee || 0,
      couponCode: o.couponCode,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      items: (itemsByOrder.get(o.id) || []).map((i) => ({
        id: i.id,
        product: {
          id: i.productId,
          name: i.productName,
          imageUrl: i.productImage,
          price: i.price,
        },
        selectedVariant: i.selectedVariant || '',
        quantity: i.quantity,
        price: i.price,
      })),
    }));
  } catch (error) {
    console.error('Database query failed in getAllOrdersFromDb:', error);
    throw new Error('Không thể tải danh sách đơn hàng từ PostgreSQL.', { cause: error });
  }
}

export async function createOrderInDb(data: {
  orderCode: string;
  userId: number | null;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  shippingAddress: string;
  notes: string;
  paymentMethod: string;
  subtotalAmount: number;
  discountAmount: number;
  shippingFee: number;
  couponCode: string | null;
  totalAmount: number;
  items: Array<{
    productId: number;
    productName: string;
    productImage: string;
    selectedVariant: string;
    quantity: number;
    price: number;
    newStock: number;
  }>;
  couponIdToIncrement?: { id: number; newUsedCount: number } | null;
}): Promise<OrderWithItems> {
  try {
    // Update stock for each product
    for (const item of data.items) {
      await db
        .update(products)
        .set({ stock: item.newStock })
        .where(eq(products.id, item.productId));
    }

    if (data.couponIdToIncrement) {
      await db
        .update(coupons)
        .set({ usedCount: data.couponIdToIncrement.newUsedCount })
        .where(eq(coupons.id, data.couponIdToIncrement.id));
    }

    const insertedOrder = await db
      .insert(orders)
      .values({
        orderCode: data.orderCode,
        userId: data.userId,
        customerName: data.customerName,
        customerEmail: data.customerEmail,
        customerPhone: data.customerPhone,
        shippingAddress: data.shippingAddress,
        notes: data.notes,
        paymentMethod: data.paymentMethod,
        status: 'PENDING',
        subtotalAmount: data.subtotalAmount,
        discountAmount: data.discountAmount,
        shippingFee: data.shippingFee,
        couponCode: data.couponCode,
        totalAmount: data.totalAmount,
      })
      .returning();

    const o = insertedOrder[0];

    const insertedItems = await db
      .insert(orderItems)
      .values(
        data.items.map((item) => ({
          orderId: o.id,
          productId: item.productId,
          productName: item.productName,
          productImage: item.productImage,
          selectedVariant: item.selectedVariant || '',
          quantity: item.quantity,
          price: item.price,
        }))
      )
      .returning();

    return {
      id: o.id,
      orderCode: o.orderCode,
      userId: o.userId,
      customerName: o.customerName,
      customerEmail: o.customerEmail,
      customerPhone: o.customerPhone,
      shippingAddress: o.shippingAddress,
      notes: o.notes,
      paymentMethod: o.paymentMethod,
      status: o.status,
      subtotalAmount: o.subtotalAmount,
      discountAmount: o.discountAmount,
      shippingFee: o.shippingFee || 0,
      couponCode: o.couponCode,
      totalAmount: o.totalAmount,
      createdAt: o.createdAt ? o.createdAt.toISOString() : new Date().toISOString(),
      items: insertedItems.map((i) => ({
        id: i.id,
        product: {
          id: i.productId,
          name: i.productName,
          imageUrl: i.productImage,
          price: i.price,
        },
        selectedVariant: i.selectedVariant || '',
        quantity: i.quantity,
        price: i.price,
      })),
    };
  } catch (error) {
    console.error('Database query failed in createOrderInDb:', error);
    throw new Error('Không thể lưu đơn hàng vào PostgreSQL.', { cause: error });
  }
}

export async function updateOrderStatusInDb(
  orderId: number,
  newStatus: string
): Promise<OrderWithItems | null> {
  try {
    const allOrders = await getAllOrdersFromDb();
    const existing = allOrders.find((o) => o.id === orderId);
    if (!existing) return null;

    const prevStatus = existing.status;

    if (prevStatus !== 'CANCELLED' && newStatus === 'CANCELLED') {
      // Restore stock and coupon usage
      for (const item of existing.items) {
        const prod = await getProductByIdFromDb(item.product.id);
        if (prod) {
          await db
            .update(products)
            .set({ stock: prod.stock + item.quantity })
            .where(eq(products.id, prod.id));
        }
      }
      if (existing.couponCode) {
        const c = await getCouponByCodeFromDb(existing.couponCode);
        if (c && c.usedCount > 0) {
          await db
            .update(coupons)
            .set({ usedCount: c.usedCount - 1 })
            .where(eq(coupons.id, c.id));
        }
      }
    } else if (prevStatus === 'CANCELLED' && newStatus !== 'CANCELLED') {
      // Deduct stock again
      for (const item of existing.items) {
        const prod = await getProductByIdFromDb(item.product.id);
        if (prod) {
          await db
            .update(products)
            .set({ stock: Math.max(0, prod.stock - item.quantity) })
            .where(eq(products.id, prod.id));
        }
      }
    }

    await db
      .update(orders)
      .set({ status: newStatus })
      .where(eq(orders.id, orderId));

    const updatedOrders = await getAllOrdersFromDb();
    return updatedOrders.find((o) => o.id === orderId) || null;
  } catch (error) {
    console.error('Database query failed in updateOrderStatusInDb:', error);
    throw new Error('Không thể cập nhật trạng thái đơn hàng.', { cause: error });
  }
}
