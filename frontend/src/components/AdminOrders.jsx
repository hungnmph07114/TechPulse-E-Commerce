import React, { useState, useEffect } from 'react';
import { PackageCheck, Clock, CheckCircle2, XCircle, RefreshCw, Eye, QrCode } from 'lucide-react';
import { api } from '../services/api';
import VietQRModal from './VietQRModal';

export default function AdminOrders({ addToast }) {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [qrOrder, setQrOrder] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await api.getOrders();
      if (res.data) {
        setOrders(res.data);
      }
    } catch (err) {
      addToast('Lỗi khi tải đơn hàng: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await api.updateOrderStatus(orderId, newStatus);
      addToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
      fetchOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
    } catch (err) {
      addToast('Lỗi khi cập nhật trạng thái: ' + err.message, 'error');
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    const date = new Date(isoStr);
    return date.toLocaleString('vi-VN');
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PENDING':
        return <span className="badge badge-warning"><Clock size={12} /> Chờ xử lý</span>;
      case 'PROCESSING':
        return <span className="badge badge-primary"><PackageCheck size={12} /> Đang giao hàng</span>;
      case 'COMPLETED':
        return <span className="badge badge-success"><CheckCircle2 size={12} /> Đã hoàn thành</span>;
      case 'CANCELLED':
        return <span className="badge badge-danger"><XCircle size={12} /> Đã hủy</span>;
      default:
        return <span className="badge">{status}</span>;
    }
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '1.5rem 0 2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Quản lý Đơn Hàng Khách Hàng
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Theo dõi, cập nhật tiến độ giao hàng, kiểm tra thanh toán mã VietQR
          </p>
        </div>

        <button
          onClick={fetchOrders}
          className="btn btn-secondary"
          style={{ padding: '0.65rem 1rem' }}
        >
          <RefreshCw size={16} /> Làm mới
        </button>
      </div>

      <div style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        overflow: 'hidden'
      }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Mã Đơn
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Khách Hàng
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Thời gian
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Tổng tiền
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Thanh toán
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Trạng thái
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spin" color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                    <p>Đang tải đơn hàng...</p>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Chưa có đơn hàng nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                orders.map((o) => (
                  <tr
                    key={o.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--primary)' }}>
                      {o.orderCode}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        {o.customerName}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-light)' }}>
                        {o.customerPhone} • {o.customerEmail}
                      </div>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {formatDate(o.createdAt)}
                    </td>

                    <td style={{ padding: '1rem', fontWeight: 800, color: 'var(--text-main)' }}>
                      {formatVND(o.totalAmount)}
                    </td>

                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-primary">{o.paymentMethod || 'COD'}</span>
                    </td>

                    <td style={{ padding: '1rem' }}>
                      {getStatusBadge(o.status)}
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                        <button
                          onClick={() => setQrOrder(o)}
                          className="btn-icon"
                          style={{
                            background: '#ecfdf5',
                            color: '#059669',
                            borderRadius: 'var(--radius-sm)',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Xem mã VietQR đơn hàng"
                        >
                          <QrCode size={16} />
                        </button>

                        <select
                          value={o.status}
                          onChange={(e) => handleUpdateStatus(o.id, e.target.value)}
                          style={{
                            padding: '0.35rem 0.65rem',
                            borderRadius: 'var(--radius-sm)',
                            border: '1px solid var(--border)',
                            fontSize: '0.8rem',
                            fontWeight: 600,
                            backgroundColor: '#ffffff',
                            cursor: 'pointer'
                          }}
                        >
                          <option value="PENDING">Chờ xử lý</option>
                          <option value="PROCESSING">Đang giao</option>
                          <option value="COMPLETED">Đã hoàn thành</option>
                          <option value="CANCELLED">Hủy đơn</option>
                        </select>

                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="btn-icon"
                          style={{
                            background: 'var(--bg-card-subtle)',
                            color: 'var(--text-muted)',
                            borderRadius: 'var(--radius-sm)',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Xem chi tiết đơn"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Order Detail Modal */}
      {selectedOrder && (
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
        onClick={() => setSelectedOrder(null)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
              boxShadow: 'var(--shadow-xl)',
              padding: '2rem'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
              <div>
                <span className="badge badge-primary">{selectedOrder.orderCode}</span>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginTop: '4px' }}>
                  Chi tiết đơn hàng
                </h3>
              </div>
              {getStatusBadge(selectedOrder.status)}
            </div>

            <div style={{
              background: '#f8fafc',
              padding: '1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1.5rem',
              fontSize: '0.88rem',
              lineHeight: 1.6
            }}>
              <div><strong>Người nhận:</strong> {selectedOrder.customerName}</div>
              <div><strong>Số điện thoại:</strong> {selectedOrder.customerPhone}</div>
              <div><strong>Email:</strong> {selectedOrder.customerEmail}</div>
              <div><strong>Địa chỉ:</strong> {selectedOrder.shippingAddress}</div>
              {selectedOrder.notes && <div><strong>Ghi chú:</strong> {selectedOrder.notes}</div>}
              <div><strong>Ngày đặt:</strong> {formatDate(selectedOrder.createdAt)}</div>
            </div>

            <h4 style={{ fontSize: '0.95rem', fontWeight: 700, marginBottom: '0.75rem' }}>
              Danh sách sản phẩm trong đơn ({selectedOrder.items?.length || 0}):
            </h4>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
              {selectedOrder.items?.map((item) => (
                <div
                  key={item.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.65rem 0.85rem',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <img
                      src={item.product?.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=100&q=80'}
                      alt={item.product?.name}
                      style={{ width: '42px', height: '42px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{item.product?.name}</div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        {formatVND(item.price)} × {item.quantity}
                      </div>
                    </div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                    {formatVND(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)'
            }}>
              <span style={{ fontWeight: 700 }}>Tổng tiền:</span>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                {formatVND(selectedOrder.totalAmount)}
              </span>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '1.5rem' }}>
              <button
                onClick={() => setQrOrder(selectedOrder)}
                className="btn btn-primary"
                style={{ background: '#059669', fontSize: '0.88rem' }}
              >
                <QrCode size={16} /> Mở mã VietQR
              </button>
              <button onClick={() => setSelectedOrder(null)} className="btn btn-secondary">
                Đóng
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
            handleUpdateStatus(qrOrder.id, 'COMPLETED');
            setQrOrder(null);
          }}
          addToast={addToast}
        />
      )}
    </div>
  );
}
