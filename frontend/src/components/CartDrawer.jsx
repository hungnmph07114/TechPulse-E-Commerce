import React from 'react';
import { X, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';

export default function CartDrawer({
  isOpen,
  onClose,
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout
}) {
  if (!isOpen) return null;

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const totalAmount = cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 90,
      display: 'flex',
      justifyContent: 'flex-end'
    }}
    onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '440px',
          height: '100%',
          backgroundColor: '#ffffff',
          boxShadow: 'var(--shadow-xl)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
      >
        {/* Drawer Header */}
        <div style={{
          padding: '1.25rem 1.5rem',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <ShoppingBag size={22} color="var(--primary)" />
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Giỏ hàng của bạn ({cartItems.reduce((acc, i) => acc + i.quantity, 0)})
            </h3>
          </div>
          <button
            onClick={onClose}
            className="btn-icon"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={20} />
          </button>
        </div>

        {/* Drawer Body - Items */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '1.25rem 1.5rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem'
        }}>
          {cartItems.length === 0 ? (
            <div style={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--text-muted)',
              textAlign: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '64px',
                height: '64px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--bg-card-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--text-light)'
              }}>
                <ShoppingBag size={32} />
              </div>
              <p style={{ fontWeight: 600 }}>Giỏ hàng đang trống</p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>
                Khám phá ngay các siêu phẩm công nghệ và thêm vào giỏ!
              </p>
            </div>
          ) : (
            cartItems.map((item) => (
              <div
                key={item.product.id}
                style={{
                  display: 'flex',
                  gap: '1rem',
                  padding: '0.85rem',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: '#f8fafc',
                  border: '1px solid var(--border)',
                  position: 'relative'
                }}
              >
                {/* Image */}
                <img
                  src={item.product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=200&q=80'}
                  alt={item.product.name}
                  style={{
                    width: '70px',
                    height: '70px',
                    borderRadius: 'var(--radius-sm)',
                    objectFit: 'cover',
                    backgroundColor: '#ffffff'
                  }}
                />

                {/* Info */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                  <div style={{ paddingRight: '20px' }}>
                    <h4 style={{
                      fontSize: '0.88rem',
                      fontWeight: 700,
                      color: 'var(--text-main)',
                      lineHeight: 1.3,
                      display: '-webkit-box',
                      WebkitLineClamp: 1,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.product.name}
                    </h4>
                    <p style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                      {formatVND(item.product.price)}
                    </p>
                  </div>

                  {/* Quantity Controls */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.5rem' }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      background: '#ffffff',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-sm)'
                    }}>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.max(1, item.quantity - 1))}
                        style={{ padding: '2px 8px', fontWeight: 700, color: 'var(--text-muted)' }}
                      >
                        -
                      </button>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0 8px' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(item.product.id, Math.min(item.product.stock, item.quantity + 1))}
                        style={{ padding: '2px 8px', fontWeight: 700, color: 'var(--text-muted)' }}
                      >
                        +
                      </button>
                    </div>

                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      = {formatVND(item.product.price * item.quantity)}
                    </span>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  onClick={() => onRemoveItem(item.product.id)}
                  style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    color: 'var(--text-light)',
                    padding: '2px'
                  }}
                  title="Xóa khỏi giỏ"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer */}
        {cartItems.length > 0 && (
          <div style={{
            padding: '1.25rem 1.5rem',
            borderTop: '1px solid var(--border)',
            backgroundColor: '#ffffff'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Tạm tính:</span>
              <span style={{ fontWeight: 600 }}>{formatVND(totalAmount)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Vận chuyển:</span>
              <span style={{ fontWeight: 600, color: 'var(--success)' }}>Miễn phí</span>
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '1.25rem',
              paddingTop: '0.75rem',
              borderTop: '1px dashed var(--border)'
            }}>
              <span style={{ fontWeight: 700, fontSize: '1.05rem' }}>Tổng cộng:</span>
              <span style={{ fontWeight: 800, fontSize: '1.25rem', color: 'var(--primary)' }}>
                {formatVND(totalAmount)}
              </span>
            </div>

            <button
              onClick={() => {
                onClose();
                onCheckout();
              }}
              className="btn btn-primary"
              style={{ width: '100%', padding: '0.85rem' }}
            >
              Tiến hành thanh toán <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
