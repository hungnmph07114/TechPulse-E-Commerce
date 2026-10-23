import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Tag,
  Copy,
  Check,
  DollarSign,
  Heart,
  Scale,
  Search,
  X,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';
import ProductCard from './ProductCard';
import ProductModal from './ProductModal';
import CompareModal from './CompareModal';
import { api } from '../services/api';

const PRICE_RANGES = [
  { id: 'all', label: 'Mọi mức giá', min: null, max: null },
  { id: 'under10', label: 'Dưới 10 triệu', min: null, max: 10000000 },
  { id: '10to25', label: '10 - 25 triệu', min: 10000000, max: 25000000 },
  { id: '25to45', label: '25 - 45 triệu', min: 25000000, max: 45000000 },
  { id: 'over45', label: 'Trên 45 triệu', min: 45000000, max: null },
  { id: 'custom', label: 'Tùy chỉnh khoảng giá', min: null, max: null },
];

const QUICK_SEARCH_KEYWORDS = ['iPhone', 'MacBook', 'Samsung', 'iPad', 'Sony', 'Watch'];

export default function Storefront({
  categories,
  currentUser,
  onAddToCart,
  searchQuery,
  setSearchQuery,
  addToast,
}) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [showWishlistOnly, setShowWishlistOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [featuredOnly, setFeaturedOnly] = useState(false);
  const [priceRangeId, setPriceRangeId] = useState('all');
  const [customMinPrice, setCustomMinPrice] = useState('');
  const [customMaxPrice, setCustomMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(false);
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [localSearchInput, setLocalSearchInput] = useState(searchQuery || '');

  // Wishlist & Compare state
  const [wishlistIds, setWishlistIds] = useState(() => {
    try {
      const saved = localStorage.getItem('techpulse_wishlist');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [compareItems, setCompareItems] = useState([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);

  // Active coupons banner
  const [coupons, setCoupons] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);

  // Debounced search query
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchQuery);

  useEffect(() => {
    setLocalSearchInput(searchQuery || '');
    const timer = setTimeout(() => {
      setDebouncedKeyword(searchQuery);
      setPage(0);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSearchInputChange = (val) => {
    setLocalSearchInput(val);
    if (setSearchQuery) {
      setSearchQuery(val);
    } else {
      setDebouncedKeyword(val);
    }
  };

  useEffect(() => {
    api
      .getActiveCoupons()
      .then((res) => {
        if (res.data) setCoupons(res.data);
      })
      .catch(() => {});
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const rangeObj = PRICE_RANGES.find((r) => r.id === priceRangeId) || PRICE_RANGES[0];
      const effectiveMin =
        priceRangeId === 'custom'
          ? customMinPrice !== ''
            ? Number(customMinPrice)
            : null
          : rangeObj.min;
      const effectiveMax =
        priceRangeId === 'custom'
          ? customMaxPrice !== ''
            ? Number(customMaxPrice)
            : null
          : rangeObj.max;

      const res = await api.getProducts({
        categoryId: selectedCategory,
        keyword: debouncedKeyword,
        minPrice: effectiveMin,
        maxPrice: effectiveMax,
        sortBy: sortBy,
        page: page,
        size: 12,
      });
      if (res.data) {
        if (Array.isArray(res.data)) {
          setProducts(res.data);
          setTotalPages(1);
          setTotalElements(res.data.length);
        } else {
          setProducts(res.data.content || []);
          setTotalPages(res.data.totalPages || 1);
          setTotalElements(res.data.totalElements || (res.data.content || []).length);
        }
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
  }, [
    selectedCategory,
    priceRangeId,
    customMinPrice,
    customMaxPrice,
    sortBy,
    page,
    debouncedKeyword,
  ]);

  useEffect(() => {
    if (currentUser?.id) {
      api
        .getWishlist()
        .then((res) => {
          if (Array.isArray(res.data)) {
            setWishlistIds(res.data);
          }
        })
        .catch(() => {});
    }
  }, [currentUser?.id]);

  const handleCopyCoupon = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    addToast(`Đã sao chép mã ưu đãi ${code}! Dùng ngay ở bước Thanh toán.`, 'success');
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const handleToggleWishlist = async (product) => {
    if (currentUser?.id) {
      try {
        const res = await api.toggleWishlist(product.id);
        if (res.data) {
          setWishlistIds(res.data.wishlistIds || []);
          addToast(
            res.data.added
              ? `Đã đồng bộ "${product.name}" vào Yêu thích (PostgreSQL)`
              : `Đã bỏ "${product.name}" khỏi Yêu thích`,
            res.data.added ? 'success' : 'info'
          );
          return;
        }
      } catch (err) {
        console.error(err);
      }
    }

    setWishlistIds((prev) => {
      const exists = prev.includes(product.id);
      const next = exists ? prev.filter((id) => id !== product.id) : [...prev, product.id];
      try {
        localStorage.setItem('techpulse_wishlist', JSON.stringify(next));
      } catch {}
      addToast(
        exists
          ? `Đã bỏ "${product.name}" khỏi danh sách yêu thích`
          : `Đã lưu "${product.name}" vào danh sách yêu thích`,
        exists ? 'info' : 'success'
      );
      return next;
    });
  };

  const handleToggleCompare = (product) => {
    setCompareItems((prev) => {
      const exists = prev.some((p) => p.id === product.id);
      if (exists) {
        return prev.filter((p) => p.id !== product.id);
      }
      if (prev.length >= 3) {
        addToast('Chỉ có thể so sánh tối đa 3 sản phẩm cùng lúc!', 'warning');
        return prev;
      }
      addToast(`Đã thêm "${product.name}" vào bảng so sánh`, 'info');
      return [...prev, product];
    });
  };

  const handleResetAllFilters = () => {
    setSelectedCategory(null);
    setShowWishlistOnly(false);
    setInStockOnly(false);
    setFeaturedOnly(false);
    setPriceRangeId('all');
    setCustomMinPrice('');
    setCustomMaxPrice('');
    setSortBy('createdAt');
    handleSearchInputChange('');
    setPage(0);
  };

  const hasActiveFilters =
    selectedCategory !== null ||
    showWishlistOnly ||
    inStockOnly ||
    featuredOnly ||
    priceRangeId !== 'all' ||
    Boolean(debouncedKeyword && debouncedKeyword.trim());

  const displayedProducts = products.filter((p) => {
    if (showWishlistOnly && !wishlistIds.includes(p.id)) return false;
    if (inStockOnly && (p.stock || 0) <= 0) return false;
    if (featuredOnly && !p.featured) return false;
    return true;
  });

  return (
    <div style={{ paddingBottom: '5rem' }}>
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #4338ca 100%)',
          color: 'white',
          borderRadius: 'var(--radius-xl)',
          padding: '3rem 2.5rem',
          margin: '1.5rem 0 1.5rem',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 20px 30px -10px rgba(79, 70, 229, 0.3)',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '320px',
            height: '320px',
            borderRadius: 'var(--radius-full)',
            background:
              'radial-gradient(circle, rgba(6, 182, 212, 0.4) 0%, rgba(79, 70, 229, 0) 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '680px', position: 'relative', zIndex: 2 }}>
          <span
            className="badge"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              color: '#ffffff',
              marginBottom: '1rem',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }}
          >
            <Sparkles size={14} color="#38bdf8" /> Đón đầu công nghệ tương lai 2026 • Cloud SQL PostgreSQL
          </span>
          <h1
            style={{
              fontSize: '2.45rem',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              marginBottom: '1rem',
            }}
          >
            Hệ sinh thái thiết bị công nghệ chính hãng
          </h1>
          <p
            style={{
              fontSize: '1rem',
              color: 'rgba(255, 255, 255, 0.85)',
              lineHeight: 1.6,
              marginBottom: '1.75rem',
            }}
          >
            Trải nghiệm mua sắm các dòng sản phẩm cao cấp chính hãng từ Apple, Samsung, Dell, Sony. Đối chiếu cấu hình trực quan, áp mã Voucher tiết kiệm và thanh toán VietQR nhanh chóng.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowWishlistOnly(false);
                setPriceRangeId('all');
                setPage(0);
              }}
              className="btn"
              style={{
                background: '#ffffff',
                color: '#1e1b4b',
                fontWeight: 700,
                boxShadow: '0 4px 14px rgba(0,0,0,0.1)',
              }}
            >
              Khám phá ngay
            </button>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem',
                color: '#cbd5e1',
              }}
            >
              <span>✓ Bảo hành 12T</span>
              <span>•</span>
              <span>✓ Giao nhanh 2H</span>
              <span>•</span>
              <span>✓ VietQR 24/7</span>
            </div>
          </div>
        </div>
      </div>

      {/* Active Promotional Vouchers Strip */}
      {coupons.length > 0 && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '0.9rem 1.25rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            overflowX: 'auto',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              flexShrink: 0,
              color: 'var(--primary)',
              fontWeight: 800,
              fontSize: '0.85rem',
            }}
          >
            <Tag size={17} /> ƯU ĐÃI ĐANG DIỄN RA:
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {coupons.map((c) => (
              <div
                key={c.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.4rem 0.75rem',
                  background: '#f8fafc',
                  border: '1px dashed #a5b4fc',
                  borderRadius: 'var(--radius-md)',
                  flexShrink: 0,
                }}
              >
                <div>
                  <span style={{ fontWeight: 800, fontSize: '0.82rem', color: 'var(--primary)' }}>
                    {c.code}
                  </span>
                  <span style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginLeft: '6px' }}>
                    {c.description}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleCopyCoupon(c.code)}
                  style={{
                    padding: '0.25rem 0.55rem',
                    borderRadius: 'var(--radius-sm)',
                    background: copiedCode === c.code ? 'var(--success)' : 'var(--primary)',
                    color: '#ffffff',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '3px',
                  }}
                >
                  {copiedCode === c.code ? <Check size={12} /> : <Copy size={12} />}
                  {copiedCode === c.code ? 'Đã chép' : 'Lưu mã'}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dedicated Product Catalog Search & Filter Panel */}
      <div
        style={{
          background: '#ffffff',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-xl)',
          padding: '1.35rem 1.5rem',
          marginBottom: '1.5rem',
          boxShadow: 'var(--shadow-sm)',
          display: 'flex',
          flexDirection: 'column',
          gap: '1.15rem',
        }}
      >
        {/* Row 1: Catalog Search Input + Quick Keyword Suggestions + Sort */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.85rem',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Prominent Search Bar */}
          <div style={{ flex: '1 1 340px', position: 'relative' }}>
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '14px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--primary)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm nhanh sản phẩm theo tên, hãng, cấu hình (VD: iPhone 16, MacBook M3, Sony)..."
              value={localSearchInput}
              onChange={(e) => handleSearchInputChange(e.target.value)}
              style={{
                width: '100%',
                padding: '0.7rem 2.5rem 0.7rem 2.65rem',
                borderRadius: 'var(--radius-lg)',
                border: '1.5px solid var(--border)',
                backgroundColor: '#f8fafc',
                fontSize: '0.92rem',
                fontWeight: 500,
                color: 'var(--text-main)',
              }}
            />
            {localSearchInput && (
              <button
                type="button"
                onClick={() => handleSearchInputChange('')}
                title="Xóa từ khóa tìm kiếm"
                style={{
                  position: 'absolute',
                  right: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: '24px',
                  height: '24px',
                  borderRadius: '999px',
                  backgroundColor: '#e2e8f0',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Category Dropdown & Sort Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <SlidersHorizontal size={16} color="var(--text-muted)" />
              <select
                value={selectedCategory === null ? '' : String(selectedCategory)}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedCategory(val === '' ? null : Number(val));
                  setShowWishlistOnly(false);
                  setPage(0);
                }}
                style={{
                  padding: '0.62rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                <option value="">Tất cả danh mục ({categories.length})</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={String(cat.id)}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <DollarSign size={16} color="var(--text-muted)" />
              <select
                value={priceRangeId}
                onChange={(e) => {
                  setPriceRangeId(e.target.value);
                  if (e.target.value !== 'custom') {
                    setCustomMinPrice('');
                    setCustomMaxPrice('');
                  }
                  setPage(0);
                }}
                style={{
                  padding: '0.62rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                {PRICE_RANGES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <ArrowUpDown size={16} color="var(--text-muted)" />
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  setPage(0);
                }}
                style={{
                  padding: '0.62rem 0.9rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                  fontSize: '0.86rem',
                }}
              >
                <option value="createdAt">Sắp xếp: Mới nhất</option>
                <option value="price-asc">Giá: Thấp đến cao</option>
                <option value="price-desc">Giá: Cao đến thấp</option>
                <option value="rating">Đánh giá cao nhất</option>
                <option value="name">Tên A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Quick Search Keyword Suggestions + Price Range Pills */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingTop: '0.2rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Từ khóa phổ biến:
            </span>
            {QUICK_SEARCH_KEYWORDS.map((kw) => {
              const active = localSearchInput.toLowerCase() === kw.toLowerCase();
              return (
                <button
                  key={kw}
                  type="button"
                  onClick={() => handleSearchInputChange(active ? '' : kw)}
                  style={{
                    padding: '0.25rem 0.65rem',
                    borderRadius: '999px',
                    fontSize: '0.76rem',
                    fontWeight: 600,
                    backgroundColor: active ? 'var(--primary)' : '#f1f5f9',
                    color: active ? '#ffffff' : 'var(--text-main)',
                    border: `1px solid ${active ? 'var(--primary)' : 'transparent'}`,
                  }}
                >
                  {kw}
                </button>
              );
            })}
          </div>

          {/* Custom Min / Max Price Range Inputs */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
              Khoảng giá (VNĐ):
            </span>
            <input
              type="number"
              min="0"
              step="500000"
              placeholder="Từ (VD: 5000000)"
              value={customMinPrice}
              onChange={(e) => {
                setPriceRangeId('custom');
                setCustomMinPrice(e.target.value);
                setPage(0);
              }}
              style={{
                width: '135px',
                padding: '0.38rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
              }}
            />
            <span style={{ color: 'var(--text-muted)' }}>—</span>
            <input
              type="number"
              min="0"
              step="500000"
              placeholder="Đến (VD: 30000000)"
              value={customMaxPrice}
              onChange={(e) => {
                setPriceRangeId('custom');
                setCustomMaxPrice(e.target.value);
                setPage(0);
              }}
              style={{
                width: '145px',
                padding: '0.38rem 0.65rem',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border)',
                fontSize: '0.8rem',
              }}
            />
          </div>
        </div>

        {/* Row 2: Category Pills + Quick Toggles (Wishlist, In Stock, Featured) */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            paddingTop: '0.75rem',
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => {
                setSelectedCategory(null);
                setShowWishlistOnly(false);
                setPage(0);
              }}
              style={{
                padding: '0.5rem 1.05rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.85rem',
                fontWeight: 600,
                backgroundColor:
                  selectedCategory === null && !showWishlistOnly ? 'var(--primary)' : '#ffffff',
                color:
                  selectedCategory === null && !showWishlistOnly ? '#ffffff' : 'var(--text-main)',
                border: `1px solid ${
                  selectedCategory === null && !showWishlistOnly ? 'var(--primary)' : 'var(--border)'
                }`,
                boxShadow:
                  selectedCategory === null && !showWishlistOnly
                    ? '0 4px 10px var(--primary-glow)'
                    : 'none',
                transition: 'all var(--transition-fast)',
              }}
            >
              Tất cả sản phẩm
            </button>

            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCategory(cat.id);
                  setShowWishlistOnly(false);
                  setPage(0);
                }}
                style={{
                  padding: '0.5rem 1.05rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  backgroundColor:
                    selectedCategory === cat.id && !showWishlistOnly ? 'var(--primary)' : '#ffffff',
                  color:
                    selectedCategory === cat.id && !showWishlistOnly ? '#ffffff' : 'var(--text-main)',
                  border: `1px solid ${
                    selectedCategory === cat.id && !showWishlistOnly
                      ? 'var(--primary)'
                      : 'var(--border)'
                  }`,
                  boxShadow:
                    selectedCategory === cat.id && !showWishlistOnly
                      ? '0 4px 10px var(--primary-glow)'
                      : 'none',
                  transition: 'all var(--transition-fast)',
                }}
              >
                {cat.name}
              </button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.45rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              type="button"
              onClick={() => setInStockOnly((prev) => !prev)}
              style={{
                padding: '0.48rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: inStockOnly ? '#059669' : '#ffffff',
                color: inStockOnly ? '#ffffff' : '#059669',
                border: '1px solid #a7f3d0',
              }}
            >
              ✓ Còn hàng
            </button>

            <button
              type="button"
              onClick={() => setFeaturedOnly((prev) => !prev)}
              style={{
                padding: '0.48rem 0.9rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                backgroundColor: featuredOnly ? '#d97706' : '#ffffff',
                color: featuredOnly ? '#ffffff' : '#d97706',
                border: '1px solid #fde68a',
              }}
            >
              ★ Nổi bật
            </button>

            <button
              type="button"
              onClick={() => setShowWishlistOnly((prev) => !prev)}
              style={{
                padding: '0.48rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.82rem',
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: showWishlistOnly ? '#e11d48' : '#ffffff',
                color: showWishlistOnly ? '#ffffff' : '#e11d48',
                border: '1px solid #fecdd3',
              }}
            >
              <Heart size={14} fill={showWishlistOnly ? '#ffffff' : 'none'} /> Yêu thích (
              {wishlistIds.length})
            </button>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={handleResetAllFilters}
                style={{
                  padding: '0.48rem 0.9rem',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  backgroundColor: '#f1f5f9',
                  color: 'var(--text-main)',
                  border: '1px solid var(--border)',
                }}
              >
                <RotateCcw size={13} /> Đặt lại lọc
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Count Info */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem',
          marginBottom: '1.25rem',
          color: 'var(--text-muted)',
          fontSize: '0.88rem',
        }}
      >
        <span>
          Hiển thị <strong>{displayedProducts.length}</strong> / <strong>{totalElements}</strong> sản
          phẩm
        </span>
        {debouncedKeyword && (
          <span>
            Kết quả tìm kiếm cho: "<strong>{debouncedKeyword}</strong>"
          </span>
        )}
      </div>

      {/* Product Grid */}
      {loading ? (
        <div
          style={{
            minHeight: '350px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '1rem',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw size={36} className="spin" color="var(--primary)" />
          <p style={{ fontWeight: 600 }}>Đang tải danh mục sản phẩm từ PostgreSQL...</p>
        </div>
      ) : displayedProducts.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '4rem 1rem',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border)',
            color: 'var(--text-muted)',
          }}
        >
          <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>
            {showWishlistOnly
              ? 'Bạn chưa thêm sản phẩm nào vào Danh sách yêu thích'
              : 'Không tìm thấy sản phẩm nào'}
          </p>
          <p style={{ fontSize: '0.9rem', marginTop: '0.5rem', marginBottom: '1.25rem' }}>
            {showWishlistOnly
              ? 'Hãy nhấn biểu tượng trái tim trên các sản phẩm bạn quan tâm để lưu lại.'
              : 'Hãy thử thay đổi từ khóa, khoảng giá hoặc bộ lọc danh mục.'}
          </p>
          <button
            onClick={() => {
              setSelectedCategory(null);
              setShowWishlistOnly(false);
              setPriceRangeId('all');
              setPage(0);
            }}
            className="btn btn-secondary btn-sm"
          >
            Xem tất cả sản phẩm
          </button>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: '1.5rem',
          }}
        >
          {displayedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onAddToCart={(p) => onAddToCart(p, 1)}
              onQuickView={(p) => setQuickViewProduct(p)}
              isWishlisted={wishlistIds.includes(product.id)}
              onToggleWishlist={handleToggleWishlist}
              isCompared={compareItems.some((item) => item.id === product.id)}
              onToggleCompare={handleToggleCompare}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !showWishlistOnly && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '0.5rem',
            marginTop: '3rem',
          }}
        >
          <button
            disabled={page === 0}
            onClick={() => setPage(page - 1)}
            className="btn btn-secondary"
            style={{
              padding: '0.5rem 0.85rem',
              opacity: page === 0 ? 0.5 : 1,
              cursor: page === 0 ? 'not-allowed' : 'pointer',
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
                boxShadow: page === idx ? '0 2px 8px var(--primary-glow)' : 'none',
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
              cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
            }}
          >
            Sau <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Floating Comparison Bar */}
      {compareItems.length > 0 && (
        <div
          style={{
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 85,
            backgroundColor: '#0f172a',
            color: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            padding: '0.75rem 1.25rem',
            boxShadow: 'var(--shadow-xl)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, fontSize: '0.88rem' }}>
            <Scale size={18} color="#38bdf8" /> Đang chọn so sánh ({compareItems.length}/3):
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            {compareItems.map((item) => (
              <span
                key={item.id}
                style={{
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  padding: '0.28rem 0.65rem',
                  borderRadius: '999px',
                  fontSize: '0.78rem',
                  fontWeight: 600,
                  maxWidth: '160px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {item.name}
              </span>
            ))}
          </div>

          <button
            onClick={() => setIsCompareModalOpen(true)}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.95rem', fontSize: '0.82rem' }}
          >
            Đối chiếu ngay
          </button>

          <button
            onClick={() => setCompareItems([])}
            style={{ color: '#94a3b8', fontSize: '0.78rem', fontWeight: 600 }}
          >
            Xóa
          </button>
        </div>
      )}

      {/* Quick View Modal */}
      {quickViewProduct && (
        <ProductModal
          product={quickViewProduct}
          onClose={() => setQuickViewProduct(null)}
          onAddToCart={(prod, qty, selectedVariant, unitPrice) => {
            onAddToCart(prod, qty, selectedVariant, unitPrice);
            setQuickViewProduct(null);
          }}
          addToast={addToast}
          onProductUpdated={(updatedProd) => {
            setQuickViewProduct(updatedProd);
            setProducts((prev) =>
              prev.map((p) => (p.id === updatedProd.id ? updatedProd : p))
            );
          }}
        />
      )}

      {/* Side-by-Side Compare Modal */}
      <CompareModal
        isOpen={isCompareModalOpen}
        onClose={() => setIsCompareModalOpen(false)}
        compareItems={compareItems}
        onRemoveCompare={(id) =>
          setCompareItems((prev) => prev.filter((item) => item.id !== id))
        }
        onClearCompare={() => setCompareItems([])}
        onAddToCart={onAddToCart}
      />
    </div>
  );
}
