import React, { useState, useEffect } from 'react';
import { DollarSign, ShoppingBag, FolderKanban, AlertTriangle, Clock, CheckCircle2, TrendingUp, RefreshCw, ArrowRight, Building2 } from 'lucide-react';
import { api } from '../services/api';
import BankSettingsModal from './BankSettingsModal';
import { getActiveBankConfig } from '../config/bankConfig';

export default function Dashboard({ setActiveTab, addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const bankConfig = getActiveBankConfig();

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await api.getStats();
      if (res.data) {
        setStats(res.data);
      }
    } catch (err) {
      addToast('Lỗi khi tải thống kê: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price || 0);
  };

  return (
    <div style={{ paddingBottom: '3rem' }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '1.5rem 0 2rem'
      }}>
        <div>
          <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Trung Tâm Thống Kê & Báo Cáo
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '4px' }}>
            Tổng quan doanh thu, số lượng đơn hàng và tình trạng tồn kho hệ thống
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '0.65rem 1rem' }}
          >
            <Building2 size={16} color="var(--primary)" /> Cài đặt Ngân hàng VietQR
          </button>
          <button onClick={fetchStats} className="btn btn-secondary" style={{ padding: '0.65rem 1rem' }}>
            <RefreshCw size={16} /> Làm mới
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw size={32} className="spin" color="var(--primary)" style={{ margin: '0 auto 0.5rem' }} />
          <p>Đang tổng hợp số liệu từ MySQL...</p>
        </div>
      ) : (
        <>
          {/* Current Bank Alert Banner */}
          <div style={{
            background: '#ffffff',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '38px',
                height: '38px',
                borderRadius: 'var(--radius-md)',
                background: '#ecfdf5',
                color: '#059669',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <Building2 size={20} />
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>TÀI KHOẢN NHẬN TIỀN VIETQR HIỆN TẠI:</div>
                <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.95rem' }}>
                  {bankConfig.bankName} — Số TK: <span style={{ color: 'var(--primary)' }}>{bankConfig.accountNo}</span> ({bankConfig.accountName})
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsBankModalOpen(true)}
              className="btn btn-secondary btn-sm"
              style={{ fontWeight: 700 }}
            >
              Thay đổi tài khoản
            </button>
          </div>

          {/* Metrics Grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            marginBottom: '2rem'
          }}>
            {/* Revenue */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)'
              }}>
                <DollarSign size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Tổng Doanh Thu
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {formatVND(stats?.totalRevenue)}
                </div>
              </div>
            </div>

            {/* Total Orders */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px var(--primary-glow)'
              }}>
                <ShoppingBag size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Tổng Đơn Hàng
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {stats?.totalOrders || 0} đơn
                </div>
              </div>
            </div>

            {/* Total Products */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(6, 182, 212, 0.3)'
              }}>
                <FolderKanban size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Sản phẩm trong kho
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '2px' }}>
                  {stats?.totalProducts || 0} ({stats?.totalCategories || 0} danh mục)
                </div>
              </div>
            </div>

            {/* Low stock alerts */}
            <div style={{
              background: '#ffffff',
              borderRadius: 'var(--radius-lg)',
              padding: '1.5rem',
              border: '1px solid var(--border)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem'
            }}>
              <div style={{
                width: '52px',
                height: '52px',
                borderRadius: 'var(--radius-md)',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)'
              }}>
                <AlertTriangle size={26} />
              </div>
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Cảnh báo sắp hết hàng
                </div>
                <div style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--warning)', marginTop: '2px' }}>
                  {stats?.lowStockProducts || 0} sản phẩm
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Shortcuts */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => setActiveTab('admin-products')}
              className="btn btn-primary"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              Đi tới Quản lý Kho Hàng <ArrowRight size={16} />
            </button>
            <button
              onClick={() => setActiveTab('admin-orders')}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.25rem' }}
            >
              Kiểm tra Đơn hàng mới ({stats?.pendingOrders || 0} đang chờ)
            </button>
            <button
              onClick={() => setIsBankModalOpen(true)}
              className="btn btn-secondary"
              style={{ padding: '0.75rem 1.25rem', background: '#ecfdf5', color: '#059669', borderColor: '#a7f3d0' }}
            >
              <Building2 size={16} /> Cài đặt Tài khoản Ngân hàng (VietQR)
            </button>
          </div>
        </>
      )}

      {/* Bank Settings Modal */}
      <BankSettingsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        addToast={addToast}
      />
    </div>
  );
}
