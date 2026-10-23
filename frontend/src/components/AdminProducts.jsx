import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, RefreshCw } from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import { api } from '../services/api';

export default function AdminProducts({ categories, addToast }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        keyword: search,
        categoryId: selectedCat || null,
        size: 50 // fetch all for admin table
      });
      if (res.data) {
        setProducts(res.data.content || []);
      }
    } catch (err) {
      addToast('Lỗi khi tải danh sách sản phẩm: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCat]);

  const handleSaveProduct = async (formData) => {
    try {
      if (editProduct) {
        await api.updateProduct(editProduct.id, formData);
        addToast('Cập nhật sản phẩm thành công!', 'success');
      } else {
        await api.createProduct(formData);
        addToast('Thêm sản phẩm mới thành công!', 'success');
      }
      fetchProducts();
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa sản phẩm "${name}" khỏi kho không?`)) {
      return;
    }
    try {
      await api.deleteProduct(id);
      addToast('Đã xóa sản phẩm khỏi kho', 'success');
      fetchProducts();
    } catch (err) {
      addToast('Lỗi khi xóa sản phẩm: ' + err.message, 'error');
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Top Header */}
      <div style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
        margin: '1.5rem 0 2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Quản lý Kho Hàng & Sản phẩm
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Toàn bộ thao tác CRUD được đồng bộ hóa với MySQL Database qua Spring Boot REST API
          </p>
        </div>

        <button
          onClick={() => {
            setEditProduct(null);
            setModalOpen(true);
          }}
          className="btn btn-primary"
          style={{ padding: '0.75rem 1.25rem' }}
        >
          <Plus size={18} /> Thêm sản phẩm mới
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div style={{
        background: '#ffffff',
        padding: '1rem 1.25rem',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-sm)',
        display: 'flex',
        flexWrap: 'wrap',
        gap: '1rem',
        alignItems: 'center',
        marginBottom: '1.5rem'
      }}>
        <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
          <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-light)' }} />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mô tả sản phẩm..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.6rem 1rem 0.6rem 2.4rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: '#f8fafc'
            }}
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Filter size={16} color="var(--text-muted)" />
          <select
            value={selectedCat}
            onChange={(e) => setSelectedCat(e.target.value)}
            style={{
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              background: '#f8fafc',
              fontWeight: 600,
              color: 'var(--text-main)',
              cursor: 'pointer'
            }}
          >
            <option value="">Tất cả danh mục</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={fetchProducts}
          className="btn-icon"
          style={{ background: 'var(--bg-card-subtle)', color: 'var(--text-muted)' }}
          title="Làm mới dữ liệu"
        >
          <RefreshCw size={18} />
        </button>
      </div>

      {/* Products Table */}
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
                  Sản phẩm
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Danh mục
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Giá bán
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Tồn kho
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                  Trạng thái
                </th>
                <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    <RefreshCw size={24} className="spin" color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
                    <p>Đang tải dữ liệu kho...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Không có sản phẩm nào phù hợp.
                  </td>
                </tr>
              ) : (
                products.map((p) => (
                  <tr
                    key={p.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      transition: 'background-color var(--transition-fast)'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                  >
                    {/* Name & Thumbnail */}
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <img
                        src={p.imageUrl || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'}
                        alt={p.name}
                        style={{
                          width: '48px',
                          height: '48px',
                          borderRadius: 'var(--radius-sm)',
                          objectFit: 'cover',
                          backgroundColor: '#f1f5f9'
                        }}
                      />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                          {p.name}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
                          Mã ID: #{p.id} {p.featured && <span className="badge badge-warning" style={{ marginLeft: '4px' }}>Nổi bật</span>}
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td style={{ padding: '1rem' }}>
                      <span className="badge badge-primary">
                        {p.category?.name || 'Chưa phân loại'}
                      </span>
                    </td>

                    {/* Price */}
                    <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatVND(p.price)}
                    </td>

                    {/* Stock */}
                    <td style={{ padding: '1rem' }}>
                      {p.stock <= 0 ? (
                        <span className="badge badge-danger">Hết hàng (0)</span>
                      ) : p.stock <= 5 ? (
                        <span className="badge badge-warning">Sắp hết ({p.stock})</span>
                      ) : (
                        <span className="badge badge-success">Còn {p.stock} cái</span>
                      )}
                    </td>

                    {/* Status */}
                    <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                      {p.stock > 0 ? 'Đang mở bán' : 'Tạm ngưng'}
                    </td>

                    {/* Actions */}
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => {
                            setEditProduct(p);
                            setModalOpen(true);
                          }}
                          className="btn-icon"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            borderRadius: 'var(--radius-sm)',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Sửa sản phẩm"
                        >
                          <Edit2 size={16} />
                        </button>

                        <button
                          onClick={() => handleDelete(p.id, p.name)}
                          className="btn-icon"
                          style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            borderRadius: 'var(--radius-sm)',
                            width: '32px',
                            height: '32px'
                          }}
                          title="Xóa sản phẩm"
                        >
                          <Trash2 size={16} />
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

      {/* Form Modal */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveProduct}
        categories={categories}
        initialData={editProduct}
        isEdit={!!editProduct}
      />
    </div>
  );
}
