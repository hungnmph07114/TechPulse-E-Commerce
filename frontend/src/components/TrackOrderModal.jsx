import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  Truck,
  Package,
  CheckCircle2,
  Clock,
  MapPin,
  Phone,
  User,
  RefreshCw,
  FileText,
  QrCode,
  XCircle,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import InvoiceModal from './InvoiceModal';
import VietQRModal from './VietQRModal';

export default function TrackOrderModal({
  isOpen,
  onClose,
  initialOrderCode = '',
  addToast,
}) {
  const [orderInput, setOrderInput] = useState(initialOrderCode || '');
  const [phoneInput, setPhoneInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [trackedOrder, setTrackedOrder] = useState(null);
  const [recentSamples, setRecentSamples] = useState([]);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);
  const [qrOrder, setQrOrder] = useState(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api
        .getRecentOrderCodes()
        .then((res) => {
          if (Array.isArray(res.data)) {
            setRecentSamples(res.data);
          }
        })
        .catch(() => {});

      if (initialOrderCode) {
        setOrderInput(initialOrderCode);
        handleLookup(initialOrderCode, '');
      }
    } else {
      setConfirmCancel(false);
    }
  }, [isOpen, initialOrderCode]);

  const handleLookup = async (codeOverride, phoneOverride, silent = false) => {
    const code = (codeOverride !== undefined ? codeOverride : orderInput).trim().toUpperCase();
    const phone = (phoneOverride !== undefined ? phoneOverride : phoneInput).trim();

    if (!code && !phone) {
      if (!silent && addToast) {
        addToast('Vui lòng nhập Mã đơn hàng (VD: ORD-...) hoặc Số điện thoại nhận hàng', 'warning');
      }
      return;
    }

    if (!silent) setLoading(true);
    try {
      const res = await api.lookupOrders(code, phone);
      const list = Array.isArray(res.data) ? res.data : [];
      if (list.length > 0) {
        setTrackedOrder(list[0]);
        setLastUpdated(new Date());
      } else {
        setTrackedOrder(null);
        if (!silent && addToast) {
          addToast('Không tìm thấy đơn hàng nào khớp với thông tin vừa nhập', 'error');
        }
      }
    } catch (err) {
      if (!silent && addToast) {
        addToast(err.message || 'Không thể tra cứu đơn hàng', 'error');
      }
    } finally {
      if (!silent) setLoading(false);
    }
  };

  // Real-time status polling every 5 seconds when an order is active and autoRefresh is enabled
  useEffect(() => {
    if (!isOpen || !trackedOrder || !autoRefresh) return;
    if (trackedOrder.status === 'COMPLETED' || trackedOrder.status === 'CANCELLED') return;

    const timer = setInterval(() => {
      handleLookup(trackedOrder.orderCode, '', true);
    }, 5000);

    return () => clearInterval(timer);
  }, [isOpen, trackedOrder?.orderCode, trackedOrder?.status, autoRefresh]);

  if (!isOpen) return null;

  const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const getStepIndex = (status) => {
    switch (status) {
      case 'PENDING':
        return 1;
      case 'PROCESSING':
        return 2;
      case 'SHIPPING':
        return 3;
      case 'COMPLETED':
        return 4;
      case 'CANCELLED':
        return -1;
      default:
        return 1;
    }
  };

  const handleCancelTrackedOrder = async () => {
    if (!trackedOrder) return;
    setCancelling(true);
    try {
      const res = await api.cancelOrder(trackedOrder.id, {
        orderCode: trackedOrder.orderCode,
        customerPhone: trackedOrder.customerPhone,
      });
      if (res.data) {
        setTrackedOrder(res.data);
        setConfirmCancel(false);
        if (addToast) addToast('Đã hủy đơn hàng và hoàn kho thành công', 'info');
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Không thể hủy đơn hàng', 'error');
    } finally {
      setCancelling(false);
    }
  };

  const currentStep = trackedOrder ? getStepIndex(trackedOrder.status) : 0;

  const SHIPPING_STEPS = [
    {
      step: 1,
      title: 'Đã tiếp nhận đơn',
      desc: 'Hệ thống xác nhận đơn & giữ tồn kho',
      icon: Clock,
    },
    {
      step: 2,
      title: 'Đóng gói & Xuất kho',
      desc: 'Kiểm định seal, dán tem bảo hành',
      icon: Package,
    },
    {
      step: 3,
      title: 'Đang giao hàng',
      desc: 'Bưu tá TechPulse Express đang giao',
      icon: Truck,
    },
    {
      step: 4,
      title: 'Giao thành công',
      desc: 'Đã nhận hàng & kích hoạt BH 12T',
      icon: CheckCircle2,
    },
  ];

  return (
    <>
      <div
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.72)',
          backdropFilter: 'blur(6px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 115,
          padding: '1.25rem',
        }}
        onClick={onClose}
      >
        <div
          className="fade-in"
          onClick={(e) => e.stopPropagation()}
          style={{
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            maxWidth: '780px',
            width: '100%',
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: 'var(--shadow-xl)',
            padding: '2rem',
            position: 'relative',
          }}
        >
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '36px',
              height: '36px',
              borderRadius: '999px',
              backgroundColor: 'var(--bg-card-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
            }}
          >
            <X size={20} />
          </button>

          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)',
              }}
            >
              <Truck size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Theo Dõi Hành Trình Vận Đơn (Real-Time)
              </h3>
              <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)' }}>
                Nhập mã đơn hàng (ORD-...) hoặc SĐT để kiểm tra trạng thái xử lý và vị trí kiện hàng trực tiếp
              </p>
            </div>
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleLookup();
            }}
            style={{
              backgroundColor: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem',
              marginTop: '1.25rem',
              marginBottom: '1.25rem',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '0.75rem',
              }}
            >
              <div style={{ position: 'relative' }}>
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--primary)',
                  }}
                />
                <input
                  type="text"
                  placeholder="Nhập mã đơn (VD: ORD-8A9F12B4)"
                  value={orderInput}
                  onChange={(e) => setOrderInput(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1.5px solid var(--border)',
                    backgroundColor: '#ffffff',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: 'var(--text-light)',
                  }}
                />
                <input
                  type="tel"
                  placeholder="Hoặc SĐT người nhận (Tùy chọn)"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem 0.65rem 2.3rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    fontSize: '0.9rem',
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{ padding: '0.65rem 1.25rem', fontWeight: 700 }}
              >
                {loading ? <RefreshCw size={16} className="spin" /> : <Search size={16} />}
                Tra cứu ngay
              </button>
            </div>

            {/* Quick Sample Order Chips */}
            {recentSamples.length > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  flexWrap: 'wrap',
                  marginTop: '0.75rem',
                  paddingTop: '0.65rem',
                  borderTop: '1px dashed var(--border)',
                }}
              >
                <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                  <Sparkles size={12} color="var(--primary)" style={{ verticalAlign: 'middle' }} /> Mã đơn gần đây:
                </span>
                {recentSamples.map((s) => (
                  <button
                    key={s.orderCode}
                    type="button"
                    onClick={() => {
                      setOrderInput(s.orderCode);
                      handleLookup(s.orderCode, '');
                    }}
                    style={{
                      padding: '0.22rem 0.6rem',
                      borderRadius: '999px',
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      fontFamily: 'monospace',
                      backgroundColor:
                        trackedOrder?.orderCode === s.orderCode ? 'var(--primary)' : '#ffffff',
                      color:
                        trackedOrder?.orderCode === s.orderCode ? '#ffffff' : 'var(--primary)',
                      border: '1px solid #a5b4fc',
                    }}
                  >
                    {s.orderCode} ({s.status})
                  </button>
                ))}
              </div>
            )}
          </form>

          {/* Tracked Order Result */}
          {trackedOrder ? (
            <div className="fade-in">
              {/* Order Status Banner & Live Sync Controls */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '1rem 1.25rem',
                  backgroundColor: '#0f172a',
                  color: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    MÃ VẬN ĐƠN CHÍNH HÃNG TECHPULSE
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '2px' }}>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, fontFamily: 'monospace', color: '#38bdf8' }}>
                      {trackedOrder.orderCode}
                    </span>
                    <span
                      className="badge"
                      style={{
                        backgroundColor:
                          trackedOrder.status === 'COMPLETED'
                            ? '#10b981'
                            : trackedOrder.status === 'CANCELLED'
                            ? '#ef4444'
                            : '#f59e0b',
                        color: '#ffffff',
                        fontWeight: 800,
                      }}
                    >
                      {trackedOrder.status === 'PENDING'
                        ? 'CHỜ XÁC NHẬN'
                        : trackedOrder.status === 'PROCESSING'
                        ? 'ĐANG ĐÓNG GÓI & GIAO'
                        : trackedOrder.status === 'COMPLETED'
                        ? 'ĐÃ GIAO THÀNH CÔNG'
                        : 'ĐÃ HỦY ĐƠN'}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                  <label
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      fontSize: '0.76rem',
                      color: '#cbd5e1',
                      cursor: 'pointer',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={autoRefresh}
                      onChange={(e) => setAutoRefresh(e.target.checked)}
                    />
                    Tự động cập nhật (5s)
                  </label>
                  <button
                    type="button"
                    onClick={() => handleLookup(trackedOrder.orderCode, '', false)}
                    className="btn btn-sm"
                    style={{
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      color: '#ffffff',
                      padding: '0.35rem 0.7rem',
                      fontSize: '0.76rem',
                    }}
                  >
                    <RefreshCw size={13} className={loading ? 'spin' : ''} /> Làm mới
                  </button>
                </div>
              </div>

              {/* Visual Progress Bar / Cancelled State */}
              {trackedOrder.status === 'CANCELLED' ? (
                <div
                  style={{
                    backgroundColor: 'var(--danger-light)',
                    border: '1px solid #fecdd3',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.25rem',
                    marginBottom: '1.5rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem',
                    color: 'var(--danger)',
                  }}
                >
                  <XCircle size={32} style={{ flexShrink: 0 }} />
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '1rem' }}>
                      Đơn hàng này đã bị hủy
                    </div>
                    <div style={{ fontSize: '0.85rem', marginTop: '2px' }}>
                      Số lượng sản phẩm trong đơn đã được hệ thống hoàn trả tự động về kho PostgreSQL.
                    </div>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    backgroundColor: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)',
                    padding: '1.5rem 1.25rem',
                    marginBottom: '1.5rem',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                      gap: '1rem',
                      position: 'relative',
                    }}
                  >
                    {SHIPPING_STEPS.map((s) => {
                      const Icon = s.icon;
                      const isDone =
                        currentStep > s.step ||
                        (trackedOrder.status === 'PROCESSING' && s.step <= 3) ||
                        trackedOrder.status === 'COMPLETED';
                      const isCurrent =
                        (trackedOrder.status === 'PENDING' && s.step === 1) ||
                        (trackedOrder.status === 'PROCESSING' && s.step === 3) ||
                        (trackedOrder.status === 'COMPLETED' && s.step === 4);

                      return (
                        <div
                          key={s.step}
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            textAlign: 'center',
                            padding: '0.75rem',
                            borderRadius: 'var(--radius-md)',
                            backgroundColor: isCurrent
                              ? 'var(--primary-light)'
                              : isDone
                              ? '#ecfdf5'
                              : '#f8fafc',
                            border: `1.5px solid ${
                              isCurrent
                                ? 'var(--primary)'
                                : isDone
                                ? '#a7f3d0'
                                : 'var(--border)'
                            }`,
                          }}
                        >
                          <div
                            style={{
                              width: '40px',
                              height: '40px',
                              borderRadius: '999px',
                              backgroundColor: isDone
                                ? '#10b981'
                                : isCurrent
                                ? 'var(--primary)'
                                : '#e2e8f0',
                              color: isDone || isCurrent ? '#ffffff' : 'var(--text-muted)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '0.55rem',
                              fontWeight: 800,
                            }}
                          >
                            <Icon size={19} />
                          </div>
                          <div
                            style={{
                              fontWeight: 800,
                              fontSize: '0.86rem',
                              color: isDone
                                ? '#065f46'
                                : isCurrent
                                ? 'var(--primary)'
                                : 'var(--text-main)',
                            }}
                          >
                            {s.title}
                          </div>
                          <div
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              marginTop: '3px',
                              lineHeight: 1.35,
                            }}
                          >
                            {s.desc}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Detailed Activity Log */}
                  <div
                    style={{
                      marginTop: '1.25rem',
                      paddingTop: '1rem',
                      borderTop: '1px dashed var(--border)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.55rem',
                      fontSize: '0.83rem',
                    }}
                  >
                    <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '2px' }}>
                      Nhật ký hành trình vận chuyển:
                    </div>
                    {trackedOrder.status === 'COMPLETED' && (
                      <div style={{ display: 'flex', gap: '0.6rem', color: '#059669', fontWeight: 600 }}>
                        <span>● Hiện tại:</span>
                        <span>
                          Giao hàng thành công tới người nhận <strong>{trackedOrder.customerName}</strong>. Đã kích hoạt bảo hành điện tử 12 tháng.
                        </span>
                      </div>
                    )}
                    {(trackedOrder.status === 'PROCESSING' || trackedOrder.status === 'COMPLETED') && (
                      <div style={{ display: 'flex', gap: '0.6rem', color: 'var(--primary)', fontWeight: 600 }}>
                        <span>● Kho trung chuyển:</span>
                        <span>
                          Kiện hàng đã xuất kho Flagship TechPulse và đang trên tuyến giao tới <strong>{trackedOrder.shippingAddress}</strong>.
                        </span>
                      </div>
                    )}
                    <div style={{ display: 'flex', gap: '0.6rem', color: 'var(--text-muted)' }}>
                      <span>● {formatDateTime(trackedOrder.createdAt)}:</span>
                      <span>
                        Đơn hàng <strong>{trackedOrder.orderCode}</strong> được khởi tạo trên hệ thống PostgreSQL.
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Recipient & Items Summary Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.25rem',
                }}
              >
                {/* Recipient Box */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.15rem',
                    fontSize: '0.85rem',
                    lineHeight: 1.65,
                  }}
                >
                  <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                    Thông tin người nhận
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <User size={14} color="var(--primary)" /> <strong>{trackedOrder.customerName}</strong>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Phone size={14} color="var(--primary)" /> {trackedOrder.customerPhone}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', marginTop: '2px' }}>
                    <MapPin size={14} color="var(--primary)" style={{ marginTop: '4px', flexShrink: 0 }} />
                    <span>{trackedOrder.shippingAddress}</span>
                  </div>
                  {trackedOrder.notes && (
                    <div style={{ marginTop: '0.4rem', fontSize: '0.78rem', color: 'var(--warning)', fontWeight: 600 }}>
                      Ghi chú: {trackedOrder.notes}
                    </div>
                  )}
                </div>

                {/* Payment Summary Box */}
                <div
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1rem 1.15rem',
                    fontSize: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                      Chi tiết thanh toán
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Tạm tính ({trackedOrder.items?.length || 0} SP):</span>
                      <strong>{formatVND(trackedOrder.subtotalAmount || trackedOrder.totalAmount)}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Phí vận chuyển:</span>
                      <strong>
                        {trackedOrder.shippingFee > 0 ? formatVND(trackedOrder.shippingFee) : 'Miễn phí'}
                      </strong>
                    </div>
                    {trackedOrder.discountAmount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--success)', marginTop: '2px' }}>
                        <span>Voucher ({trackedOrder.couponCode}):</span>
                        <strong>-{formatVND(trackedOrder.discountAmount)}</strong>
                      </div>
                    )}
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginTop: '0.65rem',
                      paddingTop: '0.55rem',
                      borderTop: '1px dashed var(--border)',
                    }}
                  >
                    <span style={{ fontWeight: 700 }}>Tổng thanh toán:</span>
                    <span style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatVND(trackedOrder.totalAmount)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Order Items List */}
              <div
                style={{
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1rem',
                  marginBottom: '1.25rem',
                }}
              >
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                  SẢN PHẨM TRONG KIỆN HÀNG ({trackedOrder.items?.length || 0})
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {(trackedOrder.items || []).map((item, idx) => (
                    <div
                      key={item.id || idx}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        fontSize: '0.86rem',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <img
                          src={item.product?.imageUrl}
                          alt={item.product?.name}
                          style={{
                            width: '42px',
                            height: '42px',
                            borderRadius: 'var(--radius-sm)',
                            objectFit: 'cover',
                            border: '1px solid var(--border)',
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {item.product?.name} <span style={{ color: 'var(--primary)' }}>x{item.quantity}</span>
                          </div>
                          {item.selectedVariant && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              Phiên bản: {item.selectedVariant}
                            </div>
                          )}
                        </div>
                      </div>
                      <div style={{ fontWeight: 700 }}>{formatVND(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                }}
              >
                <div style={{ fontSize: '0.76rem', color: 'var(--text-light)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <ShieldCheck size={14} color="var(--success)" />
                  {lastUpdated
                    ? `Đồng bộ trực tiếp lúc ${lastUpdated.toLocaleTimeString('vi-VN')}`
                    : 'Dữ liệu thời gian thực từ PostgreSQL'}
                </div>

                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {trackedOrder.paymentMethod === 'BANK' && trackedOrder.status === 'PENDING' && (
                    <button
                      type="button"
                      onClick={() => setQrOrder(trackedOrder)}
                      className="btn btn-primary btn-sm"
                      style={{ backgroundColor: '#059669' }}
                    >
                      <QrCode size={15} /> Thanh toán VietQR
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setInvoiceOrder(trackedOrder)}
                    className="btn btn-secondary btn-sm"
                  >
                    <FileText size={15} /> In Hóa đơn & Bảo hành
                  </button>

                  {trackedOrder.status === 'PENDING' &&
                    (confirmCancel ? (
                      <div style={{ display: 'flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          disabled={cancelling}
                          onClick={handleCancelTrackedOrder}
                          className="btn btn-sm"
                          style={{ backgroundColor: 'var(--danger)', color: '#ffffff' }}
                        >
                          {cancelling ? 'Đang hủy...' : 'Xác nhận hủy đơn'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmCancel(false)}
                          className="btn btn-secondary btn-sm"
                        >
                          Đóng
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmCancel(true)}
                        className="btn btn-sm"
                        style={{
                          backgroundColor: 'var(--danger-light)',
                          color: 'var(--danger)',
                          fontWeight: 700,
                        }}
                      >
                        <XCircle size={15} /> Hủy đơn hàng
                      </button>
                    ))}
                </div>
              </div>
            </div>
          ) : (
            <div
              style={{
                textAlign: 'center',
                padding: '2.5rem 1rem',
                backgroundColor: '#f8fafc',
                borderRadius: 'var(--radius-lg)',
                border: '1px dashed var(--border)',
                color: 'var(--text-muted)',
              }}
            >
              <Truck size={40} color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
              <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
                Nhập mã đơn hàng hoặc chọn nhanh mã đơn mẫu phía trên
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                Hệ thống sẽ hiển thị tiến độ đóng gói, vị trí kiện hàng và phiếu bảo hành điện tử theo thời gian thực.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Printable Invoice Modal */}
      {invoiceOrder && (
        <InvoiceModal
          order={invoiceOrder}
          isOpen={Boolean(invoiceOrder)}
          onClose={() => setInvoiceOrder(null)}
        />
      )}

      {/* VietQR Payment Modal */}
      {qrOrder && (
        <VietQRModal
          isOpen={Boolean(qrOrder)}
          onClose={() => setQrOrder(null)}
          order={qrOrder}
          onConfirmPaid={(updated) => {
            setTrackedOrder(updated);
            setQrOrder(null);
            if (addToast) addToast('Đã xác nhận thanh toán thành công!', 'success');
          }}
          addToast={addToast}
        />
      )}
    </>
  );
}
