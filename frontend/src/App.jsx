import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Storefront from './components/Storefront';
import AdminProducts from './components/AdminProducts';
import AdminOrders from './components/AdminOrders';
import Dashboard from './components/Dashboard';
import CartDrawer from './components/CartDrawer';
import CheckoutModal from './components/CheckoutModal';
import AuthModal from './components/AuthModal';
import Toast from './components/Toast';
import { api, getStoredUser, clearAuthSession } from './services/api';
import { ShieldAlert, KeyRound } from 'lucide-react';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('store');
  const [categories, setCategories] = useState([]);
  const [currentUser, setCurrentUser] = useState(() => getStoredUser());
  const [isAuthOpen, setIsAuthOpen] = useState(false);
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

  // Fetch initial categories
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
  }, []);

  // Save cart to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('techpulse_cart', JSON.stringify(cartItems));
    } catch (e) {
      console.error(e);
    }
  }, [cartItems]);

  // Toast helper
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

  // Auth operations
  const handleAuthSuccess = (userData) => {
    setCurrentUser(userData);
  };

  const handleLogout = () => {
    clearAuthSession();
    setCurrentUser(null);
    if (activeTab !== 'store') {
      setActiveTab('store');
    }
    addToast('Đã đăng xuất tài khoản', 'info');
  };

  // Cart operations
  const handleAddToCart = (product, quantity = 1) => {
    setCartItems((prev) => {
      const existing = prev.find((item) => item.product.id === product.id);
      if (existing) {
        const newQty = Math.min(product.stock, existing.quantity + quantity);
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: newQty } : item
        );
      } else {
        return [...prev, { product, quantity: Math.min(product.stock, quantity) }];
      }
    });
    addToast(`Đã thêm "${product.name}" vào giỏ hàng`, 'success');
  };

  const handleUpdateQuantity = (productId, quantity) => {
    setCartItems((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, quantity } : item
      )
    );
  };

  const handleRemoveFromCart = (productId) => {
    setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
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

  const renderAdminGuard = () => (
    <div style={{
      margin: '3rem auto',
      maxWidth: '520px',
      background: '#ffffff',
      borderRadius: 'var(--radius-xl)',
      border: '1px solid var(--border)',
      padding: '2.5rem',
      textAlign: 'center',
      boxShadow: 'var(--shadow-lg)'
    }}>
      <div style={{
        width: '64px',
        height: '64px',
        borderRadius: 'var(--radius-full)',
        background: 'var(--warning-light)',
        color: 'var(--warning)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: '1rem'
      }}>
        <ShieldAlert size={32} />
      </div>
      <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
        Yêu cầu Quyền Quản trị viên
      </h3>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0.75rem 0 1.5rem', lineHeight: 1.6 }}>
        {currentUser ? (
          <>Tài khoản hiện tại của bạn (<strong>{currentUser.username}</strong>) có vai trò Khách hàng, không có quyền truy cập khu vực quản lý hệ thống.</>
        ) : (
          <>Bạn cần đăng nhập bằng tài khoản Quản trị viên (Admin) để có quyền quản lý kho hàng, đơn hàng và thống kê.</>
        )}
      </p>

      <button
        onClick={() => setIsAuthOpen(true)}
        className="btn btn-primary"
        style={{ padding: '0.75rem 1.75rem' }}
      >
        <KeyRound size={16} /> Đăng nhập với tài khoản Admin
      </button>
    </div>
  );

  return (
    <div className="app-container" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        cartCount={cartCount}
        setIsCartOpen={setIsCartOpen}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        currentUser={currentUser}
        onOpenAuth={() => setIsAuthOpen(true)}
        onLogout={handleLogout}
      />

      <main className="container" style={{ flex: 1 }}>
        {activeTab === 'store' && (
          <Storefront
            categories={categories}
            onAddToCart={handleAddToCart}
            searchQuery={searchQuery}
            addToast={addToast}
          />
        )}

        {activeTab === 'admin-products' && (
          isAdmin ? (
            <AdminProducts
              categories={categories}
              addToast={addToast}
            />
          ) : renderAdminGuard()
        )}

        {activeTab === 'admin-orders' && (
          isAdmin ? (
            <AdminOrders addToast={addToast} />
          ) : renderAdminGuard()
        )}

        {activeTab === 'dashboard' && (
          isAdmin ? (
            <Dashboard
              setActiveTab={setActiveTab}
              addToast={addToast}
            />
          ) : renderAdminGuard()
        )}
      </main>

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartItems={cartItems}
        onUpdateQuantity={handleUpdateQuantity}
        onRemoveItem={handleRemoveFromCart}
        onCheckout={() => setIsCheckoutOpen(true)}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cartItems={cartItems}
        onOrderSuccess={handleOrderSuccess}
        addToast={addToast}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
        addToast={addToast}
      />

      {/* Toast Notifications */}
      <Toast toasts={toasts} removeToast={removeToast} />

      {/* Footer */}
      <footer style={{
        marginTop: 'auto',
        borderTop: '1px solid var(--border)',
        backgroundColor: '#ffffff',
        padding: '2rem 0',
        color: 'var(--text-muted)',
        fontSize: '0.88rem'
      }}>
        <div className="container" style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div>
            <strong>TechPulse E-Commerce</strong> — Spring Boot 3.3 + Spring Security + JWT + React 19 + MySQL 8.4
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            <span>REST API: <code>localhost:8080</code></span>
            <span>Frontend: <code>localhost:5173</code></span>
            <span>Database: <code>ecommerce_db</code></span>
          </div>
        </div>
      </footer>
    </div>
  );
}
