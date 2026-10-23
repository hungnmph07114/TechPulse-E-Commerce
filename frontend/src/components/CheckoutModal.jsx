import React, { useState, useEffect } from 'react';
import {
  X, CheckCircle, QrCode, Banknote, Smartphone, Tag, Sparkles, Check, Loader2, FileText, Truck
} from 'lucide-react';
import { api } from '../services/api';
import VietQRModal from './VietQRModal';

const PROVINCES = [
  'TP. Hồ Chí Minh',
  'Hà Nội',
  'Đà Nẵng',
  'Hải Phòng',
  'Cần Thơ',
  'Bình Dương',
  'Đồng Nai',
  'Khánh Hòa',
  'Tỉnh / Thành phố khác',
];

export default function CheckoutModal({
  isOpen,
  onClose,
  cartItems,
  currentUser,
  onOrderSuccess,
  onViewOrders,
  onTrackOrder,
  addToast,
}) {
  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    customerEmail: '',
    province: 'TP. Hồ Chí Minh',
    shippingAddress: '',
    shippingMethod: 'STANDARD', // 'STANDARD' | 'EXPRESS_2H'
    notes: '',
    paymentMethod: 'BANK',
  });
  const [submitting, setSubmitting] = useState(false);
  const [completedOrder, setCompletedOrder] = useState(null);
  const [isQRModalOpen, setIsQRModalOpen] = useState(false);

  // Coupon / Voucher states
  const [availableCoupons, setAvailableCoupons] = useState([]);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null); // { coupon, discountAmount }
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState('');

  const subtotalAmount = cartItems.reduce(
    (sum, item) => sum + (item.unitPrice || item.product.price) * item.quantity,
    0
  );

  // Auto-fill user profile & fetch active coupons when modal opens
  useEffect(() => {
    if (isOpen) {
      setCompletedOrder(null);
      setAppliedCoupon(null);
      setCouponInput('');
      setCouponError('');

      if (currentUser) {
        setFormData((prev) => ({
          ...prev,
          customerName: currentUser.fullName || prev.customerName || '',
          customerPhone: currentUser.phone || prev.customerPhone || '',
          customerEmail: currentUser.email || prev.customerEmail || '',
          shippingAddress: currentUser.address || prev.shippingAddress || '',
        }));
      }

      api
        .getActiveCoupons()
        .then((res) => {
          if (res.data) setAvailableCoupons(res.data);
        })
        .catch(() => {});
    }
  }, [isOpen, currentUser]);

  if (!isOpen) return null;

  const discountAmount = appliedCoupon ? appliedCoupon.discountAmount : 0;
  const shippingFee =
    formData.shippingMethod === 'EXPRESS_2H'
      ? 50000
      : subtotalAmount >= 5000000
      ? 0
      : 30000;
  const finalAmount = Math.max(0, subtotalAmount - discountAmount + shippingFee);

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      price || 0
    );
  };

  const handleApplyCoupon = async (codeToApply) => {
    const code = (codeToApply || couponInput || '').trim().toUpperCase();
    if (!code) {
      setCouponError('Vui lòng nhập mã giảm giá');
      return;
    }

    setValidatingCoupon(true);
    setCouponError('');
    try {
      const res = await api.validateCoupon(code, subtotalAmount);
      if (res.data) {
        setAppliedCoupon(res.data);
        setCouponInput(res.data.coupon.code);
        addToast(res.message || `Đã áp dụng mã ${res.data.coupon.code}`, 'success');
      }
    } catch (err) {
      setAppliedCoupon(null);
      setCouponError(err.message || 'Mã giảm giá không hợp lệ');
    } finally {
      setValidatingCoupon(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.customerName ||
      !formData.customerPhone ||
      !formData.shippingAddress ||
      !formData.customerEmail
    ) {
      addToast('Vui lòng điền đầy đủ các trường bắt buộc', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const fullAddress = formData.shippingAddress.includes(formData.province)
        ? formData.shippingAddress
        : `${formData.shippingAddress}, ${formData.province}`;

      const payload = {
        customerName: formData.customerName,
        customerEmail: formData.customerEmail,
        customerPhone: formData.customerPhone,
        shippingAddress: fullAddress,
        notes:
          (formData.shippingMethod === 'EXPRESS_2H' ? '[Giao Hỏa Tốc 2H] ' : '') +
          (formData.notes || ''),
        paymentMethod: formData.paymentMethod,
        shippingFee,
        couponCode: appliedCoupon ? appliedCoupon.coupon.code : null,
        items: cartItems.map((item) => ({
          productId: item.product.id,
          quantity: item.quantity,
          selectedVariant: item.selectedVariant || '',
          unitPrice: item.unitPrice || item.product.price,
        })),
      };

      const res = await api.createOrder(payload);
      setCompletedOrder(res.data);
      onOrderSuccess();
      addToast('Đặt hàng thành công!', 'success');

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
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.65)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          padding: '1.5rem',
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
            padding: '2rem',
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
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>

          {completedOrder ? (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div
                style={{
                  width: '72px',
                  height: '72px',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--success-light)',
                  color: 'var(--success)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}
              >
                <CheckCircle size={42} />
              </div>
              <h3 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Đặt hàng thành công!
              </h3>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem', fontSize: '0.92rem' }}>
                Cảm ơn bạn đã mua sắm tại TechPulse Store. Bạn có thể theo dõi trạng thái vận đơn bất cứ lúc nào.
              </p>

              <div
                style={{
                  background: '#f8fafc',
                  borderRadius: 'var(--radius-md)',
                  padding: '1.25rem',
                  margin: '1.5rem 0',
                  textAlign: 'left',
                  border: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
                  <span style={{ fontWeight: 800, color: 'var(--primary)' }}>
                    {completedOrder.orderCode}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Người nhận:</span>
                  <span style={{ fontWeight: 600 }}>{completedOrder.customerName}</span>
                </div>
                {completedOrder.discountAmount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem', color: 'var(--success)' }}>
                    <span>Đã giảm (Mã {completedOrder.couponCode}):</span>
                    <span style={{ fontWeight: 700 }}>-{formatVND(completedOrder.discountAmount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Tổng thanh toán:</span>
                  <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1.1rem' }}>
                    {formatVND(completedOrder.totalAmount)}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Phương thức:</span>
                  <span className="badge badge-primary">{completedOrder.paymentMethod}</span>
                </div>
              </div>

              {completedOrder.paymentMethod === 'BANK' && (
                <div style={{ marginBottom: '1rem' }}>
                  <button
                    onClick={() => setIsQRModalOpen(true)}
                    className="btn btn-primary"
                    style={{
                      width: '100%',
                      padding: '0.85rem',
                      background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
                      boxShadow: '0 4px 14px rgba(16, 185, 129, 0.35)',
                    }}
                  >
                    <QrCode size={18} /> Mở mã VietQR chuyển khoản ngay
                  </button>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {onTrackOrder && (
                  <button
                    onClick={() => {
                      onClose();
                      onTrackOrder(completedOrder.orderCode);
                    }}
                    className="btn btn-primary"
                    style={{ flex: 1 }}
                  >
                    <Truck size={16} /> Track Order trực tiếp
                  </button>
                )}
                {onViewOrders && (
                  <button
                    onClick={() => {
                      onClose();
                      onViewOrders();
                    }}
                    className="btn btn-secondary"
                    style={{ flex: 1 }}
                  >
                    <FileText size={16} /> Lịch sử đơn hàng
                  </button>
                )}
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  style={{ flex: 1 }}
                >
                  Tiếp tục mua hàng
                </button>
              </div>
            </div>
          ) : (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem', paddingRight: '2rem' }}>
                <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  Thông tin nhận hàng & Thanh toán
                </h3>
                {currentUser && (
                  <span className="badge badge-success">
                    <Check size={12} /> Đã tự điền từ Hồ sơ
                  </span>
                )}
              </div>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                Kiểm tra thông tin giao hàng và áp dụng mã ưu đãi trước khi xác nhận đặt hàng.
              </p>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
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
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
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
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
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
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                      Ghi chú giao hàng
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
                        border: '1px solid var(--border)',
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                      Tỉnh / Thành phố nhận hàng *
                    </label>
                    <select
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      {PROVINCES.map((p) => (
                        <option key={p} value={p}>
                          {p}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                      Gói vận chuyển *
                    </label>
                    <select
                      value={formData.shippingMethod}
                      onChange={(e) => setFormData({ ...formData, shippingMethod: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontWeight: 600,
                      }}
                    >
                      <option value="STANDARD">
                        Giao Tiêu Chuẩn ({subtotalAmount >= 5000000 ? 'Miễn phí' : '30.000 ₫'})
                      </option>
                      <option value="EXPRESS_2H">
                        Giao Hỏa Tốc 2H Nội Thành (+50.000 ₫)
                      </option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '4px' }}>
                    Địa chỉ giao hàng chi tiết (Số nhà, Phường/Xã, Quận/Huyện) *
                  </label>
                  <textarea
                    required
                    rows="2"
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện..."
                    value={formData.shippingAddress}
                    onChange={(e) => setFormData({ ...formData, shippingAddress: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      resize: 'vertical',
                    }}
                  />
                </div>

                {/* ================= VOUCHER / COUPON BOX ================= */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1rem 1.15rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Tag size={16} color="var(--primary)" /> Mã giảm giá / Voucher TechPulse
                    </label>
                    {appliedCoupon && (
                      <button
                        type="button"
                        onClick={handleRemoveCoupon}
                        style={{ fontSize: '0.78rem', color: 'var(--danger)', fontWeight: 600 }}
                      >
                        Bỏ mã ({appliedCoupon.coupon.code})
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <input
                      type="text"
                      placeholder="Nhập mã ưu đãi (VD: TECHPULSE10, GIAM500K)"
                      value={couponInput}
                      onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                      style={{
                        flex: 1,
                        padding: '0.55rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)',
                        background: '#ffffff',
                        fontWeight: 700,
                        letterSpacing: '0.03em',
                      }}
                    />
                    <button
                      type="button"
                      disabled={validatingCoupon}
                      onClick={() => handleApplyCoupon()}
                      className="btn btn-primary btn-sm"
                      style={{ padding: '0 1.1rem' }}
                    >
                      {validatingCoupon ? <Loader2 size={15} className="spin" /> : 'Áp dụng'}
                    </button>
                  </div>

                  {couponError && (
                    <div style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600, marginTop: '0.4rem' }}>
                      {couponError}
                    </div>
                  )}

                  {appliedCoupon && (
                    <div
                      style={{
                        marginTop: '0.5rem',
                        padding: '0.45rem 0.75rem',
                        background: '#ecfdf5',
                        border: '1px solid #a7f3d0',
                        borderRadius: 'var(--radius-sm)',
                        color: '#059669',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        display: 'flex',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span>✓ {appliedCoupon.coupon.description}</span>
                      <span>-{formatVND(appliedCoupon.discountAmount)}</span>
                    </div>
                  )}

                  {/* Quick Select Available Coupons */}
                  {availableCoupons.length > 0 && (
                    <div style={{ marginTop: '0.65rem' }}>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.35rem', fontWeight: 600 }}>
                        Chọn nhanh mã ưu đãi khả dụng:
                      </div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                        {availableCoupons.map((c) => {
                          const eligible = subtotalAmount >= c.minOrderAmount;
                          const isSelected = appliedCoupon?.coupon?.code === c.code;
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => handleApplyCoupon(c.code)}
                              style={{
                                padding: '0.3rem 0.65rem',
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${
                                  isSelected
                                    ? 'var(--primary)'
                                    : eligible
                                    ? '#a5b4fc'
                                    : 'var(--border)'
                                }`,
                                background: isSelected
                                  ? 'var(--primary)'
                                  : eligible
                                  ? '#ffffff'
                                  : '#f1f5f9',
                                color: isSelected
                                  ? '#ffffff'
                                  : eligible
                                  ? 'var(--primary)'
                                  : 'var(--text-light)',
                                fontSize: '0.75rem',
                                fontWeight: 700,
                                opacity: eligible ? 1 : 0.7,
                              }}
                              title={c.description}
                            >
                              <Sparkles size={11} style={{ marginRight: '3px', verticalAlign: 'middle' }} />
                              {c.code}{' '}
                              {c.discountType === 'PERCENT'
                                ? `(-${c.discountValue}%)`
                                : `(-${c.discountValue / 1000}K)`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {/* Payment methods */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.84rem', fontWeight: 600, marginBottom: '8px' }}>
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
                            padding: '0.7rem 0.5rem',
                            textAlign: 'center',
                            cursor: 'pointer',
                            backgroundColor: selected ? 'var(--primary-light)' : '#ffffff',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            gap: '0.35rem',
                            transition: 'all var(--transition-fast)',
                            position: 'relative',
                          }}
                        >
                          {m.badge && (
                            <span
                              style={{
                                position: 'absolute',
                                top: '-8px',
                                right: '4px',
                                background: '#10b981',
                                color: 'white',
                                fontSize: '0.62rem',
                                fontWeight: 700,
                                borderRadius: 'var(--radius-full)',
                                padding: '1px 6px',
                              }}
                            >
                              {m.badge}
                            </span>
                          )}
                          <Icon size={20} color={selected ? 'var(--primary)' : 'var(--text-muted)'} />
                          <span
                            style={{
                              fontSize: '0.8rem',
                              fontWeight: selected ? 700 : 500,
                              color: selected ? 'var(--primary)' : 'var(--text-main)',
                            }}
                          >
                            {m.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Order Summary & Submit */}
                <div
                  style={{
                    marginTop: '0.5rem',
                    paddingTop: '1rem',
                    borderTop: '1px solid var(--border)',
                    display: 'flex',
                    flexWrap: 'wrap',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '1rem',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <span>Tạm tính: <strong>{formatVND(subtotalAmount)}</strong></span>
                      <span>•</span>
                      <span>
                         <Truck size={13} style={{ verticalAlign: 'middle' }} /> Phí giao hàng:{' '}
                        <strong style={{ color: shippingFee === 0 ? 'var(--success)' : 'var(--text-main)' }}>
                          {shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee)}
                        </strong>
                      </span>
                    </div>
                    {discountAmount > 0 && (
                      <div style={{ fontSize: '0.8rem', color: 'var(--success)', fontWeight: 700, marginTop: '2px' }}>
                        Đã giảm Voucher ({appliedCoupon?.coupon?.code}): -{formatVND(discountAmount)}
                      </div>
                    )}
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>Tổng thanh toán:</div>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatVND(finalAmount)}
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
          onConfirmPaid={(updatedOrder) => {
            setCompletedOrder(updatedOrder);
            addToast('Cảm ơn bạn! Đơn hàng đã được xác nhận thanh toán.', 'success');
          }}
          addToast={addToast}
        />
      )}
    </>
  );
}
