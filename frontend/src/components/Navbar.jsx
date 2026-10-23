import React from 'react';
import { ShoppingBag, ShoppingCart, LayoutGrid, Package, FileText, BarChart3, Search, User, LogOut, Shield, KeyRound, Lock } from 'lucide-react';

export default function Navbar({
  activeTab,
  setActiveTab,
  cartCount,
  setIsCartOpen,
  searchQuery,
  setSearchQuery,
  currentUser,
  onOpenAuth,
  onLogout
}) {
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  const handleTabClick = (tab) => {
    if (tab === 'admin-products' || tab === 'admin-orders' || tab === 'dashboard') {
      if (!currentUser) {
        onOpenAuth();
        return;
      }
    }
    setActiveTab(tab);
  };

  return (
    <header style={{
      position: 'sticky',
      top: 0,
      zIndex: 50,
      backdropFilter: 'blur(16px)',
      backgroundColor: 'rgba(255, 255, 255, 0.92)',
      borderBottom: '1px solid var(--border)',
      boxShadow: 'var(--shadow-sm)'
    }}>
      <div className="container" style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '70px',
        gap: '1.25rem'
      }}>
        {/* Brand Logo */}
        <div
          onClick={() => setActiveTab('store')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            cursor: 'pointer',
            userSelect: 'none'
          }}
        >
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)'
          }}>
            <ShoppingBag size={22} />
          </div>
          <div>
            <span style={{
              fontSize: '1.25rem',
              fontWeight: 800,
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.02em'
            }}>
              TechPulse
            </span>
            <span style={{
              display: 'block',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--text-muted)',
              marginTop: '-3px',
              textTransform: 'uppercase',
              letterSpacing: '0.04em'
            }}>
              Spring Security + JWT + MySQL
            </span>
          </div>
        </div>

        {/* Global Search Bar (Store view) */}
        {activeTab === 'store' && (
          <div style={{
            flex: '1',
            maxWidth: '380px',
            position: 'relative'
          }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-light)'
              }}
            />
            <input
              type="text"
              placeholder="Tìm sản phẩm, laptop, điện thoại..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.6rem 1rem 0.6rem 2.5rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                background: '#f8fafc',
                fontSize: '0.88rem',
                transition: 'all var(--transition-fast)'
              }}
            />
          </div>
        )}

        {/* Navigation Tabs */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <button
            onClick={() => setActiveTab('store')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'store' ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'store' ? 'var(--primary-light)' : 'transparent',
            }}
          >
            <LayoutGrid size={17} />
            Cửa hàng
          </button>

          <button
            onClick={() => handleTabClick('admin-products')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'admin-products' ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'admin-products' ? 'var(--primary-light)' : 'transparent',
            }}
            title={!currentUser ? 'Yêu cầu đăng nhập quản trị' : ''}
          >
            <Package size={17} />
            Kho hàng {!isAdmin && <Lock size={12} color="var(--text-light)" />}
          </button>

          <button
            onClick={() => handleTabClick('admin-orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'admin-orders' ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'admin-orders' ? 'var(--primary-light)' : 'transparent',
            }}
            title={!currentUser ? 'Yêu cầu đăng nhập quản trị' : ''}
          >
            <FileText size={17} />
            Đơn hàng {!isAdmin && <Lock size={12} color="var(--text-light)" />}
          </button>

          <button
            onClick={() => handleTabClick('dashboard')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              padding: '0.5rem 0.85rem',
              borderRadius: 'var(--radius-md)',
              fontSize: '0.88rem',
              fontWeight: 600,
              color: activeTab === 'dashboard' ? 'var(--primary)' : 'var(--text-muted)',
              backgroundColor: activeTab === 'dashboard' ? 'var(--primary-light)' : 'transparent',
            }}
            title={!currentUser ? 'Yêu cầu đăng nhập quản trị' : ''}
          >
            <BarChart3 size={17} />
            Thống kê {!isAdmin && <Lock size={12} color="var(--text-light)" />}
          </button>
        </nav>

        {/* User Account & Cart Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          {currentUser ? (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              padding: '0.35rem 0.65rem 0.35rem 0.5rem',
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-full)'
            }}>
              <div style={{
                width: '32px',
                height: '32px',
                borderRadius: 'var(--radius-full)',
                background: isAdmin ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'var(--primary)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}>
                {currentUser.fullName ? currentUser.fullName.charAt(0).toUpperCase() : 'U'}
              </div>

              <div style={{ lineHeight: 1.2 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-main)' }}>
                  {currentUser.fullName || currentUser.username}
                </div>
                <div style={{ fontSize: '0.68rem', fontWeight: 600, color: isAdmin ? '#d97706' : 'var(--primary)' }}>
                  {isAdmin ? 'QUẢN TRỊ VIÊN' : 'KHÁCH HÀNG'}
                </div>
              </div>

              <button
                onClick={onLogout}
                style={{
                  color: 'var(--text-light)',
                  padding: '4px',
                  borderRadius: 'var(--radius-full)',
                  marginLeft: '4px'
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
                fontSize: '0.85rem'
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
              height: '40px'
            }}
            title="Xem giỏ hàng"
          >
            <ShoppingCart size={19} />
            {cartCount > 0 && (
              <span style={{
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
                boxShadow: '0 2px 5px rgba(244, 63, 94, 0.4)'
              }}>
                {cartCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
}
