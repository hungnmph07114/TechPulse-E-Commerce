import React, { useState, useEffect } from 'react';
import { X, Building2, Save, CheckCircle2, QrCode, Sparkles } from 'lucide-react';
import { VIETNAM_BANKS, getActiveBankConfig, saveBankConfig } from '../config/bankConfig';

export default function BankSettingsModal({ isOpen, onClose, addToast }) {
  const [config, setConfig] = useState(getActiveBankConfig());
  const [previewAmount, setPreviewAmount] = useState('100000');

  useEffect(() => {
    if (isOpen) {
      setConfig(getActiveBankConfig());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleBankChange = (e) => {
    const selectedId = e.target.value;
    const found = VIETNAM_BANKS.find((b) => b.id === selectedId);
    if (found) {
      setConfig({
        ...config,
        bankId: found.id,
        bankName: found.name
      });
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (!config.accountNo || !config.accountName) {
      if (addToast) addToast('Vui lòng nhập số tài khoản và tên chủ tài khoản', 'warning');
      return;
    }

    saveBankConfig(config);
    if (addToast) addToast('Đã lưu cấu hình tài khoản ngân hàng thành công!', 'success');
    onClose();
  };

  const previewUrl = `https://img.vietqr.io/image/${config.bankId}-${config.accountNo}-${config.template || 'compact2'}.png?amount=${previewAmount}&addInfo=DEMO&accountName=${encodeURIComponent(config.accountName || '')}`;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.7)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 110,
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
          maxWidth: '680px',
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.5rem' }}>
          <div style={{
            width: '42px',
            height: '42px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Building2 size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Cấu hình Tài khoản Ngân hàng (VietQR)
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Thiết lập số tài khoản để nhận tiền thanh toán trực tiếp từ khách hàng
            </p>
          </div>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '1.5rem',
          marginTop: '1.25rem'
        }}>
          {/* Form */}
          <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Chọn ngân hàng của bạn *
              </label>
              <select
                value={config.bankId}
                onChange={handleBankChange}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  fontSize: '0.88rem'
                }}
              >
                {VIETNAM_BANKS.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Số tài khoản ngân hàng *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: 0908123456 hoặc 1903..."
                value={config.accountNo}
                onChange={(e) => setConfig({ ...config, accountNo: e.target.value.trim() })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  fontWeight: 600
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Tên chủ tài khoản (Viết hoa không dấu) *
              </label>
              <input
                type="text"
                required
                placeholder="Ví dụ: NGUYEN VAN A"
                value={config.accountName}
                onChange={(e) => setConfig({ ...config, accountName: e.target.value.toUpperCase() })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  letterSpacing: '0.02em'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                Giao diện mã QR (Template)
              </label>
              <select
                value={config.template || 'compact2'}
                onChange={(e) => setConfig({ ...config, template: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  fontSize: '0.88rem'
                }}
              >
                <option value="compact2">Chuẩn VietQR (Có khung thông tin & Logo Napas)</option>
                <option value="qr_only">Chỉ mã QR đơn giản (QR Only)</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Hủy
              </button>
              <button type="submit" className="btn btn-primary" style={{ flex: 1.5, background: '#059669' }}>
                <Save size={16} /> Lưu cấu hình
              </button>
            </div>
          </form>

          {/* Live Preview QR Code */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Sparkles size={14} /> Xem trước mã VietQR sẽ hiển thị cho khách:
            </div>

            {config.accountNo ? (
              <img
                src={previewUrl}
                alt="Xem trước VietQR"
                style={{
                  width: '100%',
                  maxWidth: '220px',
                  height: 'auto',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: '#ffffff'
                }}
              />
            ) : (
              <div style={{ padding: '3rem 1rem', color: 'var(--text-light)', fontSize: '0.85rem' }}>
                Nhập số tài khoản để xem trước mã QR
              </div>
            )}

            <div style={{ marginTop: '0.75rem', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Mã QR này sẽ tự động thay đổi số tiền và mã đơn hàng mỗi khi khách tạo đơn mới.
            </div>
          </div>
        </div>

        {/* Webhook Auto Confirmation Integration Guide */}
        <div style={{
          marginTop: '1.5rem',
          background: '#f8fafc',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid #e2e8f0',
          padding: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }}></span>
              Cấu hình Webhook Tự Động (SePay / PayOS / Cass.vn)
            </div>
            <span style={{ fontSize: '0.75rem', background: '#ecfdf5', color: '#059669', padding: '0.2rem 0.6rem', borderRadius: 'var(--radius-full)', fontWeight: 700 }}>
              Backend Sẵn Sàng (Active)
            </span>
          </div>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.5 }}>
            Khi tiền vào tài khoản của bạn, SePay hoặc PayOS sẽ tự động gửi webhook đến URL bên dưới. Hệ thống Spring Boot sẽ đối chiếu mã đơn <code style={{ color: '#b91c1c', background: '#fee2e2', padding: '1px 5px', borderRadius: '4px' }}>ORD-...</code> và chuyển trạng thái đơn hàng sang <strong>COMPLETED</strong> ngay lập tức:
          </p>
          <div style={{
            background: '#ffffff',
            padding: '0.65rem 0.85rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid #cbd5e1',
            fontFamily: 'monospace',
            fontSize: '0.82rem',
            color: 'var(--primary)',
            wordBreak: 'break-all',
            fontWeight: 700
          }}>
            POST http://localhost:8080/api/payment/webhook
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '0.5rem' }}>
            * Khi đưa website lên Internet, thay <code style={{ color: 'var(--text-main)' }}>localhost:8080</code> bằng tên miền của bạn (ví dụ: <code style={{ color: 'var(--text-main)' }}>https://api.yourdomain.com/api/payment/webhook</code>).
          </div>
        </div>
      </div>
    </div>
  );
}
