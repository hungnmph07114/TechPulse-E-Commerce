import React, { useState } from 'react';
import { X, CheckCircle, ShieldCheck, CreditCard, Banknote, Smartphone, QrCode } from 'lucide-react';
import { api } from '../services/api';
import VietQRModal from './VietQRModal';

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  onOrderSuccess,
  addToast
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    shippingAddress: '',
    notes: '',
    paymentMethod: 'BANK' // Default to VietQR bank transfer
  });
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  if (!isOpen) return null;

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customerName || !formData.customerPhone || !formData.shippingAddress || !formData.customerEmail) {
      addToast('Vui lòng điền đầy đủ các trường bắt buộc', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: formData.shippingAddress,
        notes: formData.notes,
        paymentMethod: formData.paymentMethod,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity
        }))
      };

      const res = await api.createOrder(payload);
      setCompletedOrder(res.data);
      onOrderSuccess();
      addToast('Đặt hàng thành công!', 'success');

      // If bank transfer was selected, automatically pop up the VietQR code!
      if (formData.paymentMethod === 'BANK') {
        setIsQRModalOpen(true);
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi tạo đơn hàng', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
            maxWidth: '650px',
            width: '100%',
            maxHeight: '90vh',
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

          {completedOrder ? (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--success-light)',
                color: 'var(--success)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem'
              }}>
                <CheckCircle size={42} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Đặt hàng thành công!
              </h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.95rem' }}>
                Cảm ơn bạn đã mua sắm tại TechPulse Store. Đơn hàng của bạn đã được ghi nhận vào hệ thống.
              </p>

              <div style={{
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                padding: '1.25rem',
                margin: '1.5rem 0',
                textAlign: 'left'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
                  <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{completedOrder.orderCode}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Người nhận:</span>
                  <span style={{ fontWeight: 600 }}>{completedOrder.customerName}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)' }}>{formatVND(completedOrder.totalAmount)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phương thức:</span>
                  <span className="badge badge-primary">{completedOrder.paymentMethod}</span>
                </div>
              </div>

              {completedOrder.paymentMethod === 'BANK' && (
                <div style={{ marginBottom: '1.5rem' }}>
                  <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)'
                    }}
                  >
                    <QrCode size={18} /> Mở mã VietQR chuyển khoản ngay
                  </button>
                </div>
              )}

              <button
                onClick={onClose}
                className="btn btn-secondary"
                style={{ padding: '0.75rem 2rem' }}
              >
                Tiếp tục mua hàng
              </button>
            </div>
          ) : (
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
                Thông tin nhận hàng & Thanh toán
              </h3>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                Vui lòng cung cấp địa chỉ và thông tin liên hệ chính xác để nhận hàng nhanh nhất.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                      Họ và tên *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={formData.customerName}
                      onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                      Số điện thoại *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912345678"
                      value={formData.customerPhone}
                      onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)'
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Email nhận hóa đơn *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={formData.customerEmail}
                    onChange={(e) => setFormData({ ...formData, customerEmail: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Địa chỉ giao hàng chi tiết *
                  </label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      resize: 'vertical'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                    Ghi chú cho đơn hàng
                  </label>
                  <input
                    type="text"
                    placeholder="Giao giờ hành chính, gọi trước..."
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)'
                    }}
                  />
                </div>

                {/* Payment methods */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '8px' }}>
                    Phương thức thanh toán
                  </label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.65rem' }}>
                    {[
                      { id: 'BANK', label: 'Chuyển khoản VietQR', icon: QrCode, badge: 'Khuyên dùng' },
                      { id: 'MOMO', label: 'Ví MoMo', icon: Smartphone, badge: null },
                      { id: 'COD', label: 'Tiền mặt COD', icon: Banknote, badge: null },
                    ].map((m) => {
                      const Icon = m.icon;
                      const selected = formData.paymentMethod === m.id;
                      return (
                        <div
                          key={m.id}
                          onClick={() => setFormData({ ...formData, paymentMethod: m.id })}
                          style={{
                            border: `2px solid ${selected ? 'var(--primary)' : 'var(--border)'}`,
                            borderRadius: 'var(--radius-md)',
                            padding: '0.75rem 0.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: selected ? 'var(--primary-light)' : '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.4rem',
                            transition: 'all var(--transition-fast)',
                            position: 'relative'
                          }}
                        >
                          {m.badge && (
                            <span style={{
                              position: 'absolute',
                              top: '-8px',
                              right: '4px',
                              background: '#10b981',
                              color: 'white',
                              fontSize: '0.62rem',
                              fontWeight: 700,
                              borderRadius: 'var(--radius-full)',
                              padding: '1px 6px'
                            }}>
                              {m.badge}
                            </span>
                          )}
                          <Icon size={20} color={selected ? 'var(--primary)' : 'var(--text-muted)'} />
                          <span style={{ fontSize: '0.8rem', fontWeight: selected ? 700 : 500, color: selected ? 'var(--primary)' : 'var(--text-main)' }}>
                            {m.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary & Submit */}
                <div style={{
                  marginTop: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px solid var(--border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Tổng thanh toán:</div>
                    <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatVND(totalAmount)}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button type="button" onClick={onClose} className="btn btn-secondary">
                      Hủy
                    </button>
                    <button type="submit" disabled={submitting} className="btn btn-primary">
                      {submitting ? 'Đang xử lý...' : 'Xác nhận Đặt hàng'}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* VietQR Modal */}
      {completedOrder && (
        <VietQRModal
          isOpen={isQRModalOpen}
          onClose={() => setIsQRModalOpen(false)}
          order={completedOrder}
          onConfirmPaid={() => addToast('Cảm ơn bạn! Đơn hàng sẽ được kiểm tra và xử lý ngay.', 'success')}
          addToast={addToast}
        />
      )}
    </>
  );
}
