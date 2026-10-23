import React, { useState } from 'react';
import {
  LayoutDashboard,
  Package,
  FolderKanban,
  Tag,
  FileText,
  Users,
  Store,
  LogOut,
  ShieldCheck,
  ShieldAlert,
  Truck,
  UserCog,
  ChevronRight,
  Database,
  KeyRound,
  Lock,
  Sparkles,
  ArrowLeft,
  MessageSquare,
  History,
} from 'lucide-react';
import Dashboard from './Dashboard';
import AdminProducts from './AdminProducts';
import AdminOrders from './AdminOrders';
import AdminUsers from './AdminUsers';
import AdminReviews from './AdminReviews';
import AdminAuditLogs from './AdminAuditLogs';
import { api, setAuthSession } from '../services/api';

const ADMIN_MODULES = [
  {
    id: 'dashboard',
    tab: 'dashboard',
    subTab: null,
    label: 'Phân tích Doanh thu & KPI',
    description: 'Báo cáo doanh thu thực nhận, biểu đồ tỷ trọng danh mục, định giá tồn kho và xuất CSV',
    icon: LayoutDashboard,
    badge: 'Analytics',
  },
  {
    id: 'inventory-products',
    tab: 'admin-products',
    subTab: 'products',
    label: 'Kho hàng & Sản phẩm',
    description: 'Quản lý danh mục thiết bị, điều chỉnh tồn kho nhanh (-1/+1/+10) và cấu hình biến thể',
    icon: Package,
    badge: 'Inventory',
  },
  {
    id: 'vouchers',
    tab: 'admin-products',
    subTab: 'coupons',
    label: 'Quản lý Mã giảm giá (Voucher)',
    description: 'Phát hành mã khuyến mãi theo % hoặc số tiền cố định, giới hạn lượt dùng và hạn sử dụng',
    icon: Tag,
    badge: 'Vouchers',
  },
  {
    id: 'categories',
    tab: 'admin-products',
    subTab: 'categories',
    label: 'Danh mục Thiết bị',
    description: 'Tổ chức cây danh mục sản phẩm hiển thị trên Cửa hàng và bộ lọc tìm kiếm',
    icon: FolderKanban,
    badge: 'Catalog',
  },
  {
    id: 'admin-orders',
    tab: 'admin-orders',
    subTab: null,
    label: 'Quản lý Vận đơn & VietQR',
    description: 'Xử lý đơn đặt hàng, duyệt tiến trình giao hàng 4 bước, xác nhận VietQR và in hóa đơn',
    icon: FileText,
    badge: 'Orders',
  },
  {
    id: 'admin-reviews',
    tab: 'admin-reviews',
    subTab: null,
    label: 'Kiểm duyệt Đánh giá (Reviews)',
    description: 'Quản lý nhận xét khách hàng, phản hồi CSKH chính thức, ẩn/hiện hoặc xóa đánh giá vi phạm',
    icon: MessageSquare,
    badge: 'Moderation',
  },
  {
    id: 'admin-audit-logs',
    tab: 'admin-audit-logs',
    subTab: null,
    label: 'Nhật ký Tồn kho & Audit Log',
    description: 'Theo dõi lịch sử xuất/nhập kho tự động, đối soát biến động số lượng và thao tác Quản trị viên',
    icon: History,
    badge: 'Audit Log',
  },
  {
    id: 'admin-users',
    tab: 'admin-users',
    subTab: null,
    label: 'Khách hàng & Phân quyền RBAC',
    description: 'Quản lý hồ sơ khách hàng, xếp hạng chi tiêu VIP và cấp quyền Quản trị viên (ROLE_ADMIN)',
    icon: Users,
    badge: 'CRM & RBAC',
  },
];

