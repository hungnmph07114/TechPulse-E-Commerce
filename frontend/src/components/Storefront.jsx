import React, { useState, useEffect } from 'react';
import { Sparkles, SlidersHorizontal, ArrowUpDown, ChevronLeft, ChevronRight, RefreshCw } from 'lucide-react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import { api } from '../services/api';

export default function Storefront({
  categories,
  onAddToCart,
  searchQuery,
  addToast
}) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        categoryId: selectedCategory,
        keyword: searchQuery,
        sortBy: sortBy,
        page: page,
        size: 8
      });
      if (res.data) {
        setProducts(res.data.content || []);
        setTotalPages(res.data.totalPages || 0);
        setTotalElements(res.data.totalElements || 0);
      }
    } catch (err) {
      console.error(err);
      addToast('Không thể tải sản phẩm: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy, page, searchQuery]);

  return (
    <div style={{ paddingBottom: '4rem' }}>
      {/* Hero Banner */}
      <div style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
        color: 'white',
        borderRadius: 'var(--radius-xl)',
        padding: '3rem 2.5rem',
        margin: '1.5rem 0 2.5rem',
        position: 'relative',
        overflow: 'hidden',
        boxShadow: '0 20px 30px -10px rgba(79, 70, 229, 0.3)'
      }}>
        {/* Glow decoration */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '320px',
          height: '320px',
          borderRadius: 'var(--radius-full)',
          background: 'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(79, 70, 229, 0) 70%)',
          pointerEvents: 'none'
        }} />

        <div style={{ maxWidth: '640px', position: 'relative', zIndex: 2 }}>
          <span className="badge" style={{
            background: 'rgba(255, 255, 255, 0.15)',
            backdropFilter: 'blur(10px)',
            color: '#ffffff',
            marginBottom: '1rem',
            border: '1px solid rgba(255, 255, 255, 0.2)'
          }}>
            <Sparkles size={14} color="#38bdf8" /> Đón đầu công nghệ tương lai 2026
          </span>
          <h1 style={{
            fontSize: '2.5rem',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            marginBottom: '1rem'
          }}>
            Hệ sinh thái thiết bị & công nghệ đỉnh cao
          </h1>
          <p style={{
            fontSize: '1rem',
            color: 'rgba(255, 255, 255, 0.85)',
            lineHeight: 1.6,
            marginBottom: '1.75rem'
          }}>
            Trải nghiệm các dòng sản phẩm cao cấp chính hãng từ Apple, Samsung, Dell, Sony với hiệu năng vượt trội và chế độ hậu mãi chuẩn quốc tế.
          </p>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setPage(0);
              }}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)'
              }}
            >
              Khám phá ngay
            </button>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#cbd5e1' }}>
              <span>✓ Bảo hành 12T</span>
              <span>•</span>
              <span>✓ Giao nhanh 2H</span>
              <span>•</span>
              <span>✓ Trả góp 0%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Categories & Filter Bar */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        {/* Category Pills */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <button
            onClick={() => { setSelectedCategory(null); setPage(0); }}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.88rem',
              fontWeight: 600,
              backgroundColor: selectedCategory === null ? 'var(--primary)' : '#ffffff',
              color: selectedCategory === null ? '#ffffff' : 'var(--text-main)',
              border: `1px solid ${selectedCategory === null ? 'var(--primary)' : 'var(--border)'}`,
              boxShadow: selectedCategory === null ? '0 4px 10px var(--primary-glow)' : 'none',
              transition: 'all var(--transition-fast)'
            }}
          >
            Tất cả sản phẩm
          </button>

          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); setPage(0); }}
              style={{
                padding: '0.55rem 1.1rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.88rem',
                fontWeight: 600,
                backgroundColor: selectedCategory === cat.id ? 'var(--primary)' : '#ffffff',
                color: selectedCategory === cat.id ? '#ffffff' : 'var(--text-main)',
                border: `1px solid ${selectedCategory === cat.id ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: selectedCategory === cat.id ? '0 4px 10px var(--primary-glow)' : 'none',
                transition: 'all var(--transition-fast)'
              }}
            >
              {cat.name}
            </button>
          ))}
        </div>

        {/* Sort Dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <ArrowUpDown size={16} color="var(--text-muted)" />
          <select
            value={sortBy}
            onChange={(e) => { setSortBy(e.target.value); setPage(0); }}
            style={{
              padding: '0.55rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="createdAt">Mới nhất</option>
            <option value="price-asc">Giá: Thấp đến cao</option>
            <option value="price-desc">Giá: Cao đến thấp</option>
            <option value="rating">Đánh giá cao nhất</option>
            <option value="name">Tên A-Z</option>
          </select>
        </div>
      </div>

      {/* Product Count Info */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '1.25rem',
        color: 'var(--text-muted)',
        fontSize: '0.88rem'
      }}>
        <span>Hiển thị <strong>{products.length}</strong> / <strong>{totalElements}</strong> sản phẩm</span>
        {searchQuery && (
          <span>Kết quả tìm kiếm cho: "<strong>{searchQuery}</strong>"</span>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div style={{
          minHeight: '350px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          color: 'var(--text-muted)'
        }}>
          <RefreshCw size={36} className="spin" color="var(--primary)" />
          <p style={{ fontWeight: 600 }}>Đang tải danh mục sản phẩm từ MySQL...</p>
        </div>
      ) : products.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 1rem',
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px dashed var(--border)',
          color: 'var(--text-muted)'
        }}>
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>Không tìm thấy sản phẩm nào</p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem' }}>Hãy thử thay đổi từ khóa hoặc bộ lọc danh mục.</p>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: '1.5rem'
        }}>
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(p) => onAddToCart(p, 1)}
              onQuickView={(p) => setQuickViewProduct(p)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '0.5rem',
          marginTop: '3rem'
        }}>
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              opacity: page === 0 ? 0.5 : 1,
              cursor: page === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            <ChevronLeft size={18} /> Trước
          </button>

          {Array.from({ length: totalPages }).map((_, idx) => (
            <button
              key={idx}
              onClick={() => setPage(idx)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                fontSize: '0.88rem',
                backgroundColor: page === idx ? 'var(--primary)' : '#ffffff',
                color: page === idx ? '#ffffff' : 'var(--text-main)',
                border: `1px solid ${page === idx ? 'var(--primary)' : 'var(--border)'}`,
                boxShadow: page === idx ? '0 2px 8px var(--primary-glow)' : 'none'
              }}
            >
              {idx + 1}
            </button>
          ))}

          <button
            disabled={page >= totalPages - 1}
            onClick={() => setPage(page + 1)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              opacity: page >= totalPages - 1 ? 0.5 : 1,
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Sau <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={onAddToCart}
          addToast={addToast}
          onProductUpdated={(updatedProduct) => {
            setQuickViewProduct(updatedProduct);
            setProducts((prev) => prev.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
          }}
        />
      )}
    </div>
  );
}
