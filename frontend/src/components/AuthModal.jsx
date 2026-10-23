import React, { useState } from 'react';
import { X, Lock, User, Mail, Phone, ShieldCheck, ArrowRight, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import { api, setAuthSession } from '../services/api';

export default function AuthModal({ isOpen, onClose, onAuthSuccess, addToast }) {
  const [isLoginTab, setIsLoginTab] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Login form state
  const [loginForm, setLoginForm] = useState({
    username: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState({
    username: '',
    email: '',
    fullName: '',
    phone: '',
    password: ''
  });

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    if (!loginForm.username || !loginForm.password) {
      setError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.login(loginForm);
      if (res.data) {
        setAuthSession(res.data);
        onAuthSuccess(res.data);
        addToast(`Xin chào, ${res.data.fullName || res.data.username}!`, 'success');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Tên đăng nhập hoặc mật khẩu không chính xác');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!registerForm.username || !registerForm.email || !registerForm.password || !registerForm.fullName) {
      setError('Vui lòng điền đầy đủ các thông tin bắt buộc');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const res = await api.register(registerForm);
      if (res.data) {
        setAuthSession(res.data);
        onAuthSuccess(res.data);
        addToast('Đăng ký tài khoản thành công!', 'success');
        onClose();
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi đăng ký tài khoản');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (type) => {
    if (type === 'admin') {
      setLoginForm({ username: 'admin', password: 'admin123' });
      setIsLoginTab(true);
      setError('');
    } else {
      setLoginForm({ username: 'user', password: 'user123' });
      setIsLoginTab(true);
      setError('');
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.65)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1.5rem'
    }}
    onClick={onClose}
    >
      <div
        className="fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '460px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          padding: '2rem'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-full)',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        {/* Header Icon */}
        <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-lg)',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            color: 'white',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px var(--primary-glow)',
            marginBottom: '0.75rem'
          }}>
            <ShieldCheck size={28} />
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {isLoginTab ? 'Đăng nhập tài khoản' : 'Tạo tài khoản mới'}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Bảo mật bằng Spring Security 6 & JSON Web Token (JWT)
          </p>
        </div>

        {/* Tab switchers */}
        <div style={{
          display: 'flex',
          background: '#f1f5f9',
          borderRadius: 'var(--radius-md)',
          padding: '4px',
          marginBottom: '1.25rem'
        }}>
          <button
            onClick={() => { setIsLoginTab(true); setError(''); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.88rem',
              backgroundColor: isLoginTab ? '#ffffff' : 'transparent',
              color: isLoginTab ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: isLoginTab ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Đăng nhập
          </button>
          <button
            onClick={() => { setIsLoginTab(false); setError(''); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.88rem',
              backgroundColor: !isLoginTab ? '#ffffff' : 'transparent',
              color: !isLoginTab ? 'var(--primary)' : 'var(--text-muted)',
              boxShadow: !isLoginTab ? 'var(--shadow-sm)' : 'none'
            }}
          >
            Đăng ký
          </button>
        </div>

        {/* Quick Demo Credentials */}
        {isLoginTab && (
          <div style={{
            background: 'var(--primary-light)',
            border: '1px dashed var(--border-focus)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            marginBottom: '1.25rem'
          }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> Điền nhanh tài khoản thử nghiệm:
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => fillQuickDemo('admin')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--primary)'
                }}
              >
                👑 Admin (admin / admin123)
              </button>
              <button
                type="button"
                onClick={() => fillQuickDemo('user')}
                style={{
                  background: '#ffffff',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '0.35rem 0.65rem',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  color: 'var(--text-main)'
                }}
              >
                👤 User (user / user123)
              </button>
            </div>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {/* Login Form */}
        {isLoginTab ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Tên đăng nhập
              </label>
              <div style={{ position: 'relative' }}>
                <User size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="text"
                  required
                  placeholder="Nhập username (ví dụ: admin)"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Mật khẩu
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Đang xác thực...' : 'Đăng nhập ngay'} <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          /* Register Form */
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Họ và tên *
              </label>
              <input
                type="text"
                required
                placeholder="Nguyễn Văn A"
                value={registerForm.fullName}
                onChange={(e) => setRegisterForm({ ...registerForm, fullName: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  placeholder="user123"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Điện thoại
                </label>
                <input
                  type="tel"
                  placeholder="0912345678"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)'
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Email *
              </label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Mật khẩu *
              </label>
              <input
                type="password"
                required
                placeholder="Tối thiểu 6 ký tự"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.6rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.8rem', marginTop: '0.5rem' }}
            >
              {loading ? 'Đang tạo tài khoản...' : 'Hoàn tất Đăng ký'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
