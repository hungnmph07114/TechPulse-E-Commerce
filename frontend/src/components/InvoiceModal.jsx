import React from 'react';
import { X, Printer, CheckCircle2, ShieldCheck, Building2 } from 'lucide-react';

export default function InvoiceModal({ order, isOpen, onClose }) {
  if (!isOpen || !order) return null;

  const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.68)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 120,
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
          maxWidth: '720px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          padding: '2rem',
        }}
      >
        {/* Top Action Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '2px dashed var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Building2 size={22} color="var(--primary)" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-main)' }}>
              PHIẾU XUẤT KHO KIÊM HÓA ĐƠN BÁN LẺ
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button
              onClick={handlePrint}
              className="btn btn-primary"
              style={{ padding: '0.5rem 1rem', fontSize: '0.84rem' }}
            >
              <Printer size={16} /> In Hóa Đơn / Lưu PDF
            </button>
            <button
              onClick={onClose}
              style={{
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
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Store & Order Info */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '1.5rem',
            backgroundColor: '#f8fafc',
            padding: '1.15rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border)',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              Đơn vị cung cấp
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '2px' }}>
              TECHPULSE FLAGSHIP STORE VN
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Tòa nhà Bitexco Financial Tower, Quận 1, TP. Hồ Chí Minh
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Hotline CSKH: 1900 6868 • MST: 0318899202
            </div>
          </div>

          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase' }}>
              Thông tin đơn hàng
            </div>
            <div style={{ fontWeight: 800, fontSize: '1rem', marginTop: '2px', fontFamily: 'monospace' }}>
              Mã đơn: {order.orderCode}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Ngày lập: {formatDate(order.createdAt)}
            </div>
            <div style={{ fontSize: '0.82rem', fontWeight: 700, color: order.status === 'COMPLETED' ? 'var(--success)' : 'var(--warning)' }}>
              Trạng thái: {order.status === 'COMPLETED' ? 'ĐÃ THANH TOÁN / HOÀN THÀNH' : order.status}
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div style={{ marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: 1.7 }}>
          <div>
            <strong>Khách hàng nhận:</strong> {order.customerName} — <strong>SĐT:</strong> {order.customerPhone}
          </div>
          {order.customerEmail && (
            <div>
              <strong>Email:</strong> {order.customerEmail}
            </div>
          )}
          <div>
            <strong>Địa chỉ giao hàng:</strong> {order.shippingAddress}
          </div>
          <div>
            <strong>Phương thức thanh toán:</strong>{' '}
            {order.paymentMethod === 'BANK'
              ? 'Chuyển khoản Ngân hàng VietQR 24/7'
              : order.paymentMethod === 'MOMO'
                ? 'Ví điện tử MoMo'
                : 'Thanh toán khi nhận hàng (COD)'}
          </div>
        </div>

        {/* Items Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ backgroundColor: '#f1f5f9', textAlign: 'left' }}>
              <th style={{ padding: '0.7rem', borderBottom: '1px solid var(--border)' }}>STT</th>
              <th style={{ padding: '0.7rem', borderBottom: '1px solid var(--border)' }}>Tên sản phẩm</th>
              <th style={{ padding: '0.7rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>SL</th>
              <th style={{ padding: '0.7rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Đơn giá</th>
              <th style={{ padding: '0.7rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            {(order.items || []).map((item, idx) => (
              <tr key={item.id || idx} style={{ borderBottom: '1px solid var(--border)' }}>
                <td style={{ padding: '0.7rem' }}>{idx + 1}</td>
                <td style={{ padding: '0.7rem', fontWeight: 600 }}>
                  <div>{item.product?.name || 'Sản phẩm'}</div>
                  {item.selectedVariant && (
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500, marginTop: '2px' }}>
                      Phiên bản: {item.selectedVariant}
                    </div>
                  )}
                </td>
                <td style={{ padding: '0.7rem', textAlign: 'center', fontWeight: 700 }}>{item.quantity}</td>
                <td style={{ padding: '0.7rem', textAlign: 'right' }}>{formatVND(item.price)}</td>
                <td style={{ padding: '0.7rem', textAlign: 'right', fontWeight: 700 }}>
                  {formatVND(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Totals */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '0.4rem',
            paddingTop: '0.75rem',
            borderTop: '2px solid var(--text-main)',
          }}
        >
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Tạm tính: <strong>{formatVND(order.subtotalAmount || order.totalAmount)}</strong>
          </div>
          <div style={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>
            Phí vận chuyển:{' '}
            <strong>{order.shippingFee > 0 ? formatVND(order.shippingFee) : 'Miễn phí (0 ₫)'}</strong>
          </div>
          {order.discountAmount > 0 && (
            <div style={{ fontSize: '0.88rem', color: 'var(--success)', fontWeight: 700 }}>
              Giảm giá Voucher ({order.couponCode}): -{formatVND(order.discountAmount)}
            </div>
          )}
          <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--primary)' }}>
            Tổng cộng thanh toán: {formatVND(order.totalAmount)}
          </div>
        </div>

        {/* Warranty Footer */}
        <div
          style={{
            marginTop: '1.5rem',
            padding: '0.85rem 1rem',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--success-light)',
            color: '#065f46',
            fontSize: '0.8rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontWeight: 600,
          }}
        >
          <ShieldCheck size={18} /> Sản phẩm được bảo hành điện tử chính hãng 12 tháng tại toàn hệ thống TechPulse VN.
        </div>
      </div>
    </div>
  );
}
