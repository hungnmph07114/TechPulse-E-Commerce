import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Storefront from './components/Storefront';
import CustomerOrders from './components/CustomerOrders';
import AdminPortal from './components/AdminPortal';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import ProfileModal from './components/ProfileModal';
import TrackOrderModal from './components/TrackOrderModal';
import ChatbotWidget from './components/ChatbotWidget';
import Toast from './components/Toast';
import { api, getStoredUser, clearAuthSession, setAuthSession } from './services/api';
import './App.css';

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  // Automatically start in 'admin' portal if logged in user is ROLE_ADMIN
  const [appMode, setAppMode] = useState(() =>
    getStoredUser()?.role === 'ROLE_ADMIN' ? 'admin' : 'store'
  );
  const [activeTab, setActiveTab] = useState('store');
  const [categories, setCategories] = useState([]);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [trackOrderInitialCode, setTrackOrderInitialCode] = useState('');

  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('techpulse_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [toasts, setToasts] = useState([]);

  const fetchCategories = async () => {
    try {
      const res = await api.getCategories();
      if (res.data) {
        setCategories(res.data);
      }
    } catch (err) {
      console.error('Không thể tải danh mục:', err);
    }
  };

  useEffect(() => {
    fetchCategories();
    if (getStoredUser()) {
      api
        .getMe()
        .then((res) => {
          if (res.data) {
            setAuthSession(res.data);
            setCurrentUser(res.data);
            if (res.data.role === 'ROLE_ADMIN') {
              setAppMode('admin');
            }
          }
        })
        .catch(() => {});
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('techpulse_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  const addToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const handleOpenTrackOrder = (orderCode = '') => {
    setTrackOrderInitialCode(orderCode || '');
    setIsTrackOrderOpen(true);
  };

  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
    if (userData?.role === 'ROLE_ADMIN') {
      setAppMode('admin');
      addToast('Đã tự động chuyển hướng vào Trang Quản trị Admin!', 'info');
    } else {
      setAppMode('store');
    }
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    setAppMode('store');
    setActiveTab('store');
    addToast('Đã đăng xuất tài khoản', 'info');
  };

  const handleAddToCart = (product, quantity = 1, selectedVariant = '', unitPrice = null) => {
    const cleanVariant = selectedVariant || '';
    const effectivePrice =
      unitPrice !== null && unitPrice !== undefined ? Number(unitPrice) : product.price;
    const cartKey = `${product.id}__${cleanVariant || 'default'}`;

    setCartItems((prev) => {
      const existing = prev.find(
        (item) => (item.cartKey || `${item.product.id}__default`) === cartKey
      );
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          (item.cartKey || `${item.product.id}__default`) === cartKey
            ? { ...item, quantity: newQty, unitPrice: effectivePrice }
            : item
        );
      } else {
        return [
          ...prev,
          {
            cartKey,
            product: { ...product, price: effectivePrice },
            selectedVariant: cleanVariant,
            unitPrice: effectivePrice,
            quantity: Math.min(product.stock, quantity),
          },
        ];
      }
    });
    const variantSuffix = cleanVariant ? ` (${cleanVariant})` : '';
    addToast(`Đã thêm "${product.name}${variantSuffix}" vào giỏ hàng`, 'success');
  };

  const handleUpdateQuantity = (cartKeyOrId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) => {
        const key = item.cartKey || `${item.product.id}__default`;
        if (key === cartKeyOrId || item.product.id === cartKeyOrId) {
          return { ...item, quantity };
        }
        return item;
      })
    );
  };

  const handleRemoveFromCart = (cartKeyOrId) => {
    setCartItems((prev) =>
      prev.filter((item) => {
        const key = item.cartKey || `${item.product.id}__default`;
        return key !== cartKeyOrId && item.product.id !== cartKeyOrId;
      })
    );
    addToast('Đã xóa sản phẩm khỏi giỏ hàng', 'info');
  };

  const handleOrderSuccess = () => {
    setCartItems([]);
    try {
      localStorage.removeItem('techpulse_cart');
    } catch {}
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = currentUser?.role === 'ROLE_ADMIN';

  return (
    <div
      className="app-container"
      style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}
    >
      {appMode === 'admin' ? (
        /* ================= DEDICATED ADMIN PORTAL (GATED BY ROLE_ADMIN) ================= */
        <AdminPortal
          currentUser={currentUser}
          categories={categories}
          onCategoriesChanged={fetchCategories}
          onSwitchToStore={() => {
            setAppMode('store');
            setActiveTab('store');
          }}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenTrackOrder={handleOpenTrackOrder}
          onAuthSuccess={handleAuthSuccess}
          onLogout={handleLogout}
          addToast={addToast}
        />
      ) : (
        /* ================= CUSTOMER STOREFRONT ================= */
        <>
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            cartCount={cartCount}
            setIsCartOpen={setIsCartOpen}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            currentUser={currentUser}
            onOpenAuth={() => setIsAuthOpen(true)}
            onOpenProfile={() => setIsProfileOpen(true)}
            onOpenTrackOrder={handleOpenTrackOrder}
            onOpenAdminPortal={() => setAppMode('admin')}
            onLogout={handleLogout}
          />

          <main className="container" style={{ flex: 1 }}>
            {activeTab === 'store' && (
              <Storefront
                categories={categories}
                currentUser={currentUser}
                onAddToCart={handleAddToCart}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                addToast={addToast}
              />
            )}

            {activeTab === 'customer-orders' && (
              <CustomerOrders
                currentUser={currentUser}
                addToast={addToast}
                onNavigateStore={() => setActiveTab('store')}
              />
            )}
          </main>

          {/* Footer */}
          <footer
            style={{
              marginTop: 'auto',
              borderTop: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              padding: '2rem 0',
              color: 'var(--text-muted)',
              fontSize: '0.88rem',
            }}
          >
            <div
              className="container"
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
              }}
            >
              <div>
                <strong>TechPulse E-Commerce</strong> — Hệ thống thương mại điện tử & Quản trị kho vận
              </div>
              <div style={{ display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <span
                  onClick={() => handleOpenTrackOrder('')}
                  style={{ cursor: 'pointer', color: 'var(--primary)', fontWeight: 700 }}
                >
                  Track Order (Theo dõi vận đơn)
                </span>
                <span
                  onClick={() => setActiveTab('customer-orders')}
                  style={{ cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600 }}
                >
                  Lịch sử đơn hàng
                </span>
                <span
                  onClick={() => setAppMode('admin')}
                  style={{ cursor: 'pointer', color: '#d97706', fontWeight: 700 }}
                >
                  Admin Dashboard
                </span>
                <span>Hotline: 1900 6868</span>
              </div>
            </div>
          </footer>

          {/* AI Product Consultant & Order Tracking Chatbot */}
          <ChatbotWidget onOpenTrackOrder={handleOpenTrackOrder} />
        </>
      )}

      {/* Shared Modals & Notifications */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        currentUser={currentUser}
        onOrderSuccess={handleOrderSuccess}
        onViewOrders={() => setActiveTab('customer-orders')}
        onTrackOrder={handleOpenTrackOrder}
        addToast={addToast}
      />

      <TrackOrderModal
        isOpen={isTrackOrderOpen}
        onClose={() => setIsTrackOrderOpen(false)}
        initialOrderCode={trackOrderInitialCode}
        addToast={addToast}
      />

      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        addToast={addToast}
      />

      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onUserUpdated={(updated) => setCurrentUser(updated)}
        addToast={addToast}
      />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
