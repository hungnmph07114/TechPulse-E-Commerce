import React, { useState, useEffect } from 'react';
import {
  Plus, Edit2, Trash2, Search, Filter, RefreshCw, Package, FolderKanban, Tag, CheckCircle2, XCircle, Save, X
} from 'lucide-react';
import ProductFormModal from './ProductFormModal';
import { api } from '../services/api';

export default function AdminProducts({
  categories,
  onCategoriesChanged,
  initialSubTab = 'products',
  addToast,
}) {
  const [subTab, setSubTab] = useState(initialSubTab || 'products'); // 'products' | 'categories' | 'coupons'

  // Products state
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('');
  const [stockFilter, setStockFilter] = useState('all'); // 'all' | 'low' | 'out' | 'healthy'
  const [updatingStockId, setUpdatingStockId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editProduct, setEditProduct] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Categories state
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editCat, setEditCat] = useState(null);
  const [catForm, setCatForm] = useState({ name: '', slug: '', description: '' });
  const [deleteCatTarget, setDeleteCatTarget] = useState(null);

  // Coupons state
  const [coupons, setCoupons] = useState([]);
  const [couponModalOpen, setCouponModalOpen] = useState(false);
  const [editCoupon, setEditCoupon] = useState(null);
  const [couponForm, setCouponForm] = useState({
    code: '',
    description: '',
    discountType: 'PERCENT',
    discountValue: 10,
    minOrderAmount: 2000000,
    maxDiscountAmount: 1000000,
    usageLimit: 100,
    expiryDate: '2027-12-31',
    active: true,
  });

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await api.getProducts({
        keyword: search,
        categoryId: selectedCat || null,
        size: 100,
      });
      if (res.data) {
        setProducts(Array.isArray(res.data) ? res.data : (res.data.content || []));
      }
    } catch (err) {
      addToast('Lỗi khi tải danh sách sản phẩm: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoupons = async () => {
    try {
      const res = await api.getAllCoupons();
      if (res.data) {
        setCoupons(res.data);
      }
    } catch (err) {
      addToast('Lỗi tải danh sách mã giảm giá: ' + err.message, 'error');
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [search, selectedCat]);

  useEffect(() => {
    if (initialSubTab) {
      setSubTab(initialSubTab);
    }
  }, [initialSubTab]);

  useEffect(() => {
    if (subTab === 'coupons') {
      fetchCoupons();
    }
  }, [subTab]);

  // Product handlers
  const handleAdjustStock = async (product, delta) => {
    setUpdatingStockId(product.id);
    try {
      const res = await api.updateProductStock(product.id, { delta });
      if (res.data) {
        setProducts((prev) =>
          prev.map((item) => (item.id === product.id ? { ...item, stock: res.data.stock } : item))
        );
      }
      addToast(
        res.message || `Đã điều chỉnh tồn kho "${product.name}" (${delta > 0 ? `+${delta}` : delta})`,
        'success'
      );
    } catch (err) {
      addToast(err.message || 'Không thể điều chỉnh tồn kho', 'error');
    } finally {
      setUpdatingStockId(null);
    }
  };

  const handleSaveProduct = async (formData) => {
    if (editProduct) {
      await api.updateProduct(editProduct.id, formData);
      addToast('Cập nhật sản phẩm thành công!', 'success');
    } else {
      await api.createProduct(formData);
      addToast('Thêm sản phẩm mới thành công!', 'success');
    }
    fetchProducts();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await api.deleteProduct(deleteTarget.id);
      addToast(`Đã xóa sản phẩm "${deleteTarget.name}" khỏi kho`, 'success');
      setDeleteTarget(null);
      fetchProducts();
    } catch (err) {
      addToast('Lỗi khi xóa sản phẩm: ' + err.message, 'error');
    }
  };

  // Category handlers
  const openCreateCategory = () => {
    setEditCat(null);
    setCatForm({ name: '', slug: '', description: '' });
    setCatModalOpen(true);
  };

  const openEditCategory = (cat) => {
    setEditCat(cat);
    setCatForm({
      name: cat.name || '',
      slug: cat.slug || '',
      description: cat.description || '',
    });
    setCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    try {
      if (editCat) {
        await api.updateCategory(editCat.id, catForm);
        addToast('Cập nhật danh mục thành công!', 'success');
      } else {
        await api.createCategory(catForm);
        addToast('Tạo danh mục mới thành công!', 'success');
      }
      setCatModalOpen(false);
      if (onCategoriesChanged) onCategoriesChanged();
      fetchProducts();
    } catch (err) {
      addToast(err.message || 'Lỗi lưu danh mục', 'error');
    }
  };

  const confirmDeleteCategory = async () => {
    if (!deleteCatTarget) return;
    try {
      await api.deleteCategory(deleteCatTarget.id);
      addToast(`Đã xóa danh mục "${deleteCatTarget.name}"`, 'success');
      setDeleteCatTarget(null);
      if (onCategoriesChanged) onCategoriesChanged();
    } catch (err) {
      addToast(err.message || 'Không thể xóa danh mục', 'error');
      setDeleteCatTarget(null);
    }
  };

  // Coupon handlers
  const openCreateCoupon = () => {
    setEditCoupon(null);
    setCouponForm({
      code: '',
      description: '',
      discountType: 'PERCENT',
      discountValue: 10,
      minOrderAmount: 2000000,
      maxDiscountAmount: 1000000,
      usageLimit: 100,
      expiryDate: '2027-12-31',
      active: true,
    });
    setCouponModalOpen(true);
  };

  const openEditCoupon = (c) => {
    setEditCoupon(c);
    setCouponForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType || 'PERCENT',
      discountValue: c.discountValue || 0,
      minOrderAmount: c.minOrderAmount || 0,
      maxDiscountAmount: c.maxDiscountAmount || '',
      usageLimit: c.usageLimit || 100,
      expiryDate: c.expiryDate || '2027-12-31',
      active: c.active !== false,
    });
    setCouponModalOpen(true);
  };

  const handleSaveCoupon = async (e) => {
    e.preventDefault();
    try {
      if (editCoupon) {
        await api.updateCoupon(editCoupon.id, couponForm);
        addToast('Cập nhật mã giảm giá thành công!', 'success');
      } else {
        await api.createCoupon(couponForm);
        addToast('Tạo mã giảm giá mới thành công!', 'success');
      }
      setCouponModalOpen(false);
      fetchCoupons();
    } catch (err) {
      addToast(err.message || 'Lỗi khi lưu mã giảm giá', 'error');
    }
  };

  const handleToggleCouponActive = async (c) => {
    try {
      await api.updateCoupon(c.id, { active: !c.active });
      addToast(`Đã ${!c.active ? 'kích hoạt' : 'tạm ngưng'} mã ${c.code}`, 'info');
      fetchCoupons();
    } catch (err) {
      addToast(err.message || 'Lỗi cập nhật trạng thái mã', 'error');
    }
  };

  const handleDeleteCoupon = async (id, code) => {
    try {
      await api.deleteCoupon(id);
      addToast(`Đã xóa mã giảm giá ${code}`, 'success');
      fetchCoupons();
    } catch (err) {
      addToast(err.message || 'Lỗi xóa mã giảm giá', 'error');
    }
  };

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      price || 0
    );
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Top Header & Sub-navigation */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          margin: '1.5rem 0 1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Quản Trị Sản Phẩm, Danh Mục & Khuyến Mãi
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Mọi thay đổi được bảo vệ bởi phân quyền JWT Admin và tự động lưu trữ bền vững trên Server
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          {subTab === 'products' && (
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
          )}
          {subTab === 'categories' && (
            <button onClick={openCreateCategory} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <Plus size={18} /> Thêm danh mục mới
            </button>
          )}
          {subTab === 'coupons' && (
            <button onClick={openCreateCoupon} className="btn btn-primary" style={{ padding: '0.75rem 1.25rem' }}>
              <Plus size={18} /> Phát hành Mã giảm giá
            </button>
          )}
        </div>
      </div>

      {/* Sub-Tabs Selector */}
      <div
        style={{
          display: 'inline-flex',
          background: '#ffffff',
          padding: '5px',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
          gap: '4px',
        }}
      >
        <button
          onClick={() => setSubTab('products')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: subTab === 'products' ? 'var(--primary)' : 'transparent',
            color: subTab === 'products' ? '#ffffff' : 'var(--text-muted)',
          }}
        >
          <Package size={16} /> Sản phẩm ({products.length})
        </button>
        <button
          onClick={() => setSubTab('categories')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: subTab === 'categories' ? 'var(--primary)' : 'transparent',
            color: subTab === 'categories' ? '#ffffff' : 'var(--text-muted)',
          }}
        >
          <FolderKanban size={16} /> Danh mục ({categories.length})
        </button>
        <button
          onClick={() => setSubTab('coupons')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.55rem 1.1rem',
            borderRadius: 'var(--radius-md)',
            fontSize: '0.88rem',
            fontWeight: 700,
            background: subTab === 'coupons' ? 'var(--primary)' : 'transparent',
            color: subTab === 'coupons' ? '#ffffff' : 'var(--text-muted)',
          }}
        >
          <Tag size={16} /> Mã giảm giá / Voucher
        </button>
      </div>

      {/* ================= TAB 1: PRODUCTS ================= */}
      {subTab === 'products' && (
        <>
          <div
            style={{
              background: '#ffffff',
              padding: '1rem 1.25rem',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '1rem',
              alignItems: 'center',
              marginBottom: '1.5rem',
            }}
          >
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-light)',
                }}
              />
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
                  background: '#f8fafc',
                }}
              />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
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
                  cursor: 'pointer',
                }}
              >
                <option value="">Tất cả danh mục</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>

              <select
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
                style={{
                  padding: '0.6rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border)',
                  background: '#f8fafc',
                  fontWeight: 600,
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                <option value="all">Mọi mức tồn kho</option>
                <option value="low">Sắp hết hàng (≤ 5)</option>
                <option value="out">Đã hết hàng (0)</option>
                <option value="healthy">Tồn kho an toàn (&gt; 5)</option>
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

          <div
            style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              overflow: 'hidden',
            }}
          >
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
                      Tồn kho & Điều chỉnh nhanh
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
                  ) : (
                    (() => {
                      const filteredList = products.filter((p) => {
                        if (stockFilter === 'low') return p.stock > 0 && p.stock <= 5;
                        if (stockFilter === 'out') return p.stock <= 0;
                        if (stockFilter === 'healthy') return p.stock > 5;
                        return true;
                      });
                      if (filteredList.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                              Không có sản phẩm nào phù hợp với bộ lọc tồn kho hiện tại.
                            </td>
                          </tr>
                        );
                      }
                      return filteredList.map((p) => (
                        <tr
                          key={p.id}
                          style={{
                            borderBottom: '1px solid var(--border)',
                            transition: 'background-color var(--transition-fast)',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f8fafc')}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
                        >
                          <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                            <img
                              src={
                                p.imageUrl ||
                                'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=150&q=80'
                              }
                              alt={p.name}
                              style={{
                                width: '48px',
                                height: '48px',
                                borderRadius: 'var(--radius-sm)',
                                objectFit: 'cover',
                                backgroundColor: '#f1f5f9',
                              }}
                            />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                                {p.name}
                              </div>
                              <div style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '2px' }}>
                                Mã ID: #{p.id}{' '}
                                {p.featured && (
                                  <span className="badge badge-warning" style={{ marginLeft: '4px' }}>
                                    Nổi bật
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '1rem' }}>
                            <span className="badge badge-primary">
                              {p.category?.name || p.categoryName || 'Chưa phân loại'}
                            </span>
                          </td>

                          <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                            {formatVND(p.price)}
                          </td>

                          <td style={{ padding: '1rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                              {p.stock <= 0 ? (
                                <span className="badge badge-danger">Hết hàng (0)</span>
                              ) : p.stock <= 5 ? (
                                <span className="badge badge-warning">Sắp hết ({p.stock})</span>
                              ) : (
                                <span className="badge badge-success">Còn {p.stock} máy</span>
                              )}

                              <div style={{ display: 'inline-flex', gap: '3px' }}>
                                <button
                                  type="button"
                                  disabled={updatingStockId === p.id || p.stock <= 0}
                                  onClick={() => handleAdjustStock(p, -1)}
                                  style={{
                                    padding: '2px 7px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    borderRadius: '6px',
                                    border: '1px solid var(--border)',
                                    background: '#f8fafc',
                                    color: 'var(--text-main)',
                                    opacity: p.stock <= 0 ? 0.4 : 1,
                                  }}
                                  title="Giảm 1 tồn kho"
                                >
                                  -1
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingStockId === p.id}
                                  onClick={() => handleAdjustStock(p, 1)}
                                  style={{
                                    padding: '2px 7px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    borderRadius: '6px',
                                    border: '1px solid #c7d2fe',
                                    background: '#eef2ff',
                                    color: 'var(--primary)',
                                  }}
                                  title="Tăng 1 tồn kho"
                                >
                                  +1
                                </button>
                                <button
                                  type="button"
                                  disabled={updatingStockId === p.id}
                                  onClick={() => handleAdjustStock(p, 10)}
                                  style={{
                                    padding: '2px 7px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    borderRadius: '6px',
                                    border: '1px solid #a7f3d0',
                                    background: '#ecfdf5',
                                    color: '#059669',
                                  }}
                                  title="Nhập nhanh +10 sản phẩm vào kho"
                                >
                                  +10
                                </button>
                              </div>
                            </div>
                          </td>

                          <td style={{ padding: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                            {p.stock > 0 ? 'Đang mở bán' : 'Tạm ngưng'}
                          </td>

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
                                height: '32px',
                              }}
                              title="Sửa sản phẩm"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => setDeleteTarget({ id: p.id, name: p.name })}
                              className="btn-icon"
                              style={{
                                background: 'var(--danger-light)',
                                color: 'var(--danger)',
                                borderRadius: 'var(--radius-sm)',
                                width: '32px',
                                height: '32px',
                              }}
                              title="Xóa sản phẩm"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ));
                    })()
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ================= TAB 2: CATEGORIES ================= */}
      {subTab === 'categories' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    ID
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Tên danh mục
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Slug định danh
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Mô tả
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Số sản phẩm
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {categories.map((cat) => {
                  const count = products.filter((p) => p.category?.id === cat.id).length;
                  return (
                    <tr key={cat.id} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-muted)' }}>#{cat.id}</td>
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>{cat.name}</td>
                      <td style={{ padding: '1rem' }}>
                        <code style={{ background: '#f1f5f9', padding: '2px 6px', borderRadius: '4px', fontSize: '0.82rem' }}>
                          {cat.slug}
                        </code>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
                        {cat.description || '—'}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge badge-primary">{count} sản phẩm</span>
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                          <button
                            onClick={() => openEditCategory(cat)}
                            className="btn-icon"
                            style={{
                              background: 'var(--primary-light)',
                              color: 'var(--primary)',
                              borderRadius: 'var(--radius-sm)',
                              width: '32px',
                              height: '32px',
                            }}
                            title="Sửa danh mục"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => setDeleteCatTarget(cat)}
                            className="btn-icon"
                            style={{
                              background: 'var(--danger-light)',
                              color: 'var(--danger)',
                              borderRadius: 'var(--radius-sm)',
                              width: '32px',
                              height: '32px',
                            }}
                            title="Xóa danh mục"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 3: COUPONS / VOUCHERS ================= */}
      {subTab === 'coupons' && (
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            overflow: 'hidden',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--border)' }}>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Mã Voucher
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Mức giảm
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Đơn tối thiểu
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Lượt dùng
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)' }}>
                    Trạng thái
                  </th>
                  <th style={{ padding: '1rem', fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', textAlign: 'right' }}>
                    Thao tác
                  </th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {c.code}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{c.description}</div>
                    </td>
                    <td style={{ padding: '1rem', fontWeight: 700 }}>
                      {c.discountType === 'PERCENT' ? (
                        <span>
                          Giảm {c.discountValue}%{' '}
                          {c.maxDiscountAmount ? `(Tối đa ${formatVND(c.maxDiscountAmount)})` : ''}
                        </span>
                      ) : (
                        <span>Giảm {formatVND(c.discountValue)}</span>
                      )}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.88rem' }}>
                      {formatVND(c.minOrderAmount)}
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.88rem', fontWeight: 600 }}>
                      {c.usedCount} / {c.usageLimit}
                    </td>
                    <td style={{ padding: '1rem' }}>
                      <button
                        type="button"
                        onClick={() => handleToggleCouponActive(c)}
                        className={`badge ${c.active ? 'badge-success' : 'badge-danger'}`}
                        style={{ cursor: 'pointer' }}
                        title="Bấm để Bật / Tắt mã giảm giá"
                      >
                        {c.active ? (
                          <>
                            <CheckCircle2 size={12} /> Đang kích hoạt
                          </>
                        ) : (
                          <>
                            <XCircle size={12} /> Tạm ngưng
                          </>
                        )}
                      </button>
                    </td>
                    <td style={{ padding: '1rem', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', gap: '0.4rem' }}>
                        <button
                          onClick={() => openEditCoupon(c)}
                          className="btn-icon"
                          style={{
                            background: 'var(--primary-light)',
                            color: 'var(--primary)',
                            borderRadius: 'var(--radius-sm)',
                            width: '32px',
                            height: '32px',
                          }}
                          title="Chỉnh sửa Voucher"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          onClick={() => handleDeleteCoupon(c.id, c.code)}
                          className="btn-icon"
                          style={{
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            borderRadius: 'var(--radius-sm)',
                            width: '32px',
                            height: '32px',
                          }}
                          title="Xóa Voucher"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Product Form Modal */}
      <ProductFormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSaveProduct}
        categories={categories}
        initialData={editProduct}
        isEdit={!!editProduct}
      />

      {/* Category Modal */}
      {catModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
          onClick={() => setCatModalOpen(false)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '460px',
              width: '100%',
              padding: '2rem',
              position: 'relative',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <button
              onClick={() => setCatModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-full)',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
              {editCat ? 'Cập nhật Danh mục' : 'Thêm Danh mục mới'}
            </h3>

            <form onSubmit={handleSaveCategory} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Tên danh mục *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Thiết bị Mạng & SmartHome"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Slug định danh
                </label>
                <input
                  type="text"
                  placeholder="VD: smarthome"
                  value={catForm.slug}
                  onChange={(e) => setCatForm({ ...catForm, slug: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '4px' }}>
                  Mô tả ngắn
                </label>
                <textarea
                  rows={2}
                  placeholder="Mô tả các dòng sản phẩm trong danh mục..."
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setCatModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Lưu danh mục
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coupon Modal */}
      {couponModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
          onClick={() => setCouponModalOpen(false)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '520px',
              width: '100%',
              padding: '2rem',
              position: 'relative',
              boxShadow: 'var(--shadow-xl)',
            }}
          >
            <button
              onClick={() => setCouponModalOpen(false)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'var(--bg-card-subtle)',
                borderRadius: 'var(--radius-full)',
                width: '34px',
                height: '34px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <X size={18} />
            </button>

            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem' }}>
              {editCoupon ? `Cập nhật Mã ${editCoupon.code}` : 'Phát hành Mã Giảm Giá Mới'}
            </h3>

            <form onSubmit={handleSaveCoupon} style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Mã Code (Viết hoa) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="VD: SUMMER500K"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      fontWeight: 700,
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Loại giảm giá
                  </label>
                  <select
                    value={couponForm.discountType}
                    onChange={(e) => setCouponForm({ ...couponForm, discountType: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                      background: '#ffffff',
                      fontWeight: 600,
                    }}
                  >
                    <option value="PERCENT">Theo phần trăm (%)</option>
                    <option value="FIXED">Số tiền cố định (VND)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    {couponForm.discountType === 'PERCENT' ? 'Phần trăm giảm (%) *' : 'Số tiền giảm (VND) *'}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={couponForm.discountValue}
                    onChange={(e) => setCouponForm({ ...couponForm, discountValue: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Đơn hàng tối thiểu (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={couponForm.minOrderAmount}
                    onChange={(e) => setCouponForm({ ...couponForm, minOrderAmount: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Giảm tối đa (VND)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="50000"
                    placeholder="Không giới hạn"
                    value={couponForm.maxDiscountAmount || ''}
                    onChange={(e) =>
                      setCouponForm({
                        ...couponForm,
                        maxDiscountAmount: e.target.value ? Number(e.target.value) : null,
                      })
                    }
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                    Giới hạn tổng lượt dùng
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={couponForm.usageLimit}
                    onChange={(e) => setCouponForm({ ...couponForm, usageLimit: Number(e.target.value) })}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border)',
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  Mô tả điều kiện ưu đãi *
                </label>
                <input
                  type="text"
                  required
                  placeholder="VD: Giảm 10% tối đa 1.500.000đ cho đơn từ 5.000.000đ"
                  value={couponForm.description}
                  onChange={(e) => setCouponForm({ ...couponForm, description: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.6rem 0.85rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)',
                  }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setCouponModalOpen(false)} className="btn btn-secondary">
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary">
                  <Save size={16} /> Lưu Mã Giảm Giá
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Product Confirmation Modal */}
      {deleteTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Xác nhận xóa sản phẩm
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa sản phẩm <strong>"{deleteTarget.name}"</strong> khỏi kho hàng không?
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeleteTarget(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Hủy
              </button>
              <button type="button" onClick={confirmDelete} className="btn btn-danger" style={{ flex: 1 }}>
                Xóa sản phẩm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {deleteCatTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 110,
            padding: '1.5rem',
          }}
          onClick={() => setDeleteCatTarget(null)}
        >
          <div
            className="fade-in"
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: 'var(--radius-xl)',
              maxWidth: '420px',
              width: '100%',
              padding: '1.75rem',
              boxShadow: 'var(--shadow-xl)',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-full)',
                background: 'var(--danger-light)',
                color: 'var(--danger)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <Trash2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Xóa danh mục "{deleteCatTarget.name}"?
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
              Lưu ý: Chỉ có thể xóa danh mục khi không còn sản phẩm nào thuộc danh mục này.
            </p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
              <button type="button" onClick={() => setDeleteCatTarget(null)} className="btn btn-secondary" style={{ flex: 1 }}>
                Hủy
              </button>
              <button type="button" onClick={confirmDeleteCategory} className="btn btn-danger" style={{ flex: 1 }}>
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