export default function AdminPortal({
  currentUser,
  categories,
  onCategoriesChanged,
  onSwitchToStore,
  onOpenProfile,
  onOpenTrackOrder,
  onAuthSuccess,
  onLogout,
  addToast,
}) {
  const [activeNavId, setActiveNavId] = useState('dashboard');
  const [adminTab, setAdminTab] = useState('dashboard');
  const [productsSubTab, setProductsSubTab] = useState('products');

  // Inline RBAC Admin Login Gate State
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState('');

  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const handleNavigateModule = (targetTab, targetSubTab = null) => {
    setAdminTab(targetTab);
    if (targetTab === 'admin-products') {
      const sub = targetSubTab || 'products';
      setProductsSubTab(sub);
      if (sub === 'coupons') setActiveNavId('vouchers');
      else if (sub === 'categories') setActiveNavId('categories');
      else setActiveNavId('inventory-products');
    } else if (targetTab === 'admin-orders') {
      setActiveNavId('admin-orders');
    } else if (targetTab === 'admin-reviews') {
      setActiveNavId('admin-reviews');
    } else if (targetTab === 'admin-audit-logs') {
      setActiveNavId('admin-audit-logs');
    } else if (targetTab === 'admin-users') {
      setActiveNavId('admin-users');
    } else {
      setActiveNavId('dashboard');
    }
  };

  const handleSelectModule = (mod) => {
    setActiveNavId(mod.id);
    setAdminTab(mod.tab);
    if (mod.subTab) {
      setProductsSubTab(mod.subTab);
    }
  };

  const handleAdminGateLogin = async (e) => {
    e.preventDefault();
    setLoginError('');
    if (!username.trim() || !password.trim()) {
      setLoginError('Vui lòng nhập tài khoản và mật khẩu Quản trị viên');
      return;
    }

    setLoggingIn(true);
    try {
      const res = await api.login({ username: username.trim(), password });
      if (res.data) {
        if (res.data.role !== 'ROLE_ADMIN') {
          setLoginError(
            `Tài khoản "${res.data.username}" chỉ có quyền Khách hàng (ROLE_USER). Vui lòng dùng tài khoản ROLE_ADMIN.`
          );
          return;
        }
        setAuthSession(res.data);
        if (onAuthSuccess) onAuthSuccess(res.data);
        addToast('Xác thực quyền Quản trị viên (ROLE_ADMIN) thành công!', 'success');
      }
    } catch (err) {
      setLoginError(err.message || 'Thông tin đăng nhập không chính xác');
    } finally {
      setLoggingIn(false);
    }
  };

  const fillDemoAdmin = () => {
    setUsername('admin');
    setPassword('admin123');
    setLoginError('');
  };

  // ================= ROLE-BASED AUTHENTICATION GATE =================
  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #312e81 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
        }}
      >
        <div
          className="fade-in"
          style={{
            maxWidth: '480px',
            width: '100%',
            background: '#ffffff',
            borderRadius: '20px',
            padding: '2.25rem',
            boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: currentUser
                  ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                  : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
                boxShadow: '0 10px 25px rgba(79, 70, 229, 0.3)',
              }}
            >
              {currentUser ? <ShieldAlert size={32} /> : <Lock size={30} />}
            </div>

            <span
              style={{
                display: 'inline-block',
                fontSize: '0.72rem',
                fontWeight: 800,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                padding: '3px 10px',
                borderRadius: '999px',
                background: '#eef2ff',
                color: '#4f46e5',
                marginBottom: '0.5rem',
              }}
            >
              Role-Based Access Control • ROLE_ADMIN
            </span>

            <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {currentUser
                ? 'Yêu cầu Quyền Quản trị viên'
                : 'Đăng nhập Admin Dashboard'}
            </h2>
            <p
              style={{
                fontSize: '0.88rem',
                color: 'var(--text-muted)',
                marginTop: '0.4rem',
                lineHeight: 1.5,
              }}
            >
              {currentUser ? (
                <>
                  Tài khoản hiện tại <strong>{currentUser.username}</strong> đang có vai trò{' '}
                  <span className="badge badge-primary">Khách hàng (ROLE_USER)</span>. Khu vực quản
                  lý tồn kho, sản phẩm, voucher và báo cáo doanh thu chỉ dành cho{' '}
                  <strong>ROLE_ADMIN</strong>.
                </>
              ) : (
                'Khu vực dành riêng cho Quản trị viên để quản lý tồn kho, sản phẩm, mã giảm giá và phân tích doanh thu thời gian thực.'
              )}
            </p>
          </div>

          <form
            onSubmit={handleAdminGateLogin}
            style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}
          >
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '4px',
                }}
              >
                Tài khoản Quản trị viên (Admin Username)
              </label>
              <input
                type="text"
                required
                placeholder="Nhập username admin..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  marginBottom: '4px',
                }}
              >
                Mật khẩu bảo mật
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.7rem 0.9rem',
                  borderRadius: '10px',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                  fontSize: '0.9rem',
                }}
              />
            </div>

            {loginError && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  borderRadius: '10px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  fontSize: '0.82rem',
                  fontWeight: 600,
                }}
              >
                {loginError}
              </div>
            )}

            <button
              type="submit"
              disabled={loggingIn}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', fontSize: '0.92rem', fontWeight: 700 }}
            >
              <KeyRound size={17} />
              {loggingIn ? 'Đang xác thực quyền Admin...' : 'Đăng nhập vào Admin Dashboard'}
            </button>
          </form>

          {/* Quick Demo Admin Credentials Box */}
          <div
            style={{
              marginTop: '1.15rem',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              background: '#f8fafc',
              border: '1px dashed #cbd5e1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              <div>
                <strong style={{ color: 'var(--text-main)' }}>Tài khoản Admin mẫu:</strong>
              </div>
              <div>
                User: <code>admin</code> • Pass: <code>admin123</code>
              </div>
            </div>
            <button
              type="button"
              onClick={fillDemoAdmin}
              className="btn btn-secondary btn-sm"
              style={{ fontSize: '0.76rem', fontWeight: 700, whiteSpace: 'nowrap' }}
            >
              <Sparkles size={13} color="var(--primary)" /> Điền nhanh
            </button>
          </div>

          <div
            style={{
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <button
              type="button"
              onClick={onSwitchToStore}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: 'var(--text-muted)',
              }}
            >
              <ArrowLeft size={15} /> Quay về Cửa hàng Khách (Storefront)
            </button>
          </div>
        </div>
      </div>
    );
  }

  const activeModule =
    ADMIN_MODULES.find((m) => m.id === activeNavId) || ADMIN_MODULES[0];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        backgroundColor: '#f1f5f9',
        color: 'var(--text-main)',
      }}
    >
      {/* Left Sidebar Navigation */}
      <aside
        style={{
          width: '285px',
          flexShrink: 0,
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%)',
          color: '#ffffff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255, 255, 255, 0.08)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 90,
        }}
      >
        {/* Brand Header */}
        <div
          style={{
            padding: '1.3rem 1.25rem',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 6px 16px rgba(79, 70, 229, 0.4)',
              flexShrink: 0,
            }}
          >
            <ShieldCheck size={23} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '1.08rem',
                fontWeight: 800,
                letterSpacing: '-0.02em',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              TechPulse
              <span
                style={{
                  fontSize: '0.64rem',
                  fontWeight: 800,
                  padding: '2px 7px',
                  borderRadius: '999px',
                  background: 'rgba(245, 158, 11, 0.2)',
                  color: '#fbbf24',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                }}
              >
                ADMIN
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: '2px' }}>
              Admin Dashboard & ERP
            </div>
          </div>
        </div>

        {/* Database Status Pill */}
        <div style={{ padding: '0.85rem 1.15rem 0.3rem' }}>
          <div
            style={{
              padding: '0.5rem 0.75rem',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.74rem',
              color: '#cbd5e1',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600 }}>
              <Database size={13} color="#38bdf8" /> PostgreSQL + RBAC
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                color: '#34d399',
                fontWeight: 700,
                fontSize: '0.68rem',
              }}
            >
              <span
                style={{
                  width: '7px',
                  height: '7px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 8px #10b981',
                }}
              />
              ROLE_ADMIN
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <div
          style={{
            padding: '0.65rem 0.9rem',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '0.3rem',
          }}
        >
          <div
            style={{
              fontSize: '0.67rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              padding: '0.25rem 0.6rem 0.35rem',
            }}
          >
            Quản trị Doanh thu & Kho hàng
          </div>

          {ADMIN_MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = activeNavId === mod.id;
            return (
              <button
                key={mod.id}
                onClick={() => handleSelectModule(mod)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.7rem',
                  padding: '0.72rem 0.9rem',
                  borderRadius: '11px',
                  background: isActive
                    ? 'linear-gradient(135deg, #4f46e5 0%, #3b82f6 100%)'
                    : 'transparent',
                  color: isActive ? '#ffffff' : '#cbd5e1',
                  fontWeight: isActive ? 700 : 500,
                  fontSize: '0.85rem',
                  textAlign: 'left',
                  transition: 'all 0.18s ease',
                  boxShadow: isActive ? '0 8px 18px -4px rgba(79, 70, 229, 0.5)' : 'none',
                  border: isActive
                    ? '1px solid rgba(255, 255, 255, 0.18)'
                    : '1px solid transparent',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.7rem' }}>
                  <Icon size={17} color={isActive ? '#ffffff' : '#94a3b8'} />
                  <span>{mod.label}</span>
                </span>
                <ChevronRight
                  size={14}
                  style={{
                    opacity: isActive ? 1 : 0.35,
                    transform: isActive ? 'translateX(2px)' : 'none',
                  }}
                />
              </button>
            );
          })}

          <div
            style={{
              fontSize: '0.67rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              color: '#64748b',
              padding: '0.9rem 0.6rem 0.35rem',
            }}
          >
            Lối tắt Hệ thống
          </div>

          <button
            onClick={() => onOpenTrackOrder && onOpenTrackOrder('')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.7rem 0.9rem',
              borderRadius: '11px',
              background: 'rgba(255, 255, 255, 0.04)',
              color: '#e2e8f0',
              fontWeight: 600,
              fontSize: '0.84rem',
              textAlign: 'left',
              border: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            <Truck size={16} color="#38bdf8" />
            <span>Tra cứu vận đơn (Track Order)</span>
          </button>

          <button
            onClick={onSwitchToStore}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '0.7rem',
              padding: '0.7rem 0.9rem',
              borderRadius: '11px',
              background: 'rgba(16, 185, 129, 0.12)',
              color: '#6ee7b7',
              fontWeight: 700,
              fontSize: '0.84rem',
              textAlign: 'left',
              border: '1px solid rgba(16, 185, 129, 0.25)',
              marginTop: '0.2rem',
            }}
          >
            <Store size={16} color="#34d399" />
            <span>Xem giao diện Cửa hàng Khách</span>
          </button>
        </div>

        {/* Admin Account Footer */}
        <div
          style={{
            padding: '0.95rem 1.15rem',
            borderTop: '1px solid rgba(255, 255, 255, 0.08)',
            background: 'rgba(15, 23, 42, 0.6)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.6rem',
            }}
          >
            <div
              onClick={onOpenProfile}
              title="Chỉnh sửa hồ sơ Quản trị viên"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.65rem',
                cursor: 'pointer',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  color: '#ffffff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                {currentUser?.fullName
                  ? currentUser.fullName.charAt(0).toUpperCase()
                  : 'A'}
              </div>
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {currentUser?.fullName || currentUser?.username || 'Administrator'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#fbbf24', fontWeight: 600 }}>
                  ROLE_ADMIN • Hồ sơ
                </div>
              </div>
            </div>

            <button
              onClick={onLogout}
              title="Đăng xuất khỏi trang Quản trị"
              style={{
                padding: '0.48rem',
                borderRadius: '10px',
                background: 'rgba(239, 68, 68, 0.15)',
                color: '#fca5a5',
                border: '1px solid rgba(239, 68, 68, 0.25)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Right Main Workspace */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Admin Header Bar */}
        <header
          style={{
            position: 'sticky',
            top: 0,
            zIndex: 40,
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid var(--border)',
            padding: '0.85rem 1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  padding: '2px 8px',
                  borderRadius: '6px',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                }}
              >
                {activeModule.badge}
              </span>
              <h1
                style={{
                  fontSize: '1.2rem',
                  fontWeight: 800,
                  color: 'var(--text-main)',
                  margin: 0,
                }}
              >
                {activeModule.label}
              </h1>
            </div>
            <p
              style={{
                fontSize: '0.8rem',
                color: 'var(--text-muted)',
                margin: '0.2rem 0 0',
              }}
            >
              {activeModule.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => onOpenTrackOrder && onOpenTrackOrder('')}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
              }}
            >
              <Truck size={14} color="var(--primary)" />
              Kiểm tra Vận đơn
            </button>

            <button
              onClick={onOpenProfile}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.45rem 0.9rem',
                fontSize: '0.8rem',
              }}
            >
              <UserCog size={14} />
              Hồ sơ Admin
            </button>

            <button
              onClick={onSwitchToStore}
              className="btn btn-primary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.48rem 1rem',
                fontSize: '0.8rem',
                background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <Store size={14} />
              Xem Cửa hàng Khách
            </button>
          </div>
        </header>

        {/* Module Workspace Content */}
        <main
          style={{
            flex: 1,
            padding: '0.5rem 1.75rem 2.5rem',
            maxWidth: '1440px',
            width: '100%',
            margin: '0 auto',
          }}
        >
          {adminTab === 'dashboard' && (
            <Dashboard
              setActiveTab={(tab) => handleNavigateModule(tab)}
              onNavigateModule={handleNavigateModule}
              addToast={addToast}
            />
          )}

          {adminTab === 'admin-orders' && <AdminOrders addToast={addToast} />}

          {adminTab === 'admin-products' && (
            <AdminProducts
              categories={categories}
              onCategoriesChanged={onCategoriesChanged}
              initialSubTab={productsSubTab}
              addToast={addToast}
            />
          )}

          {adminTab === 'admin-reviews' && <AdminReviews addToast={addToast} />}

          {adminTab === 'admin-audit-logs' && <AdminAuditLogs addToast={addToast} />}

          {adminTab === 'admin-users' && (
            <AdminUsers currentUser={currentUser} addToast={addToast} />
          )}
        </main>
      </div>
    </div>
  );
}
