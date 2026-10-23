import React from 'react';
import { X, Scale, ShoppingCart, Star, Trash2, CheckCircle2 } from 'lucide-react';

export default function CompareModal({
  isOpen,
  onClose,
  compareItems,
  onRemoveCompare,
  onClearCompare,
  onAddToCart,
}) {
  if (!isOpen) return null;

  const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 110,
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
          maxWidth: '1040px',
          width: '100%',
          maxHeight: '90vh',
          overflowY: 'auto',
          boxShadow: 'var(--shadow-xl)',
          padding: '1.75rem',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.5rem',
            paddingBottom: '1rem',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                backgroundColor: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Scale size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
                So sánh chi tiết sản phẩm ({compareItems.length}/3)
              </h3>
              <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Đối chiếu trực quan thông số, mức giá ưu đãi và tình trạng kho
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {compareItems.length > 0 && (
              <button
                onClick={onClearCompare}
                className="btn btn-outline"
                style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem', color: 'var(--danger)' }}
              >
                <Trash2 size={14} /> Xóa tất cả
              </button>
            )}
            <button
              onClick={onClose}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-full)',
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

        {compareItems.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
            Chưa có sản phẩm nào trong danh sách so sánh. Hãy nhấn nút <strong>So sánh</strong> trên thẻ sản phẩm!
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '680px' }}>
              <thead>
                <tr>
                  <th
                    style={{
                      width: '180px',
                      textAlign: 'left',
                      padding: '1rem',
                      backgroundColor: '#f8fafc',
                      borderBottom: '1px solid var(--border)',
                      fontSize: '0.84rem',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Tiêu chí đối chiếu
                  </th>
                  {compareItems.map((item) => (
                    <th
                      key={item.id}
                      style={{
                        padding: '1rem',
                        borderBottom: '1px solid var(--border)',
                        verticalAlign: 'top',
                        textAlign: 'center',
                        position: 'relative',
                      }}
                    >
                      <button
                        onClick={() => onRemoveCompare(item.id)}
                        title="Bỏ khỏi so sánh"
                        style={{
                          position: 'absolute',
                          top: '10px',
                          right: '10px',
                          width: '28px',
                          height: '28px',
                          borderRadius: '999px',
                          backgroundColor: '#fee2e2',
                          color: '#ef4444',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <X size={14} />
                      </button>
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        style={{
                          width: '110px',
                          height: '110px',
                          objectFit: 'cover',
                          borderRadius: 'var(--radius-md)',
                          marginBottom: '0.65rem',
                          border: '1px solid var(--border)',
                        }}
                      />
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)' }}>
                        {item.name}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    Giá bán ưu đãi
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--primary)' }}>
                        {formatVND(item.price)}
                      </div>
                      {item.originalPrice > item.price && (
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-light)', textDecoration: 'line-through' }}>
                          {formatVND(item.originalPrice)}
                        </div>
                      )}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    Mức tiết kiệm
                  </td>
                  {compareItems.map((item) => {
                    const saved = Math.max(0, (item.originalPrice || item.price) - item.price);
                    return (
                      <td key={item.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--border)', fontWeight: 700, color: saved > 0 ? 'var(--success)' : 'var(--text-muted)' }}>
                        {saved > 0 ? `Tiết kiệm ${formatVND(saved)}` : 'Giá niêm yết chuẩn'}
                      </td>
                    );
                  })}
                </tr>

                <tr>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    Danh mục
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--border)', fontSize: '0.88rem', fontWeight: 600 }}>
                      {item.category?.name || 'Công nghệ'}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    Đánh giá khách hàng
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#f59e0b' }}>
                        <Star size={15} fill="#f59e0b" /> {item.rating || 5.0} ({item.reviewCount || 0} đánh giá)
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    Tình trạng tồn kho
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} style={{ padding: '0.85rem 1rem', textAlign: 'center', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.84rem', fontWeight: 700, color: item.stock > 0 ? 'var(--success)' : 'var(--danger)' }}>
                        <CheckCircle2 size={14} /> {item.stock > 0 ? `Còn ${item.stock} sản phẩm` : 'Tạm hết hàng'}
                      </span>
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '0.85rem 1rem', fontWeight: 700, backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border)', fontSize: '0.85rem' }}>
                    Điểm nổi bật
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} style={{ padding: '0.85rem 1rem', fontSize: '0.84rem', color: 'var(--text-muted)', borderBottom: '1px solid var(--border)', lineHeight: 1.5 }}>
                      {item.description}
                    </td>
                  ))}
                </tr>

                <tr>
                  <td style={{ padding: '1rem', fontWeight: 700, backgroundColor: '#f8fafc', fontSize: '0.85rem' }}>
                    Thao tác nhanh
                  </td>
                  {compareItems.map((item) => (
                    <td key={item.id} style={{ padding: '1rem', textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <button
                          disabled={item.stock === 0}
                          onClick={() => {
                            onAddToCart(item, 1);
                            onClose();
                          }}
                          className="btn btn-primary"
                          style={{ width: '100%', padding: '0.55rem' }}
                        >
                          <ShoppingCart size={15} /> Thêm vào giỏ
                        </button>
                      </div>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
