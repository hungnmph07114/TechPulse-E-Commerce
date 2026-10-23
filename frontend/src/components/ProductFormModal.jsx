import React, { useState, useEffect, useRef } from 'react';
import { X, Save, AlertCircle, UploadCloud, Link as LinkIcon, RefreshCw, CheckCircle2 } from 'lucide-react';
import { api } from '../services/api';

export default function ProductFormModal({
  isOpen,
  onClose,
  onSubmit,
  categories,
  initialData,
  isEdit
}) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    originalPrice: '',
    stock: '',
    imageUrl: '',
    categoryId: '',
    featured: false
  });
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || '',
        description: initialData.description || '',
        price: initialData.price || '',
        originalPrice: initialData.originalPrice || '',
        stock: initialData.stock !== undefined ? initialData.stock : '',
        imageUrl: initialData.imageUrl || '',
        categoryId: initialData.category?.id || (categories[0]?.id || ''),
        featured: !!initialData.featured
      });
      setUploadMode(initialData.imageUrl?.startsWith('http://localhost:8080/uploads') ? 'file' : 'url');
    } else {
      setFormData({
        name: '',
        description: '',
        price: '',
        originalPrice: '',
        stock: 10,
        imageUrl: '',
        categoryId: categories[0]?.id || '',
        featured: false
      });
      setUploadMode('file');
    }
    setError('');
    setUploadSuccess(false);
  }, [initialData, categories, isOpen]);

  if (!isOpen) return null;

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Vui lòng chọn file hình ảnh (JPG, PNG, WEBP, GIF).');
      return;
    }

    setUploading(true);
    setError('');
    setUploadSuccess(false);

    try {
      const res = await api.uploadImage(file);
      if (res.data?.url) {
        setFormData((prev) => ({ ...prev, imageUrl: res.data.url }));
        setUploadSuccess(true);
      }
    } catch (err) {
      setError(err.message || 'Lỗi khi tải ảnh lên máy chủ');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.price || formData.stock === '') {
      setError('Vui lòng điền đầy đủ tên, giá và số lượng kho');
      return;
    }

    setSubmitting(true);
    setError('');
    try {
      await onSubmit({
        ...formData,
        price: parseFloat(formData.price),
        originalPrice: formData.originalPrice ? parseFloat(formData.originalPrice) : parseFloat(formData.price),
        stock: parseInt(formData.stock, 10),
        categoryId: formData.categoryId ? Number(formData.categoryId) : null
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Lỗi khi lưu sản phẩm');
    } finally {
      setSubmitting(false);
    }
  };

  return (
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
    onClick={onClose}
    >
      <div
        className="fade-in"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          borderRadius: 'var(--radius-xl)',
          maxWidth: '680px',
          width: '100%',
          maxHeight: '92vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          padding: '2rem'
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: 'var(--bg-card-subtle)',
            borderRadius: 'var(--radius-full)',
            width: '36px',
            height: '36px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)'
          }}
        >
          <X size={20} />
        </button>

        <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.25rem' }}>
          {isEdit ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới vào kho'}
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Hỗ trợ tải ảnh trực tiếp từ máy tính lên máy chủ Spring Boot hoặc nhập link URL.
        </p>

        {error && (
          <div style={{
            background: 'var(--danger-light)',
            color: 'var(--danger)',
            padding: '0.75rem 1rem',
            borderRadius: 'var(--radius-md)',
            marginBottom: '1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            fontSize: '0.88rem',
            fontWeight: 600
          }}>
            <AlertCircle size={18} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Tên sản phẩm *
            </label>
            <input
              type="text"
              required
              placeholder="Ví dụ: iPhone 16 Pro Max 256GB"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Danh mục *
              </label>
              <select
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff'
                }}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Số lượng kho *
              </label>
              <input
                type="number"
                min="0"
                required
                value={formData.stock}
                onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Giá bán (VND) *
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                required
                placeholder="Ví dụ: 32990000"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                Giá gốc trước giảm (VND)
              </label>
              <input
                type="number"
                min="0"
                step="1000"
                placeholder="Ví dụ: 34990000"
                value={formData.originalPrice}
                onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)'
                }}
              />
            </div>
          </div>

          {/* Image Upload / URL Selector */}
          <div style={{
            background: '#f8fafc',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem' }}>
              <label style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Hình ảnh sản phẩm
              </label>
              <div style={{ display: 'flex', gap: '0.35rem', background: '#ffffff', padding: '3px', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: uploadMode === 'file' ? 'var(--primary)' : 'transparent',
                    color: uploadMode === 'file' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <UploadCloud size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Tải từ máy tính
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: 'var(--radius-sm)',
                    fontSize: '0.78rem',
                    fontWeight: 700,
                    backgroundColor: uploadMode === 'url' ? 'var(--primary)' : 'transparent',
                    color: uploadMode === 'url' ? '#ffffff' : 'var(--text-muted)'
                  }}
                >
                  <LinkIcon size={13} style={{ marginRight: '4px', verticalAlign: 'middle' }} />
                  Dán link URL
                </button>
              </div>
            </div>

            {uploadMode === 'file' ? (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/png, image/jpeg, image/jpg, image/webp, image/gif"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: '2px dashed var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '1.5rem',
                    textAlign: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#ffffff',
                    transition: 'all var(--transition-fast)'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--primary)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border)'}
                >
                  {uploading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--primary)' }}>
                      <RefreshCw size={28} className="spin" />
                      <span style={{ fontWeight: 600, fontSize: '0.88rem' }}>Đang tải ảnh lên máy chủ Spring Boot...</span>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
                      <UploadCloud size={32} color="var(--primary)" />
                      <div style={{ fontWeight: 600, color: 'var(--text-main)', fontSize: '0.9rem' }}>
                        Bấm vào đây để chọn file ảnh từ máy tính của bạn
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-light)' }}>
                        Định dạng hỗ trợ: JPG, PNG, WEBP, GIF (Tối đa 15MB)
                      </div>
                    </div>
                  )}
                </div>

                {uploadSuccess && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.82rem', fontWeight: 600, marginTop: '0.5rem' }}>
                    <CheckCircle2 size={16} /> Đã tải lên và lưu vào server thành công!
                  </div>
                )}
              </div>
            ) : (
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrl}
                onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                style={{
                  width: '100%',
                  padding: '0.65rem 0.85rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  backgroundColor: '#ffffff'
                }}
              />
            )}

            {/* Preview Thumbnail */}
            {formData.imageUrl && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginTop: '0.85rem', padding: '0.65rem', background: '#ffffff', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }}>
                <img
                  src={formData.imageUrl}
                  alt="Xem trước"
                  style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-main)' }}>Ảnh đang sử dụng:</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-light)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {formData.imageUrl}
                  </div>
                </div>
              </div>
            )}
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
              Mô tả chi tiết sản phẩm
            </label>
            <textarea
              rows="3"
              placeholder="Thông số kỹ thuật, tính năng nổi bật..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              style={{
                width: '100%',
                padding: '0.65rem 0.85rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                resize: 'vertical'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <input
              type="checkbox"
              id="featuredCheck"
              checked={formData.featured}
              onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
              style={{ width: '18px', height: '18px', accentColor: 'var(--primary)', cursor: 'pointer' }}
            />
            <label htmlFor="featuredCheck" style={{ fontSize: '0.9rem', fontWeight: 600, cursor: 'pointer' }}>
              Đánh dấu là Sản phẩm Nổi bật (Hiển thị huy hiệu trên trang chủ)
            </label>
          </div>

          <div style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
            marginTop: '1rem',
            paddingTop: '1rem',
            borderTop: '1px solid var(--border)'
          }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Hủy
            </button>
            <button type="submit" disabled={submitting || uploading} className="btn btn-primary">
              <Save size={18} />
              {submitting ? 'Đang lưu...' : (isEdit ? 'Cập nhật' : 'Thêm sản phẩm')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
