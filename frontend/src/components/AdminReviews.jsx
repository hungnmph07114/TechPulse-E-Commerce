import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Star,
  Search,
  Eye,
  EyeOff,
  Trash2,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  CornerDownRight,
  ShieldCheck,
  Filter,
} from 'lucide-react';
import { api } from '../services/api';

const QUICK_REPLIES = [
  'Cảm ơn bạn đã tin tưởng mua sắm thiết bị chính hãng tại TechPulse! Chúc bạn có trải nghiệm sử dụng tuyệt vời ạ.',
  'TechPulse cảm ơn đánh giá chi tiết của bạn! Sản phẩm được bảo hành điện tử 12 tháng chính hãng trên toàn hệ thống.',
  'Rất tiếc vì trải nghiệm chưa trọn vẹn của bạn. Bộ phận CSKH TechPulse sẽ liên hệ hỗ trợ kiểm tra & đổi mới ngay hôm nay ạ!',
];

export default function AdminReviews({ addToast }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const [replyingId, setReplyingId] = useState(null);
  const [replyDraft, setReplyDraft] = useState('');
  const [savingId, setSavingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchAllReviews = async () => {
    setLoading(true);
    try {
      const res = await api.getAllReviewsAdmin();
      if (Array.isArray(res.data)) {
        setReviews(res.data);
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Không thể tải danh sách đánh giá', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllReviews();
  }, []);

  const handleToggleVisibility = async (rev) => {
    const nextStatus = rev.status === 'HIDDEN' ? 'APPROVED' : 'HIDDEN';
    setSavingId(rev.id);
    try {
      const res = await api.moderateReview(rev.id, { status: nextStatus });
      if (res.data) {
        setReviews((prev) => prev.map((r) => (r.id === rev.id ? res.data : r)));
        if (addToast) {
          addToast(
            nextStatus === 'APPROVED'
              ? `Đã hiển thị lại đánh giá của "${rev.reviewerName}" trên trang sản phẩm`
              : `Đã ẩn đánh giá của "${rev.reviewerName}" khỏi trang sản phẩm`,
            'success'
          );
        }
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Lỗi cập nhật trạng thái đánh giá', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleOpenReply = (rev) => {
    setReplyingId(rev.id);
    setReplyDraft(rev.adminReply || '');
  };

  const handleSaveReply = async (rev) => {
    setSavingId(rev.id);
    try {
      const res = await api.moderateReview(rev.id, {
        adminReply: replyDraft.trim(),
      });
      if (res.data) {
        setReviews((prev) => prev.map((r) => (r.id === rev.id ? res.data : r)));
        setReplyingId(null);
        if (addToast) {
          addToast(
            replyDraft.trim()
              ? `Đã đăng phản hồi chính thức cho khách hàng ${rev.reviewerName}`
              : 'Đã xóa phản hồi của Admin',
            'success'
          );
        }
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Không thể lưu phản hồi', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const handleDeleteReview = async (id) => {
    setSavingId(id);
    try {
      await api.deleteReview(id);
      setReviews((prev) => prev.filter((r) => r.id !== id));
      setConfirmDeleteId(null);
      if (addToast) addToast('Đã xóa vĩnh viễn đánh giá và đồng bộ lại điểm sao sản phẩm', 'info');
    } catch (err) {
      if (addToast) addToast(err.message || 'Không thể xóa đánh giá', 'error');
    } finally {
      setSavingId(null);
    }
  };

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
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

  // KPI calculations
  const totalReviews = reviews.length;
  const approvedCount = reviews.filter((r) => r.status !== 'HIDDEN').length;
  const hiddenCount = reviews.filter((r) => r.status === 'HIDDEN').length;
  const lowStarCount = reviews.filter((r) => r.rating <= 3).length;
  const repliedCount = reviews.filter((r) => r.adminReply && r.adminReply.trim() !== '').length;
  const avgRating =
    totalReviews > 0
      ? (reviews.reduce((sum, r) => sum + (r.rating || 5), 0) / totalReviews).toFixed(2)
      : '5.00';

  const filteredReviews = reviews.filter((r) => {
    if (starFilter === '5' && r.rating !== 5) return false;
    if (starFilter === '4' && r.rating !== 4) return false;
    if (starFilter === 'LOW' && r.rating > 3) return false;

    if (statusFilter === 'APPROVED' && r.status === 'HIDDEN') return false;
    if (statusFilter === 'HIDDEN' && r.status !== 'HIDDEN') return false;
    if (statusFilter === 'UNREPLIED' && r.adminReply && r.adminReply.trim() !== '') return false;

    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      const matchProd = (r.productName || '').toLowerCase().includes(q);
      const matchUser = (r.reviewerName || '').toLowerCase().includes(q);
      const matchEmail = (r.reviewerEmail || '').toLowerCase().includes(q);
      const matchComment = (r.comment || '').toLowerCase().includes(q);
      return matchProd || matchUser || matchEmail || matchComment;
    }
    return true;
  });

  return (
    <div className="fade-in" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
      {/* Top KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem',
          marginBottom: '1.5rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.2rem 1.35rem',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            TỔNG ĐÁNH GIÁ SẢN PHẨM
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              marginTop: '0.3rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalReviews}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--success)', fontWeight: 600, marginTop: '4px' }}>
            {approvedCount} hiển thị • {hiddenCount} đang ẩn
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.2rem 1.35rem',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            ĐIỂM HÀI LÒNG TRUNG BÌNH
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              marginTop: '0.3rem',
            }}
          >
            <span
              style={{
                fontSize: '1.75rem',
                fontWeight: 800,
                color: '#d97706',
                fontVariantNumeric: 'tabular-nums',
              }}
            >
              {avgRating}
            </span>
            <Star size={22} fill="#f59e0b" color="#f59e0b" />
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Tự động đồng bộ sang thẻ sản phẩm
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.2rem 1.35rem',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            TỶ LỆ PHẢN HỒI CSKH
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--primary)',
              marginTop: '0.3rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {repliedCount}/{totalReviews}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Còn {Math.max(0, totalReviews - repliedCount)} đánh giá chưa phản hồi
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.2rem 1.35rem',
            border: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            ĐÁNH GIÁ CẦN LƯU Ý (1–3 SAO)
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: lowStarCount > 0 ? 'var(--danger)' : 'var(--success)',
              marginTop: '0.3rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {lowStarCount}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            {lowStarCount > 0 ? 'Cần ưu tiên kiểm tra & hỗ trợ khách' : '100% đánh giá tích cực (4–5 sao)'}
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          padding: '1.15rem 1.35rem',
          marginBottom: '1.25rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: '420px' }}>
          <Search
            size={16}
            style={{
              position: 'absolute',
              left: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
          <input
            type="text"
            placeholder="Tìm theo tên sản phẩm, tên khách hàng hoặc nội dung..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 0.9rem 0.6rem 2.3rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: '#f8fafc',
              fontSize: '0.86rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {/* Star Segment Filter */}
          <div
            style={{
              display: 'inline-flex',
              background: '#f1f5f9',
              padding: '3px',
              borderRadius: 'var(--radius-md)',
              gap: '3px',
            }}
          >
            {[
              { id: 'ALL', label: 'Tất cả sao' },
              { id: '5', label: '5 Sao' },
              { id: '4', label: '4 Sao' },
              { id: 'LOW', label: '1–3 Sao' },
            ].map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setStarFilter(item.id)}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  fontWeight: starFilter === item.id ? 700 : 600,
                  backgroundColor: starFilter === item.id ? '#ffffff' : 'transparent',
                  color: starFilter === item.id ? 'var(--primary)' : 'var(--text-muted)',
                  boxShadow: starFilter === item.id ? 'var(--shadow-sm)' : 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Moderation Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{
              padding: '0.5rem 0.8rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              backgroundColor: '#ffffff',
              fontSize: '0.82rem',
              fontWeight: 600,
              color: 'var(--text-main)',
            }}
          >
            <option value="ALL">Mọi trạng thái ({totalReviews})</option>
            <option value="APPROVED">Đang hiển thị ({approvedCount})</option>
            <option value="HIDDEN">Đang ẩn ({hiddenCount})</option>
            <option value="UNREPLIED">Chưa phản hồi ({Math.max(0, totalReviews - repliedCount)})</option>
          </select>

          <button
            type="button"
            onClick={fetchAllReviews}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.52rem 0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>
        </div>
      </div>

      {/* Reviews Moderation List */}
      {loading ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            padding: '3rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <RefreshCw size={24} className="spin" style={{ margin: '0 auto 0.65rem' }} />
          <div>Đang tải danh sách đánh giá khách hàng từ PostgreSQL...</div>
        </div>
      ) : filteredReviews.length === 0 ? (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px dashed var(--border)',
            padding: '3rem 1.5rem',
            textAlign: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <MessageSquare size={36} color="var(--text-light)" style={{ margin: '0 auto 0.75rem' }} />
          <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem' }}>
            Không tìm thấy đánh giá nào khớp bộ lọc
          </div>
          <p style={{ fontSize: '0.84rem', marginTop: '4px' }}>
            Hãy thử chuyển bộ lọc số sao hoặc từ khóa tìm kiếm về mặc định.
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredReviews.map((rev) => {
            const isHidden = rev.status === 'HIDDEN';
            const isReplying = replyingId === rev.id;

            return (
              <div
                key={rev.id}
                style={{
                  background: isHidden ? '#f8fafc' : '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${isHidden ? '#cbd5e1' : 'var(--border)'}`,
                  padding: '1.25rem 1.4rem',
                  opacity: isHidden ? 0.82 : 1,
                  transition: 'all 0.2s ease',
                }}
              >
                {/* Top Row: Product info + Reviewer + Moderation Actions */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    paddingBottom: '0.85rem',
                    borderBottom: '1px solid #f1f5f9',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <img
                      src={
                        rev.productImage ||
                        'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=200&q=80'
                      }
                      alt={rev.productName}
                      referrerPolicy="no-referrer"
                      onError={(e) => {
                        e.currentTarget.src =
                          'https://images.unsplash.com/photo-1526738549149-8e07eca6c147?auto=format&fit=crop&w=200&q=80';
                      }}
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '10px',
                        objectFit: 'cover',
                        border: '1px solid var(--border)',
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div
                        style={{
                          fontSize: '0.92rem',
                          fontWeight: 800,
                          color: 'var(--text-main)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          flexWrap: 'wrap',
                        }}
                      >
                        <span>{rev.productName}</span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color: isHidden ? 'var(--danger)' : 'var(--success)',
                          }}
                        >
                          · {isHidden ? 'Đang ẩn khỏi cửa hàng' : 'Đang hiển thị công khai'}
                        </span>
                      </div>

                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          fontSize: '0.8rem',
                          color: 'var(--text-muted)',
                          marginTop: '3px',
                          flexWrap: 'wrap',
                        }}
                      >
                        <strong style={{ color: 'var(--text-main)' }}>{rev.reviewerName}</strong>
                        {rev.reviewerEmail && <span>({rev.reviewerEmail})</span>}
                        <span>·</span>
                        <span style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {formatDateTime(rev.createdAt)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating + Action Buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: '0.3rem 0.65rem',
                        borderRadius: '8px',
                        background: rev.rating >= 4 ? '#fffbeb' : '#fef2f2',
                        border: `1px solid ${rev.rating >= 4 ? '#fde68a' : '#fecaca'}`,
                      }}
                    >
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= rev.rating ? '#f59e0b' : 'none'}
                          color="#f59e0b"
                        />
                      ))}
                      <span
                        style={{
                          marginLeft: '4px',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: rev.rating >= 4 ? '#b45309' : '#dc2626',
                          fontVariantNumeric: 'tabular-nums',
                        }}
                      >
                        {rev.rating}.0
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleOpenReply(rev)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.78rem', fontWeight: 700 }}
                    >
                      <MessageSquare size={14} color="var(--primary)" />
                      {rev.adminReply ? 'Sửa phản hồi' : 'Phản hồi khách'}
                    </button>

                    <button
                      type="button"
                      disabled={savingId === rev.id}
                      onClick={() => handleToggleVisibility(rev)}
                      className="btn btn-secondary btn-sm"
                      style={{
                        fontSize: '0.78rem',
                        fontWeight: 700,
                        color: isHidden ? 'var(--success)' : 'var(--warning)',
                      }}
                    >
                      {isHidden ? (
                        <>
                          <Eye size={14} /> Hiện lại
                        </>
                      ) : (
                        <>
                          <EyeOff size={14} /> Ẩn đánh giá
                        </>
                      )}
                    </button>

                    {confirmDeleteId === rev.id ? (
                      <div style={{ display: 'inline-flex', gap: '0.35rem' }}>
                        <button
                          type="button"
                          disabled={savingId === rev.id}
                          onClick={() => handleDeleteReview(rev.id)}
                          className="btn btn-danger btn-sm"
                          style={{ fontSize: '0.76rem' }}
                        >
                          Xác nhận xóa
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="btn btn-secondary btn-sm"
                          style={{ fontSize: '0.76rem' }}
                        >
                          Hủy
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteId(rev.id)}
                        className="btn btn-secondary btn-sm"
                        style={{ color: 'var(--danger)', fontSize: '0.78rem' }}
                        title="Xóa đánh giá vi phạm"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>

                {/* Customer Comment Body */}
                <p
                  style={{
                    fontSize: '0.92rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.6,
                    marginTop: '0.85rem',
                    whiteSpace: 'pre-line',
                  }}
                >
                  "{rev.comment}"
                </p>

                {/* Existing Official Admin Reply */}
                {rev.adminReply && !isReplying && (
                  <div
                    style={{
                      marginTop: '0.85rem',
                      padding: '0.85rem 1.1rem',
                      borderRadius: '10px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #e2e8f0',
                      display: 'flex',
                      gap: '0.65rem',
                      alignItems: 'flex-start',
                    }}
                  >
                    <CornerDownRight size={16} color="var(--primary)" style={{ marginTop: '3px', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.45rem',
                          fontSize: '0.78rem',
                          fontWeight: 800,
                          color: 'var(--primary)',
                        }}
                      >
                        <ShieldCheck size={14} />
                        <span>Phản hồi chính thức từ TechPulse Admin (@{rev.repliedBy || 'admin'})</span>
                        {rev.repliedAt && (
                          <span style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                            · {formatDateTime(rev.repliedAt)}
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: '0.86rem', color: 'var(--text-main)', marginTop: '4px', lineHeight: 1.5 }}>
                        {rev.adminReply}
                      </div>
                    </div>
                  </div>
                )}

                {/* Inline Admin Reply Editor */}
                {isReplying && (
                  <div
                    className="fade-in"
                    style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      borderRadius: '12px',
                      backgroundColor: '#f8fafc',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                      Phản hồi khách hàng <strong>{rev.reviewerName}</strong> (hiển thị công khai dưới đánh giá sản phẩm):
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                      {QUICK_REPLIES.map((sample, idx) => (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => setReplyDraft(sample)}
                          style={{
                            padding: '0.28rem 0.65rem',
                            borderRadius: '6px',
                            backgroundColor: '#ffffff',
                            border: '1px solid var(--border)',
                            fontSize: '0.74rem',
                            color: 'var(--text-muted)',
                            fontWeight: 600,
                          }}
                        >
                          Mẫu câu #{idx + 1}
                        </button>
                      ))}
                    </div>

                    <textarea
                      rows={3}
                      value={replyDraft}
                      onChange={(e) => setReplyDraft(e.target.value)}
                      placeholder="Nhập nội dung phản hồi từ TechPulse Store..."
                      style={{
                        width: '100%',
                        padding: '0.7rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border)',
                        backgroundColor: '#ffffff',
                        fontSize: '0.86rem',
                        marginBottom: '0.65rem',
                      }}
                    />

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setReplyingId(null)}
                        className="btn btn-secondary btn-sm"
                      >
                        Đóng
                      </button>
                      <button
                        type="button"
                        disabled={savingId === rev.id}
                        onClick={() => handleSaveReply(rev)}
                        className="btn btn-primary btn-sm"
                      >
                        <Send size={14} /> Lưu phản hồi
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
