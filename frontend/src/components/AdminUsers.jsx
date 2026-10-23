import React, { useState, useEffect } from 'react';
import {
  Users,
  Shield,
  Search,
  RefreshCw,
  Crown,
  ShoppingBag,
  Mail,
  Phone,
  MapPin,
  Trash2,
  UserCheck,
  ArrowUpRight,
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminUsers({ currentUser, addToast }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [updatingId, setUpdatingId] = useState(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.getUsers();
      if (res.data) {
        setUsers(res.data);
      }
    } catch (err) {
      addToast('Lỗi tải danh sách khách hàng: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const formatVND = (price) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '—';
    }
  };

  const handleToggleRole = async (u) => {
    if (u.id === currentUser?.id) {
      addToast('Bạn không thể tự thay đổi quyền Quản trị viên của chính mình!', 'warning');
      return;
    }
    const nextRole = u.role === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    setUpdatingId(u.id);
    try {
      const res = await api.updateUserRole(u.id, nextRole);
      addToast(res.message || 'Đã cập nhật phân quyền tài khoản', 'success');
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Không thể cập nhật quyền', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteUser = async (id) => {
    setUpdatingId(id);
    try {
      const res = await api.deleteUser(id);
      addToast(res.message || 'Đã xóa tài khoản người dùng', 'success');
      setConfirmDeleteId(null);
      fetchUsers();
    } catch (err) {
      addToast(err.message || 'Không thể xóa tài khoản', 'error');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
    const q = searchTerm.trim().toLowerCase();
    const matchQuery =
      !q ||
      (u.fullName && u.fullName.toLowerCase().includes(q)) ||
      (u.username && u.username.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.phone && u.phone.includes(q));
    return matchRole && matchQuery;
  });

  const totalAdmins = users.filter((u) => u.role === 'ROLE_ADMIN').length;
  const vipCustomers = users.filter((u) => (u.totalSpent || 0) >= 20000000).length;
  const totalCustomerLTV = users.reduce((sum, u) => sum + (u.totalSpent || 0), 0);

  return (
    <div style={{ padding: '2rem 0 4rem' }}>
      {/* Header */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.65rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Quản Lý Khách Hàng & Phân Quyền (CRM)
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            Theo dõi lịch sử chi tiêu (LTV), thông tin liên hệ và cấp quyền Quản trị viên trên PostgreSQL
          </p>
        </div>

        <button onClick={fetchUsers} className="btn btn-secondary">
          <RefreshCw size={16} className={loading ? 'spin' : ''} /> Làm mới dữ liệu
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '1.75rem',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--primary-light)',
              color: 'var(--primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tổng tài khoản
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {users.length}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#fef3c7',
              color: '#d97706',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Crown size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Khách hàng VIP (≥ 20Tr)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#d97706' }}>
              {vipCustomers}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#ecfdf5',
              color: '#059669',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ShoppingBag size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Tổng chi tiêu tích lũy
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#059669' }}>
              {formatVND(totalCustomerLTV)}
            </div>
          </div>
        </div>

        <div
          style={{
            background: '#ffffff',
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem',
            border: '1px solid var(--border)',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
          }}
        >
          <div
            style={{
              width: '46px',
              height: '46px',
              borderRadius: 'var(--radius-md)',
              background: '#ede9fe',
              color: '#6d28d9',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Shield size={22} />
          </div>
          <div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              Quản trị viên (Admin)
            </div>
            <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#6d28d9' }}>
              {totalAdmins}
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          padding: '1rem 1.25rem',
          border: '1px solid var(--border)',
          marginBottom: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
          <Search
            size={17}
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
            placeholder="Tìm theo họ tên, username, email hoặc SĐT..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              width: '100%',
              padding: '0.55rem 0.9rem 0.55rem 2.35rem',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border)',
              fontSize: '0.88rem',
            }}
          />
        </div>

        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: `Tất cả (${users.length})` },
            { id: 'ROLE_ADMIN', label: `Quản trị viên (${totalAdmins})` },
            { id: 'ROLE_USER', label: `Khách hàng (${users.length - totalAdmins})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setRoleFilter(tab.id)}
              style={{
                padding: '0.5rem 0.95rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.84rem',
                fontWeight: 700,
                backgroundColor: roleFilter === tab.id ? 'var(--primary)' : '#f8fafc',
                color: roleFilter === tab.id ? '#ffffff' : 'var(--text-main)',
                border: `1px solid ${roleFilter === tab.id ? 'var(--primary)' : 'var(--border)'}`,
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Users Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto',
        }}
      >
        <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '880px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f8fafc', textAlign: 'left', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              <th style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border)' }}>KHÁCH HÀNG</th>
              <th style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)' }}>LIÊN HỆ & ĐỊA CHỈ</th>
              <th style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>ĐƠN ĐÃ MUA</th>
              <th style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>TỔNG CHI TIÊU (LTV)</th>
              <th style={{ padding: '0.9rem 1rem', borderBottom: '1px solid var(--border)', textAlign: 'center' }}>VAI TRÒ</th>
              <th style={{ padding: '0.9rem 1.25rem', borderBottom: '1px solid var(--border)', textAlign: 'right' }}>THAO TÁC</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Không tìm thấy tài khoản nào khớp với bộ lọc.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isUserAdmin = u.role === 'ROLE_ADMIN';
                const isVip = (u.totalSpent || 0) >= 20000000;

                return (
                  <tr
                    key={u.id}
                    style={{
                      borderBottom: '1px solid var(--border)',
                      backgroundColor: isSelf ? '#f8fafc' : '#ffffff',
                    }}
                  >
                    <td style={{ padding: '1rem 1.25rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: 'var(--radius-full)',
                            background: isUserAdmin
                              ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                              : 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.95rem',
                            flexShrink: 0,
                          }}
                        >
                          {(u.fullName || u.username || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.92rem' }}>
                              {u.fullName}
                            </span>
                            {isSelf && (
                              <span className="badge badge-primary" style={{ fontSize: '0.68rem' }}>
                                Bạn
                              </span>
                            )}
                            {isVip && (
                              <span
                                className="badge"
                                style={{
                                  backgroundColor: '#fef3c7',
                                  color: '#b45309',
                                  fontSize: '0.68rem',
                                  fontWeight: 800,
                                }}
                              >
                                <Crown size={11} /> VIP
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                            @{u.username} • Tham gia: {formatDate(u.createdAt)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td style={{ padding: '1rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: 'var(--text-main)', fontWeight: 600 }}>
                        <Mail size={13} color="var(--primary)" /> {u.email}
                      </div>
                      {u.phone && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '2px' }}>
                          <Phone size={13} /> {u.phone}
                        </div>
                      )}
                      {u.address && (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            marginTop: '2px',
                            maxWidth: '280px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                          title={u.address}
                        >
                          <MapPin size={13} /> {u.address}
                        </div>
                      )}
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                        {u.orderCount || 0}
                      </span>
                      <div style={{ fontSize: '0.72rem', color: 'var(--success)', fontWeight: 600 }}>
                        {u.completedOrderCount || 0} hoàn thành
                      </div>
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'right', fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                      {formatVND(u.totalSpent || 0)}
                    </td>

                    <td style={{ padding: '1rem', textAlign: 'center' }}>
                      <span
                        className={`badge ${isUserAdmin ? 'badge-warning' : 'badge-primary'}`}
                        style={{ fontWeight: 700 }}
                      >
                        <UserCheck size={12} /> {isUserAdmin ? 'ADMIN' : 'KHÁCH HÀNG'}
                      </span>
                    </td>

                    <td style={{ padding: '1rem 1.25rem', textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.45rem', alignItems: 'center' }}>
                        {!isSelf && (
                          <button
                            disabled={updatingId === u.id}
                            onClick={() => handleToggleRole(u)}
                            className="btn btn-secondary btn-sm"
                            style={{ fontSize: '0.76rem', padding: '0.35rem 0.65rem' }}
                            title={
                              isUserAdmin
                                ? 'Chuyển về tài khoản Khách hàng'
                                : 'Cấp quyền Quản trị viên (Admin)'
                            }
                          >
                            <ArrowUpRight size={13} />
                            {isUserAdmin ? 'Hạ xuống Khách' : 'Cấp quyền Admin'}
                          </button>
                        )}

                        {!isSelf &&
                          (confirmDeleteId === u.id ? (
                            <div style={{ display: 'flex', gap: '0.3rem' }}>
                              <button
                                disabled={updatingId === u.id}
                                onClick={() => handleDeleteUser(u.id)}
                                className="btn btn-sm"
                                style={{
                                  backgroundColor: 'var(--danger)',
                                  color: '#ffffff',
                                  fontSize: '0.74rem',
                                  padding: '0.35rem 0.6rem',
                                }}
                              >
                                Xác nhận xóa
                              </button>
                              <button
                                onClick={() => setConfirmDeleteId(null)}
                                className="btn btn-secondary btn-sm"
                                style={{ fontSize: '0.74rem', padding: '0.35rem 0.5rem' }}
                              >
                                Hủy
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteId(u.id)}
                              style={{
                                padding: '0.4rem',
                                borderRadius: 'var(--radius-sm)',
                                color: 'var(--danger)',
                                backgroundColor: 'var(--danger-light)',
                              }}
                              title="Xóa tài khoản"
                            >
                              <Trash2 size={15} />
                            </button>
                          ))}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
