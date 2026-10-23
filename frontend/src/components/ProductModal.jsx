import React, { useState, useEffect } from 'react';
import {
  X, Star, ShoppingCart, Check, ShieldCheck, Truck, RefreshCw,
  MessageSquare, User, Send, Loader2, Sparkles, ThumbsUp, CheckCircle
} from 'lucide-react';
import { api, getStoredUser } from '../services/api';

export default function ProductModal({
  product,
  onClose,
  onAddToCart,
  addToast,
  onProductUpdated
}) {
  const [quantity, setQuantity] = useState(1);
  const [reviews, setReviews] = useState([]);
  const [loadingReviews, setLoadingReviews] = useState(false);

  // Review Form state
  const currentUser = getStoredUser();
  const [newRating, setNewRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewerName, setReviewerName] = useState(currentUser?.fullName || currentUser?.username || '');
  const [reviewerEmail, setReviewerEmail] = useState(currentUser?.email || '');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  // Load reviews on mount
  const loadReviews = async () => {
    if (!product?.id) return;
    setLoadingReviews(true);
    try {
      const res = await api.getProductReviews(product.id);
      if (res.data) {
        setReviews(res.data);
      }
    } catch {
      // Ignore initial review load error
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [product?.id]);

  if (!product) return null;

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return 'Vừa xong';
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    } catch {
      return 'Vừa xong';
    }
  };

  const discountPercent = product.originalPrice && product.originalPrice > product.price
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  // Star label helper
  const getRatingLabel = (stars) => {
    switch (stars) {
      case 5: return 'Tuyệt vời, vượt mong đợi!';
      case 4: return 'Hài lòng, sản phẩm rất tốt';
      case 3: return 'Bình thường, dùng tạm ổn';
      case 2: return 'Chưa hài lòng, cần cải thiện';
      case 1: return 'Rất thất vọng';
      default: return '';
    }
  };

  // Submit review handler
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewerName.trim()) {
      if (addToast) addToast('Vui lòng nhập họ tên của bạn', 'warning');
      return;
    }
    if (!comment.trim()) {
      if (addToast) addToast('Vui lòng nhập nội dung nhận xét', 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await api.createProductReview(product.id, {
        reviewerName: reviewerName.trim(),
        reviewerEmail: reviewerEmail.trim() || undefined,
        rating: newRating,
        comment: comment.trim()
      });

      if (res.data) {
        setReviews((prev) => [res.data, ...prev]);
        setComment('');
        setShowReviewForm(false);
        if (addToast) addToast('Gửi đánh giá thành công! Cảm ơn bạn.', 'success');

        // Recalculate average locally and trigger parent update
        const updatedReviews = [res.data, ...reviews];
        const newAvg = updatedReviews.reduce((sum, r) => sum + r.rating, 0) / updatedReviews.length;
        const roundedAvg = Math.round(newAvg * 10) / 10;

        if (onProductUpdated) {
          onProductUpdated({
            ...product,
            rating: roundedAvg,
            reviewCount: updatedReviews.length
          });
        }
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Lỗi gửi đánh giá', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Review breakdown stats
  const totalReviews = reviews.length;
  const currentAvgRating = totalReviews > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / totalReviews).toFixed(1)
    : (product.rating ? product.rating.toFixed(1) : '5.0');

  const starCounts = [5, 4, 3, 2, 1].map((star) => {
    const count = reviews.filter((r) => r.rating === star).length;
    const pct = totalReviews > 0 ? Math.round((count / totalReviews) * 100) : (star === 5 ? 100 : 0);
    return { star, count, pct };
  });

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1.5rem'
      }}
      onClick={onClose}
    >
      <div
        className="fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '920px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          padding: '2.25rem'
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-full)',
            width: '38px',
            height: '38px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
            zIndex: 10
          }}
        >
          <X size={20} />
        </button>

        {/* Top Product Overview Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '2.5rem',
          paddingBottom: '2.5rem',
          borderBottom: '1px solid var(--border)'
        }}>
          {/* Product Image */}
          <div style={{
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            backgroundColor: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid var(--border)',
            position: 'relative'
          }}>
            <img
              src={product.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'}
              alt={product.name}
              style={{ width: '100%', height: '100%', maxHeight: '420px', objectFit: 'cover' }}
            />
            {discountPercent > 0 && (
              <span className="badge badge-danger" style={{ position: 'absolute', top: '16px', left: '16px', fontSize: '0.82rem', padding: '0.35rem 0.75rem' }}>
                Giảm {discountPercent}%
              </span>
            )}
          </div>

          {/* Details & Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <span className="badge badge-primary" style={{ marginBottom: '0.5rem' }}>
                {product.category?.name || 'Công nghệ'}
              </span>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-main)', lineHeight: 1.3 }}>
                {product.name}
              </h2>

              {/* Rating and review info badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem' }}>
                <div style={{ display: 'flex', color: '#f59e0b' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={17}
                      fill={s <= Math.round(Number(currentAvgRating)) ? '#f59e0b' : 'none'}
                      color="#f59e0b"
                    />
                  ))}
                </div>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: '#d97706' }}>
                  {currentAvgRating}
                </span>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  ({totalReviews} đánh giá thực tế)
                </span>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span style={{
                  color: product.stock > 0 ? 'var(--success)' : 'var(--danger)',
                  fontWeight: 600,
                  fontSize: '0.85rem'
                }}>
                  {product.stock > 0 ? `Còn ${product.stock} trong kho` : 'Hết hàng'}
                </span>
              </div>

              {/* Price Box */}
              <div style={{
                background: '#f8fafc',
                padding: '1rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                margin: '1.25rem 0',
                display: 'flex',
                alignItems: 'baseline',
                gap: '0.85rem'
              }}>
                <span style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--primary)' }}>
                  {formatVND(product.price)}
                </span>
                {discountPercent > 0 && (
                  <span style={{ textDecoration: 'line-through', color: 'var(--text-light)', fontSize: '1.05rem' }}>
                    {formatVND(product.originalPrice)}
                  </span>
                )}
              </div>

              {/* Description */}
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
                {product.description || 'Sản phẩm công nghệ chính hãng, bảo hành 12 tháng, đổi mới trong 30 ngày nếu phát sinh lỗi nhà sản xuất.'}
              </p>

              {/* Benefits */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                padding: '1rem',
                background: '#ffffff',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                marginBottom: '1.5rem'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Truck size={16} color="var(--primary)" /> Miễn phí vận chuyển toàn quốc
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <ShieldCheck size={16} color="var(--success)" /> Bảo hành 12 tháng chính hãng
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <RefreshCw size={16} color="var(--warning)" /> 1 đổi 1 trong 30 ngày
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <Check size={16} color="var(--primary)" /> Nguyên seal hộp 100%
                </div>
              </div>
            </div>

            {/* Add to Cart Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  style={{ padding: '0.65rem 1rem', background: '#f8fafc', fontWeight: 700 }}
                >
                  -
                </button>
                <span style={{ padding: '0.65rem 1rem', minWidth: '40px', textAlign: 'center', fontWeight: 600 }}>
                  {quantity}
                </span>
                <button
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                  style={{ padding: '0.65rem 1rem', background: '#f8fafc', fontWeight: 700 }}
                >
                  +
                </button>
              </div>

              <button
                disabled={product.stock <= 0}
                onClick={() => {
                  onAddToCart(product, quantity);
                  onClose();
                }}
                className="btn btn-primary"
                style={{
                  flex: 1,
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.98rem'
                }}
              >
                <ShoppingCart size={18} />
                Thêm vào giỏ ({formatVND(product.price * quantity)})
              </button>
            </div>
          </div>
        </div>

        {/* ================= REVIEWS & RATINGS SECTION ================= */}
        <div style={{ marginTop: '2.5rem' }}>
          {/* Section Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MessageSquare size={22} color="var(--primary)" />
                Đánh Giá & Nhận Xét Từ Khách Hàng
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                Đánh giá chân thực từ khách hàng đã trải nghiệm sản phẩm tại TechPulse
              </p>
            </div>

            <button
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="btn btn-primary btn-sm"
              style={{ gap: '0.4rem' }}
            >
              <Sparkles size={16} /> {showReviewForm ? 'Đóng form' : 'Viết đánh giá của bạn'}
            </button>
          </div>

          {/* Interactive Review Form (Collapsible) */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="fade-in"
              style={{
                background: '#f8fafc',
                border: '1.5px solid #e2e8f0',
                borderRadius: 'var(--radius-lg)',
                padding: '1.5rem',
                marginBottom: '2rem',
                boxShadow: 'var(--shadow-sm)'
              }}
            >
              <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '1rem' }}>
                Gửi nhận xét của bạn về "{product.name}"
              </h4>

              {/* Star Rating Picker */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '6px' }}>
                  Bạn chấm sản phẩm này mấy sao?
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        type="button"
                        key={star}
                        onClick={() => setNewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          transform: (hoverRating || newRating) >= star ? 'scale(1.15)' : 'scale(1)',
                          transition: 'transform 0.15s ease'
                        }}
                      >
                        <Star
                          size={28}
                          fill={(hoverRating || newRating) >= star ? '#f59e0b' : '#e2e8f0'}
                          color={(hoverRating || newRating) >= star ? '#f59e0b' : '#cbd5e1'}
                        />
                      </button>
                    ))}
                  </div>
                  <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#d97706', marginLeft: '0.5rem' }}>
                    {getRatingLabel(hoverRating || newRating)}
                  </span>
                </div>
              </div>

              {/* Name & Email Inputs */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1rem',
                marginBottom: '1rem'
              }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    Họ và tên của bạn <span style={{ color: 'var(--danger)' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={reviewerName}
                    onChange={(e) => setReviewerName(e.target.value)}
                    placeholder="VD: Nguyễn Văn Anh"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                    Email (Dùng để xác thực người mua)
                  </label>
                  <input
                    type="email"
                    value={reviewerEmail}
                    onChange={(e) => setReviewerEmail(e.target.value)}
                    placeholder="VD: email@example.com"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      backgroundColor: '#ffffff',
                      fontSize: '0.9rem'
                    }}
                  />
                </div>
              </div>

              {/* Comment Textarea */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '4px' }}>
                  Nội dung đánh giá chi tiết <span style={{ color: 'var(--danger)' }}>*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Hãy chia sẻ cảm nhận thực tế về chất lượng, thiết kế, hiệu năng sử dụng..."
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                    backgroundColor: '#ffffff',
                    fontSize: '0.9rem',
                    lineHeight: 1.5,
                    resize: 'vertical'
                  }}
                />
              </div>

              {/* Form Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="btn btn-secondary btn-sm"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn btn-primary btn-sm"
                  style={{ gap: '0.4rem' }}
                >
                  {isSubmitting ? <Loader2 size={16} className="spin" /> : <Send size={15} />}
                  Gửi đánh giá ngay
                </button>
              </div>
            </form>
          )}

          {/* Rating Breakdown Summary Card */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: '1.5rem',
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.5rem',
            marginBottom: '2rem'
          }}>
            {/* Big Score Box */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem',
              borderRight: '1px solid #e2e8f0',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '3.25rem', fontWeight: 900, color: 'var(--text-main)', lineHeight: 1 }}>
                {currentAvgRating}
              </div>
              <div style={{ display: 'flex', color: '#f59e0b', margin: '0.5rem 0' }}>
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    size={20}
                    fill={s <= Math.round(Number(currentAvgRating)) ? '#f59e0b' : 'none'}
                    color="#f59e0b"
                  />
                ))}
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {totalReviews} đánh giá được xác thực
              </div>
            </div>

            {/* Star Bars Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '0.45rem' }}>
              {starCounts.map(({ star, count, pct }) => (
                <div key={star} style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', fontSize: '0.82rem' }}>
                  <span style={{ width: '38px', fontWeight: 700, color: 'var(--text-main)' }}>{star} sao</span>
                  <div style={{
                    flex: 1,
                    height: '8px',
                    borderRadius: '4px',
                    backgroundColor: '#e2e8f0',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      width: `${pct}%`,
                      height: '100%',
                      backgroundColor: star >= 4 ? '#f59e0b' : (star === 3 ? '#fbbf24' : '#f87171'),
                      borderRadius: '4px',
                      transition: 'width 0.4s ease'
                    }} />
                  </div>
                  <span style={{ width: '45px', textAlign: 'right', color: 'var(--text-muted)', fontWeight: 600 }}>
                    {count} ({pct}%)
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Reviews List */}
          {loadingReviews ? (
            <div style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
              <Loader2 size={24} className="spin" style={{ margin: '0 auto 0.5rem auto' }} />
              Đang tải nhận xét...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '2.5rem 1.5rem',
              background: '#f8fafc',
              borderRadius: 'var(--radius-lg)',
              border: '1px dashed var(--border)',
              color: 'var(--text-muted)'
            }}>
              <MessageSquare size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem auto' }} />
              <p style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>Chưa có nhận xét nào cho sản phẩm này</p>
              <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>Hãy là người đầu tiên chia sẻ cảm nhận của bạn để giúp khách hàng khác!</p>
              <button
                onClick={() => setShowReviewForm(true)}
                className="btn btn-outline btn-sm"
                style={{ marginTop: '1rem' }}
              >
                Viết đánh giá ngay
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {reviews.map((rev) => (
                <div
                  key={rev.id}
                  style={{
                    background: '#ffffff',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.25rem',
                    transition: 'all 0.2s ease',
                    boxShadow: 'var(--shadow-xs)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      {/* Avatar */}
                      <div style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        backgroundColor: 'var(--primary-light)',
                        color: 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem'
                      }}>
                        {rev.reviewerName.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                            {rev.reviewerName}
                          </span>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '3px',
                            background: '#ecfdf5',
                            color: '#059669',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '1px 6px',
                            borderRadius: 'var(--radius-full)'
                          }}>
                            <CheckCircle size={11} /> Đã mua hàng
                          </span>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', marginTop: '2px' }}>
                          {formatDate(rev.createdAt)}
                        </div>
                      </div>
                    </div>

                    {/* Stars */}
                    <div style={{ display: 'flex', color: '#f59e0b' }}>
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={15}
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <p style={{
                    fontSize: '0.9rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.6,
                    marginTop: '0.65rem',
                    whiteSpace: 'pre-line'
                  }}>
                    {rev.comment}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
