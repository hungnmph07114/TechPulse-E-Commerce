import React, { useState, useEffect } from 'react';
import {
  Search, PackageCheck, Clock, CheckCircle2, XCircle, QrCode,
  Eye, RefreshCw, ShoppingBag, Phone, FileText, MapPin, Tag, AlertTriangle, Printer
} from 'lucide-react';
import { api } from '../services/api';
import VietQRModal from './VietQRModal';
import InvoiceModal from './InvoiceModal';

export default function CustomerOrders({ currentUser, addToast, onNavigateStore }) {
  const [myOrders, setMyOrders] = useState([]);
  const [lookupResults, setLookupResults] = useState(null);
  const [loading, setLoading] = useState(false);

  const [lookupCode, setLookupCode] = useState('');
  const [lookupPhone, setLookupPhone] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [qrOrder, setQrOrder] = useState(null);
  const [cancelTarget, setCancelTarget] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null);

  const fetchMyOrders = async () => {
    if (!currentUser) {
      setMyOrders([]);
      return;
    }
    setLoading(true);
    try {
      const res = await api.getMyOrders();
      if (res.data) {
        setMyOrders(res.data);
      }
    } catch (err) {
      console.error('Lỗi tải đơn hàng cá nhân:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyOrders();
  }, [currentUser]);

  const handleLookup = async (e) => {
    if (e) e.preventDefault();
    if (!lookupCode.trim() && !lookupPhone.trim()) {
      addToast('Vui lòng nhập Mã đơn hàng (VD: ORD-DEMO-001) hoặc Số điện thoại', 'warning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.lookupOrders(lookupCode.trim(), lookupPhone.trim());
      setLookupResults(res.data || []);
      if ((res.data || []).length === 0) {
        addToast('Không tìm thấy đơn hàng nào khớp với thông tin tra cứu', 'info');
      }
    } catch (err) {
      addToast(err.message || 'Lỗi khi tra cứu đơn hàng', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget) return;
    try {
      const res = await api.cancelOrder(cancelTarget.id, {
        orderCode: cancelTarget.orderCode,
        customerPhone: cancelTarget.customerPhone,
      });
      addToast(res.message || 'Đã hủy đơn hàng thành công', 'success');
      setCancelTarget(null);
      if (currentUser) fetchMyOrders();
      if (lookupResults) {
        setLookupResults((prev) =>
          prev.map((o) => (o.id === cancelTarget.id ? { ...o, status: 'CANCELLED' } : o))
        );
      }
      if (selectedOrder?.id === cancelTarget.id) {
        setSelectedOrder((prev) => ({ ...prev, status: 'CANCELLED' }));
      }
    } catch (err) {
      addToast(err.message || 'Không thể hủy đơn hàng', 'error');
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    return new Date(isoStr).toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return (
          <span className="badge badge-warning">
            <Clock size={12} /> Chờ xử lý
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="badge badge-primary">
            <PackageCheck size={12} /> Đang giao hàng
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="badge badge-success">
            <CheckCircle2 size={12} /> Đã hoàn thành
          </span>
        );
      case 'CANCELLED':
        return (
          <span className="badge badge-danger">
            <XCircle size={12} /> Đã hủy
          </span>
        );
      default:
        return <span className="badge">{status}</span>;
    }
  };

  const displayedOrders = lookupResults !== null ? lookupResults : myOrders;

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Header & Order Lookup Box */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          border: '1px solid var(--border)',
          padding: '2rem',
          margin: '1.5rem 0 2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
              Tra Cứu Vận Đơn & Lịch Sử Mua Hàng
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
              Kiểm tra trạng thái đơn hàng theo thời gian thực, thanh toán lại mã VietQR hoặc hủy đơn đang chờ xử lý.
            </p>
          </div>

          {/* Quick Demo Lookup Chips */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Mã mẫu:</span>
            {['ORD-DEMO-001', 'ORD-DEMO-002'].map((code) => (
              <button
                key={code}
                type="button"
                onClick={() => {
                  setLookupCode(code);
                  setLookupPhone('');
                  api.lookupOrders(code, '').then((r) => setLookupResults(r.data || []));
                }}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: 'var(--primary-light)',
                  color: 'var(--primary)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                }}
              >
                {code}
              </button>
            ))}
            {lookupResults !== null && (
              <button
                type="button"
                onClick={() => {
                  setLookupResults(null);
                  setLookupCode('');
                  setLookupPhone('');
                }}
                style={{
                  padding: '0.3rem 0.65rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#f1f5f9',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                }}
              >
                Xóa bộ lọc tra cứu
              </button>
            )}
          </div>
        </div>

        <form
          onSubmit={handleLookup}
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.85rem',
            alignItems: 'end',
          }}
        >
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Mã đơn hàng
            </label>
            <div style={{ position: 'relative' }}>
              <FileText size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="text"
                placeholder="VD: ORD-DEMO-001"
                value={lookupCode}
                onChange={(e) => setLookupCode(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px', color: 'var(--text-main)' }}>
              Số điện thoại đặt hàng
            </label>
            <div style={{ position: 'relative' }}>
              <Phone size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
              <input
                type="tel"
                placeholder="VD: 0908123456"
                value={lookupPhone}
                onChange={(e) => setLookupPhone(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem 0.65rem 2.4rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button type="submit" disabled={loading} className="btn btn-primary" style={{ flex: 1, padding: '0.68rem 1.25rem' }}>
              <Search size={17} /> Tra cứu ngay
            </button>
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  setLookupResults(null);
                  fetchMyOrders();
                }}
                className="btn btn-secondary"
                title="Làm mới đơn hàng của tôi"
                style={{ padding: '0.68rem 0.9rem' }}
              >
                <RefreshCw size={17} />
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Section Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {lookupResults !== null
            ? `Kết quả tra cứu (${lookupResults.length} đơn hàng)`
            : currentUser
            ? `Đơn hàng của ${currentUser.fullName || currentUser.username} (${myOrders.length})`
            : 'Kết quả tra cứu đơn hàng'}
        </h3>
      </div>

      {/* Orders List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#ffffff', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' }}>
          <RefreshCw size={30} className="spin" color="var(--primary)" style={{ margin: '0 auto 0.75rem' }} />
          <p style={{ color: 'var(--text-muted)', fontWeight: 600 }}>Đang tải thông tin đơn hàng...</p>
        </div>
      ) : displayedOrders.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1.5rem',
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <ShoppingBag size={42} color="var(--text-light)" style={{ margin: '0 auto 1rem' }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {lookupResults !== null
              ? 'Không tìm thấy đơn hàng nào khớp với thông tin vừa nhập'
              : currentUser
              ? 'Bạn chưa có đơn hàng nào'
              : 'Nhập Mã đơn hàng hoặc Số điện thoại ở trên để tra cứu'}
          </h4>
          <p style={{ fontSize: '0.88rem', marginTop: '0.4rem', marginBottom: '1.5rem' }}>
            {currentUser
              ? 'Hãy khám phá các sản phẩm công nghệ và trải nghiệm đặt hàng với mã ưu đãi!'
              : 'Bạn cũng có thể đăng nhập tài khoản để xem tự động toàn bộ lịch sử mua hàng.'}
          </p>
          {onNavigateStore && (
            <button onClick={onNavigateStore} className="btn btn-primary">
              Tiếp tục mua sắm
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {displayedOrders.map((order) => (
            <div
              key={order.id}
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Top Bar */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '0.75rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                    {order.orderCode}
                  </span>
                  <span style={{ color: 'var(--text-light)' }}>•</span>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    Đặt lúc: {formatDate(order.createdAt)}
                  </span>
                  <span className="badge badge-primary">{order.paymentMethod || 'COD'}</span>
                  {order.couponCode && (
                    <span className="badge badge-success">
                      <Tag size={11} /> Mã: {order.couponCode} (-{formatVND(order.discountAmount)})
                    </span>
                  )}
                </div>

                <div>{getStatusBadge(order.status)}</div>
              </div>

              {/* Order Items Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', margin: '1rem 0' }}>
                {order.items?.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '1rem',
                      padding: '0.6rem 0.85rem',
                      background: '#f8fafc',
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={
                          item.product?.imageUrl ||
                          'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'
                        }
                        alt={item.product?.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          background: '#ffffff',
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {item.product?.name}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Đơn giá: {formatVND(item.price)} × {item.quantity}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {formatVND(item.price * item.quantity)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Footer Info & Actions */}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: '1rem',
                  paddingTop: '1rem',
                  borderTop: '1px dashed var(--border)',
                }}
              >
                <div style={{ fontSize: '0.84rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <MapPin size={15} color="var(--primary)" />
                  <span>
                    Giao tới: <strong>{order.customerName}</strong> ({order.customerPhone}) — {order.shippingAddress}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginRight: '6px' }}>
                      Tổng thanh toán:
                    </span>
                    <span style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {formatVND(order.totalAmount)}
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => setQrOrder(order)}
                          className="btn btn-primary btn-sm"
                          style={{ background: '#059669' }}
                        >
                          <QrCode size={15} /> Thanh toán VietQR
                        </button>
                        <button
                          type="button"
                          onClick={() => setCancelTarget(order)}
                          className="btn btn-secondary btn-sm"
                          style={{ color: 'var(--danger)', borderColor: '#fecaca', background: '#fef2f2' }}
                        >
                          <XCircle size={15} /> Hủy đơn
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setInvoiceOrder(order)}
                      className="btn btn-outline btn-sm"
                    >
                      <Printer size={15} /> Hóa đơn
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="btn btn-secondary btn-sm"
                    >
                      <Eye size={15} /> Chi tiết
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 105,
            padding: '1.5rem',
          }}
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '580px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              padding: '2rem',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary">{selectedOrder.orderCode}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                  Chi tiết vận đơn
                </h3>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            <div
              style={{
                background: '#f8fafc',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                marginBottom: '1.25rem',
                fontSize: '0.88rem',
                lineHeight: 1.7,
              }}
            >
              <div><strong>Người nhận:</strong> {selectedOrder.customerName}</div>
              <div><strong>Điện thoại:</strong> {selectedOrder.customerPhone}</div>
              <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
              <div><strong>Địa chỉ nhận:</strong> {selectedOrder.shippingAddress}</div>
              {selectedOrder.notes && <div><strong>Ghi chú:</strong> {selectedOrder.notes}</div>}
              <div><strong>Phương thức:</strong> {selectedOrder.paymentMethod}</div>
              <div><strong>Thời gian đặt:</strong> {formatDate(selectedOrder.createdAt)}</div>
            </div>

            <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
              {selectedOrder.discountAmount > 0 && (
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.35rem' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Tạm tính:</span>
                    <span style={{ fontWeight: 600 }}>{formatVND(selectedOrder.subtotalAmount || selectedOrder.totalAmount + selectedOrder.discountAmount)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.88rem', marginBottom: '0.5rem', color: 'var(--success)' }}>
                    <span>Giảm giá Voucher ({selectedOrder.couponCode}):</span>
                    <span style={{ fontWeight: 700 }}>-{formatVND(selectedOrder.discountAmount)}</span>
                  </div>
                </>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontWeight: 700 }}>Tổng thanh toán:</span>
                <span style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatVND(selectedOrder.totalAmount)}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              {selectedOrder.status === 'PENDING' && (
                <button
                  onClick={() => {
                    const o = selectedOrder;
                    setSelectedOrder(null);
                    setQrOrder(o);
                  }}
                  className="btn btn-primary"
                  style={{ background: '#059669' }}
                >
                  <QrCode size={16} /> Mở mã VietQR
                </button>
              )}
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Cancel Order Confirmation Modal */}
      {cancelTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 115,
            padding: '1.5rem',
          }}
          onClick={() => setCancelTarget(null)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              textAlign: 'center',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--warning-light)',
                color: 'var(--warning)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <AlertTriangle size={26} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, marginBottom: '0.5rem' }}>
              Xác nhận hủy đơn hàng {cancelTarget.orderCode}?
            </h3>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Sau khi hủy, số lượng sản phẩm trong đơn sẽ được hoàn trả lại kho hàng ngay lập tức.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={() => setCancelTarget(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Không hủy
              </button>
              <button onClick={handleConfirmCancel} className="btn btn-danger" style={{ flex: 1 }}>
                Xác nhận hủy đơn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VietQR Modal */}
      {qrOrder && (
        <VietQRModal
          isOpen={!!qrOrder}
          onClose={() => setQrOrder(null)}
          order={qrOrder}
          onConfirmPaid={() => {
            if (currentUser) fetchMyOrders();
            if (lookupResults) {
              setLookupResults((prev) =>
                prev.map((o) => (o.id === qrOrder.id ? { ...o, status: 'COMPLETED' } : o))
              );
            }
          }}
          addToast={addToast}
        />
      )}

      {/* Printable Invoice Modal */}
      <InvoiceModal
        order={invoiceOrder}
        isOpen={Boolean(invoiceOrder)}
        onClose={() => setInvoiceOrder(null)}
      />
    </div>
  );
}
