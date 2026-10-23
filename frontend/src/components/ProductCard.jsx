import React from 'react';
import { Star, ShoppingCart, Eye, Sparkles, Heart, Scale } from 'lucide-react';

export default function ProductCard({
  product,
  onAddToCart,
  onQuickView,
  isWishlisted,
  onToggleWishlist,
  isCompared,
  onToggleCompare,
}) {
  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const discountPercent =
    product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        position: 'relative',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-6px)';
        e.currentTarget.style.boxShadow = 'var(--shadow-xl)';
        e.currentTarget.style.borderColor = '#cbd5e1';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = 'none';
        e.currentTarget.style.borderColor = 'var(--border)';
      }}
    >
      {/* Product Image & Badges */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '220px',
          backgroundColor: '#f1f5f9',
          overflow: 'hidden',
        }}
      >
        <img
          src={
            product.imageUrl ||
            'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80'
          }
          alt={product.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.src =
              'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=600&q=80';
          }}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            transition: 'transform 0.4s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.05)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1.0)')}
        />

        {/* Badges container */}
        <div
          style={{
            position: 'absolute',
            top: '12px',
            left: '12px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {product.featured && (
            <span
              className="badge"
              style={{
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                boxShadow: '0 2px 6px rgba(217, 119, 6, 0.3)',
              }}
            >
              <Sparkles size={12} /> Nổi bật
            </span>
          )}
          {discountPercent > 0 && (
            <span className="badge badge-danger">-{discountPercent}%</span>
          )}
        </div>

        {/* Top-Right Wishlist & Compare Action Icons */}
        <div
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '6px',
          }}
        >
          {onToggleWishlist && (
            <button
              type="button"
              onClick={() => onToggleWishlist(product)}
              title={isWishlisted ? 'Bỏ yêu thích' : 'Thêm vào Yêu thích'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                backgroundColor: isWishlisted ? '#ffe4e6' : 'rgba(255, 255, 255, 0.92)',
                color: isWishlisted ? '#e11d48' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Heart size={16} fill={isWishlisted ? '#e11d48' : 'none'} />
            </button>
          )}
          {onToggleCompare && (
            <button
              type="button"
              onClick={() => onToggleCompare(product)}
              title={isCompared ? 'Đang so sánh' : 'Thêm vào So sánh'}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '999px',
                backgroundColor: isCompared ? '#eef2ff' : 'rgba(255, 255, 255, 0.92)',
                color: isCompared ? '#4f46e5' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <Scale size={16} />
            </button>
          )}
        </div>

        {/* Stock status indicator */}
        <div style={{ position: 'absolute', bottom: '10px', right: '10px' }}>
          {product.stock <= 0 ? (
            <span className="badge badge-danger">Hết hàng</span>
          ) : product.stock <= 5 ? (
            <span className="badge badge-warning">Còn {product.stock} cái</span>
          ) : (
            <span className="badge badge-success">Còn hàng</span>
          )}
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          padding: '1.25rem',
          display: 'flex',
          flexDirection: 'column',
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        <div>
          {/* Category */}
          <span
            style={{
              fontSize: '0.75rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: 'var(--primary)',
              letterSpacing: '0.04em',
            }}
          >
            {product.category?.name || 'Công nghệ'}
          </span>

          {/* Title */}
          <h3
            onClick={() => onQuickView(product)}
            style={{
              fontSize: '1rem',
              fontWeight: 700,
              color: 'var(--text-main)',
              marginTop: '0.35rem',
              lineHeight: 1.4,
              cursor: 'pointer',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
            title={product.name}
          >
            {product.name}
          </h3>

          {/* Rating */}
          <div
            onClick={() => onQuickView(product)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              marginTop: '0.5rem',
              cursor: 'pointer',
            }}
            title="Xem đánh giá từ khách hàng"
          >
            <div style={{ display: 'flex', color: '#f59e0b' }}>
              <Star size={14} fill="#f59e0b" />
            </div>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-main)' }}>
              {product.rating ? product.rating.toFixed(1) : '5.0'}
            </span>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-light)' }}>
              ({product.reviewCount || 0} đánh giá)
            </span>
          </div>
        </div>

        {/* Price & Action */}
        <div
          style={{
            marginTop: '1.25rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {formatVND(product.price)}
            </div>
            {discountPercent > 0 && (
              <div
                style={{
                  fontSize: '0.8rem',
                  color: 'var(--text-light)',
                  textDecoration: 'line-through',
                }}
              >
                {formatVND(product.originalPrice)}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={() => onQuickView(product)}
              className="btn-icon"
              style={{
                background: 'var(--bg-card-subtle)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-md)',
                width: '36px',
                height: '36px',
              }}
              title="Xem chi tiết"
            >
              <Eye size={17} />
            </button>
            <button
              disabled={product.stock <= 0}
              onClick={() => onAddToCart(product)}
              className="btn btn-primary"
              style={{
                padding: '0.5rem 0.85rem',
                fontSize: '0.82rem',
                opacity: product.stock <= 0 ? 0.5 : 1,
                cursor: product.stock <= 0 ? 'not-allowed' : 'pointer',
              }}
            >
              <ShoppingCart size={16} />
              Mua
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

