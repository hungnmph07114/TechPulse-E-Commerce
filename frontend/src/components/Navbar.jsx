import React from 'react';
import {
  ShoppingBag,
  ShoppingCart,
  LayoutGrid,
  Search,
  LogOut,
  KeyRound,
  ClipboardList,
  UserCheck,
  Truck,
  ShieldCheck,
} from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  cartCount,
  setIsCartOpen,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenAuth,
  onOpenProfile,
  onOpenTrackOrder,
  onOpenAdminPortal,
  onLogout,
}) {
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backdropFilter: 'blur(16px)',
        backgroundColor: 'rgba(255, 255, 255, 0.92)',
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '70px',
          gap: '1rem',
          flexWrap: 'wrap',
          paddingTop: '0.4rem',
          paddingBottom: '0.4rem',
        }}
      >
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('store')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: 'var(--radius-md)',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <span
              style={{
                fontSize: '1.25rem',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '-0.02em',
              }}
            >
              TechPulse
            </span>
          </div>
        </div>

        {/* Global Search Bar (Store view) */}
        {activeTab === 'store' && (
          <div
            style={{
              flex: '1',
              maxWidth: '380px',
              minWidth: '220px',
              position: 'relative',
            }}
          >
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm sản phẩm, laptop, điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.55rem 1rem 0.55rem 2.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                background: '#f8fafc',
                fontSize: '0.86rem',
                transition: 'all var(--transition-fast)',
              }}
            />
          </div>
        )}

        {/* Customer Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setActiveTab('store')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'store' ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'store' ? 'var(--primary-light)' : 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            <LayoutGrid size={16} />
            Cửa hàng
          </button>

          <button
            onClick={() => onOpenTrackOrder && onOpenTrackOrder('')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.95rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 700,
              color: '#ffffff',
              background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
              boxShadow: '0 3px 10px rgba(79, 70, 229, 0.25)',
              whiteSpace: 'nowrap',
            }}
            title="Tra cứu tiến trình vận đơn trực tiếp (Track Order)"
          >
            <Truck size={15} />
            Track Order
          </button>

          <button
            onClick={() => setActiveTab('customer-orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.9rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'customer-orders' ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'customer-orders' ? 'var(--primary-light)' : 'transparent',
              whiteSpace: 'nowrap',
            }}
          >
            <ClipboardList size={16} />
            Đơn hàng của tôi
          </button>

          {onOpenAdminPortal && (
            <button
              onClick={onOpenAdminPortal}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.5rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: isAdmin ? '#ffffff' : 'var(--text-main)',
                background: isAdmin
                  ? 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)'
                  : '#f8fafc',
                border: isAdmin ? 'none' : '1px solid var(--border)',
                boxShadow: isAdmin ? '0 3px 10px rgba(217, 119, 6, 0.3)' : 'none',
                whiteSpace: 'nowrap',
              }}
              title="Truy cập trang Quản trị viên chuyên biệt (Yêu cầu quyền ROLE_ADMIN)"
            >
              <ShieldCheck size={16} color={isAdmin ? '#ffffff' : '#d97706'} />
              Admin Dashboard
            </button>
          )}
        </nav>

        {/* User Account & Cart Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {currentUser ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.3rem 0.6rem 0.3rem 0.45rem',
                background: '#f8fafc',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-full)',
              }}
            >
              <div
                onClick={onOpenProfile}
                title="Bấm để chỉnh sửa Hồ sơ & Địa chỉ nhận hàng"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-full)',
                    background: isAdmin
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'var(--primary)',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                  }}
                >
                  {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
                </div>

                <div style={{ lineHeight: 1.2 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {currentUser.fullName || currentUser.username}
                  </div>
                  <div
                    style={{
                      fontSize: '0.66rem',
                      fontWeight: 600,
                      color: isAdmin ? '#d97706' : 'var(--primary)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '2px',
                    }}
                  >
                    <UserCheck size={10} /> {isAdmin ? 'ADMIN • Hồ sơ' : 'KHÁCH • Hồ sơ'}
                  </div>
                </div>
              </div>

              <button
                onClick={onLogout}
                style={{
                  color: 'var(--text-light)',
                  padding: '4px',
                  borderRadius: 'var(--radius-full)',
                  marginLeft: '2px',
                }}
                title="Đăng xuất"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenAuth}
              className="btn btn-secondary btn-sm"
              style={{
                borderRadius: 'var(--radius-full)',
                padding: '0.5rem 0.95rem',
                fontSize: '0.85rem',
              }}
            >
              <KeyRound size={15} color="var(--primary)" />
              Đăng nhập
            </button>
          )}

          {/* Cart Icon */}
          <button
            onClick={() => setIsCartOpen(true)}
            className="btn-icon"
            style={{
              position: 'relative',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              borderRadius: 'var(--radius-full)',
              width: '40px',
              height: '40px',
            }}
            title="Xem giỏ hàng"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  background: 'var(--accent)',
                  color: 'white',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  borderRadius: 'var(--radius-full)',
                  minWidth: '20px',
                  height: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 4px',
                  boxShadow: '0 2px 5px rgba(244, 63, 94, 0.4)',
                }}
              >
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
