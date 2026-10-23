import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  ShoppingBag,
  FolderKanban,
  AlertTriangle,
  Clock,
  RefreshCw,
  ArrowRight,
  Building2,
  Tag,
  TrendingUp,
  PackagePlus,
  Download,
  BarChart3,
  CreditCard,
  Award,
  Layers,
  CheckCircle2,
} from 'lucide-react';
import { api } from '../services/api';
import BankSettingsModal from './BankSettingsModal';
import { getActiveBankConfig } from '../config/bankConfig';

export default function Dashboard({ setActiveTab, onNavigateModule, addToast }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [restockingId, setRestockingId] = useState(null);
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
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(
      price || 0
    );
  };

  const handleQuickRestock = async (product, delta = 15) => {
    setRestockingId(product.id);
    try {
      const res = await api.updateProductStock(product.id, { delta });
      addToast(
        res.message || `Đã nhập thêm +${delta} sản phẩm cho "${product.name}"`,
        'success'
      );
      await fetchStats();
    } catch (err) {
      addToast(err.message || 'Không thể cập nhật tồn kho', 'error');
    } finally {
      setRestockingId(null);
    }
  };

  const handleExportReportCSV = () => {
    if (!stats) return;
    const rows = [
      ['CHỈ SỐ BÁO CÁO TÀI CHÍNH & KHO VẬN TECHPULSE', 'GIÁ TRỊ'],
      ['Tổng doanh thu (Gross Revenue)', stats.totalRevenue || 0],
      ['Doanh thu thực nhận (Completed)', stats.completedRevenue || 0],
      ['Doanh thu chờ thu (Pending/Processing)', stats.pendingRevenue || 0],
      ['Giá trị trung bình mỗi đơn (AOV)', stats.averageOrderValue || 0],
      ['Tổng chiết khấu Voucher đã cấp', stats.totalDiscountGiven || 0],
      ['Tổng số đơn hàng', stats.totalOrders || 0],
      ['Đơn hoàn tất', stats.completedOrders || 0],
      ['Đơn chờ xử lý', stats.pendingOrders || 0],
      ['Đơn đang giao', stats.processingOrders || 0],
      ['Đơn đã hủy', stats.cancelledOrders || 0],
      ['Tổng số mã sản phẩm (SKU)', stats.totalProducts || 0],
      ['Tổng số lượng thiết bị tồn kho', stats.totalInventoryUnits || 0],
      ['Tổng giá trị tồn kho (VNĐ)', stats.totalInventoryValue || 0],
      [],
      ['DOANH THU THEO DANH MỤC', 'DOANH THU (VND)', 'SỐ LƯỢNG BÁN', 'SỐ SP', 'TỒN KHO'],
      ...(stats.revenueByCategory || []).map((c) => [
        c.categoryName,
        c.revenue,
        c.unitsSold,
        c.productCount,
        c.stockUnits,
      ]),
    ];

    const csvContent =
      '\uFEFF' +
      rows
        .map((e) => e.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','))
        .join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `TechPulse_Revenue_Report_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast('Đã xuất báo cáo doanh thu & tồn kho ra file CSV!', 'success');
  };

  const navigateTo = (tab, subTab = null) => {
    if (onNavigateModule) {
      onNavigateModule(tab, subTab);
    } else if (setActiveTab) {
      setActiveTab(tab);
    }
  };

  const totalRev = stats?.totalRevenue || 0;
  const maxCategoryRev = Math.max(
    1,
    ...((stats?.revenueByCategory || []).map((c) => c.revenue) || [1])
  );

  return (
    <div style={{ paddingBottom: '3rem' }}>
      {/* Top Action Bar */}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          margin: '1rem 0 1.5rem',
        }}
      >
        <div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Phân Tích Doanh Thu & Quản Trị Kho Vận
          </h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginTop: '4px' }}>
            Dữ liệu thời gian thực từ Cloud SQL PostgreSQL: Doanh thu, tỷ trọng danh mục, định giá kho và hiệu quả Voucher
          </p>
        </div>

        <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
          <button
            onClick={handleExportReportCSV}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 0.95rem', fontSize: '0.84rem' }}
          >
            <Download size={15} color="var(--primary)" /> Xuất Báo Cáo CSV
          </button>
          <button
            onClick={() => setIsBankModalOpen(true)}
            className="btn btn-secondary"
            style={{ padding: '0.6rem 0.95rem', fontSize: '0.84rem' }}
          >
            <Building2 size={15} color="#059669" /> Cấu hình VietQR
          </button>
          <button
            onClick={fetchStats}
            className="btn btn-primary"
            style={{ padding: '0.6rem 1rem', fontSize: '0.84rem' }}
          >
            <RefreshCw size={15} /> Làm mới dữ liệu
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '4rem', textAlign: 'center', color: 'var(--text-muted)' }}>
          <RefreshCw
            size={32}
            className="spin"
            color="var(--primary)"
            style={{ margin: '0 auto 0.5rem' }}
          />
          <p>Đang tổng hợp dữ liệu phân tích doanh thu & kho hàng...</p>
        </div>
      ) : (
        <>
          {/* Quick Management Shortcuts Bar */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 55%, #4338ca 100%)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.15rem 1.4rem',
              marginBottom: '1.5rem',
              color: '#ffffff',
              display: 'flex',
              flexWrap: 'wrap',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              boxShadow: '0 10px 25px -5px rgba(49, 46, 129, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.14)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUp size={22} color="#38bdf8" />
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#cbd5e1', fontWeight: 600 }}>
                  TRUNG TÂM ĐIỀU HÀNH NHANH • VIETQR: {bankConfig.bankName} ({bankConfig.accountNo})
                </div>
                <div style={{ fontSize: '1rem', fontWeight: 800, marginTop: '2px' }}>
                  Thao tác nhanh Kho hàng, Sản phẩm, Mã giảm giá & Đơn vận chuyển
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.55rem', flexWrap: 'wrap' }}>
              <button
                onClick={() => navigateTo('admin-products', 'products')}
                className="btn btn-sm"
                style={{
                  background: '#ffffff',
                  color: '#1e1b4b',
                  fontWeight: 700,
                  padding: '0.5rem 0.9rem',
                }}
              >
                <FolderKanban size={14} /> Quản lý Sản phẩm & Kho
              </button>
              <button
                onClick={() => navigateTo('admin-products', 'coupons')}
                className="btn btn-sm"
                style={{
                  background: 'rgba(255, 255, 255, 0.14)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  fontWeight: 700,
                  padding: '0.5rem 0.9rem',
                }}
              >
                <Tag size={14} color="#fbbf24" /> Quản lý Voucher ({stats?.activeCoupons || 0})
              </button>
              <button
                onClick={() => navigateTo('admin-orders')}
                className="btn btn-sm"
                style={{
                  background: 'rgba(16, 185, 129, 0.25)',
                  color: '#6ee7b7',
                  border: '1px solid rgba(16, 185, 129, 0.4)',
                  fontWeight: 700,
                  padding: '0.5rem 0.9rem',
                }}
              >
                <ShoppingBag size={14} /> Duyệt Đơn ({stats?.pendingOrders || 0} chờ)
              </button>
            </div>
          </div>

          {/* Primary 6-Card Executive KPI Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(235px, 1fr))',
              gap: '1.1rem',
              marginBottom: '1.75rem',
            }}
          >
            {/* Gross Revenue & AOV */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Tổng Doanh Thu (Gross)
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-main)', marginTop: '4px' }}>
                    {formatVND(stats?.totalRevenue || 0)}
                  </div>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--primary-light)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <BarChart3 size={22} />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                Giá trị đơn TB (AOV): <strong>{formatVND(stats?.averageOrderValue || 0)}</strong>
              </div>
            </div>

            {/* Completed Revenue */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Doanh Thu Thực Nhận
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--success)', marginTop: '4px' }}>
                    {formatVND(stats?.completedRevenue || 0)}
                  </div>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--success-light)',
                    color: 'var(--success)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <DollarSign size={22} />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                Từ <strong>{stats?.completedOrders || 0}</strong> đơn hàng đã hoàn tất
              </div>
            </div>

            {/* Pending Revenue */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Doanh Thu Chờ Thu
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4f46e5', marginTop: '4px' }}>
                    {formatVND(stats?.pendingRevenue || 0)}
                  </div>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#eef2ff',
                    color: '#4f46e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Clock size={22} />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                <strong>{stats?.pendingOrders || 0}</strong> chờ duyệt •{' '}
                <strong>{stats?.processingOrders || 0}</strong> đang giao
              </div>
            </div>

            {/* Inventory Valuation */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Tổng Giá Trị Tồn Kho
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#0891b2', marginTop: '4px' }}>
                    {formatVND(stats?.totalInventoryValue || 0)}
                  </div>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#ecfeff',
                    color: '#0891b2',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Layers size={22} />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                <strong>{stats?.totalInventoryUnits || 0}</strong> máy thuộc{' '}
                <strong>{stats?.totalProducts || 0}</strong> mã SP
              </div>
            </div>

            {/* Voucher & Promotion Impact */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Chiết Khấu Voucher
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#db2777', marginTop: '4px' }}>
                    {formatVND(stats?.totalDiscountGiven || 0)}
                  </div>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: '#fdf2f8',
                    color: '#db2777',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Tag size={22} />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                Đang kích hoạt <strong>{stats?.activeCoupons || 0}</strong> / {stats?.totalCoupons || 0} mã KM
              </div>
            </div>

            {/* Low stock alerts */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                padding: '1.25rem',
                border: '1px solid var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: '0.74rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                    Cảnh Báo Tồn Kho Thấp
                  </div>
                  <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--warning)', marginTop: '4px' }}>
                    {stats?.lowStockProducts || 0} sản phẩm
                  </div>
                </div>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '10px',
                    background: 'var(--warning-light)',
                    color: 'var(--warning)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AlertTriangle size={22} />
                </div>
              </div>
              <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '0.65rem' }}>
                Ngưỡng cảnh báo: Tồn kho ≤ 5 máy
              </div>
            </div>
          </div>

          {/* Analytics Row 1: Category Revenue Chart + Payment Method & Order Pipeline */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.75rem',
            }}
          >
            {/* Revenue by Category Breakdown */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.15rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <BarChart3 size={18} color="var(--primary)" /> Doanh Thu & Tồn Kho Theo Danh Mục
                </h3>
                <button
                  onClick={() => navigateTo('admin-products', 'categories')}
                  style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}
                >
                  Quản lý danh mục →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {(stats?.revenueByCategory || []).map((cat, idx) => {
                  const pctOfMax = Math.round((cat.revenue / maxCategoryRev) * 100);
                  const sharePct =
                    totalRev > 0 ? ((cat.revenue / totalRev) * 100).toFixed(1) : '0.0';
                  const colors = [
                    'linear-gradient(90deg, #4f46e5, #06b6d4)',
                    'linear-gradient(90deg, #059669, #10b981)',
                    'linear-gradient(90deg, #d97706, #f59e0b)',
                    'linear-gradient(90deg, #db2777, #f43f5e)',
                    'linear-gradient(90deg, #7c3aed, #a855f7)',
                  ];
                  return (
                    <div key={cat.categoryName}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'baseline',
                          marginBottom: '0.35rem',
                          fontSize: '0.85rem',
                        }}
                      >
                        <div>
                          <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                            {cat.categoryName}
                          </span>
                          <span
                            style={{
                              fontSize: '0.75rem',
                              color: 'var(--text-muted)',
                              marginLeft: '0.5rem',
                            }}
                          >
                            ({cat.unitsSold} đã bán • Kho còn {cat.stockUnits} máy)
                          </span>
                        </div>
                        <div style={{ fontWeight: 800, color: 'var(--primary)' }}>
                          {formatVND(cat.revenue)}{' '}
                          <span
                            style={{
                              fontSize: '0.74rem',
                              color: 'var(--text-muted)',
                              fontWeight: 600,
                            }}
                          >
                            ({sharePct}%)
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: '9px',
                          borderRadius: '999px',
                          background: '#f1f5f9',
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${Math.max(cat.revenue > 0 ? 6 : 2, pctOfMax)}%`,
                            height: '100%',
                            borderRadius: '999px',
                            background: colors[idx % colors.length],
                            transition: 'width 0.4s ease',
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Order Status Pipeline & Payment Breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  padding: '1.4rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.9rem',
                  }}
                >
                  <h3
                    style={{
                      fontSize: '1.02rem',
                      fontWeight: 800,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}
                  >
                    <ShoppingBag size={18} color="var(--primary)" /> Trạng Thái Xử Lý Đơn Hàng ({stats?.totalOrders || 0})
                  </h3>
                  <button
                    onClick={() => navigateTo('admin-orders')}
                    style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}
                  >
                    Mở QL Đơn →
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.65rem' }}>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--warning-light)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b45309' }}>
                      CHỜ DUYỆT
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--warning)' }}>
                      {stats?.pendingOrders || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--primary-light)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--primary)' }}>
                      ĐANG GIAO
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {stats?.processingOrders || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--success-light)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#047857' }}>
                      HOÀN TẤT
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--success)' }}>
                      {stats?.completedOrders || 0}
                    </div>
                  </div>
                  <div
                    style={{
                      padding: '0.75rem',
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--danger-light)',
                      textAlign: 'center',
                    }}
                  >
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: '#b91c1c' }}>
                      ĐÃ HỦY
                    </div>
                    <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--danger)' }}>
                      {stats?.cancelledOrders || 0}
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method Breakdown */}
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: 'var(--radius-lg)',
                  border: '1px solid var(--border)',
                  padding: '1.4rem',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    marginBottom: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CreditCard size={18} color="#059669" /> Cơ Cấu Kênh Thanh Toán
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  {(stats?.paymentMethodBreakdown || []).map((pm) => {
                    const labels = {
                      BANK: 'VietQR Ngân hàng',
                      MOMO: 'Ví điện tử MoMo',
                      COD: 'Tiền mặt (COD)',
                    };
                    return (
                      <div
                        key={pm.method}
                        style={{
                          padding: '0.8rem',
                          borderRadius: 'var(--radius-md)',
                          background: '#f8fafc',
                          border: '1px solid var(--border)',
                        }}
                      >
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)' }}>
                          {labels[pm.method] || pm.method}
                        </div>
                        <div
                          style={{
                            fontSize: '0.98rem',
                            fontWeight: 800,
                            color: 'var(--text-main)',
                            marginTop: '4px',
                          }}
                        >
                          {formatVND(pm.revenue)}
                        </div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--primary)', fontWeight: 600 }}>
                          {pm.count} đơn hàng
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Row 2: Top Selling Products & Low Stock Instant Restock */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {/* Top Selling Products */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <Award size={18} color="#f59e0b" /> Top Sản Phẩm Doanh Thu Cao Nhất
                </h3>
                <button
                  onClick={() => navigateTo('admin-products', 'products')}
                  style={{ fontSize: '0.78rem', color: 'var(--primary)', fontWeight: 700 }}
                >
                  Xem toàn bộ kho →
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {(stats?.topSellingProducts || []).map((prod, idx) => (
                  <div
                    key={prod.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.75rem',
                      padding: '0.65rem 0.85rem',
                      borderRadius: 'var(--radius-md)',
                      background: '#f8fafc',
                      border: '1px solid var(--border)',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                      <span
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '50%',
                          background: idx < 3 ? 'var(--primary)' : '#cbd5e1',
                          color: idx < 3 ? '#ffffff' : '#1e293b',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        {idx + 1}
                      </span>
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.86rem',
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {prod.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {prod.categoryName} • Đã bán: <strong>{prod.unitsSold}</strong> • Tồn:{' '}
                          <strong>{prod.stock}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontWeight: 800, fontSize: '0.88rem', color: 'var(--success)' }}>
                        {formatVND(prod.revenue)}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                        Đơn giá: {formatVND(prod.price)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Low Stock Products with 1-Click Restock */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border)',
                padding: '1.5rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                }}
              >
                <h3
                  style={{
                    fontSize: '1.05rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertTriangle size={18} color="var(--warning)" /> Cảnh Báo Tồn Kho & Nhập Hàng Nhanh
                </h3>
                <span className="badge badge-warning">Tồn ≤ 5</span>
              </div>

              {stats?.lowStockList?.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {stats.lowStockList.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        gap: '0.75rem',
                        padding: '0.7rem 0.85rem',
                        background: '#fffbeb',
                        borderRadius: 'var(--radius-md)',
                        border: '1px solid #fde68a',
                      }}
                    >
                      <div style={{ minWidth: 0 }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.88rem',
                            color: 'var(--text-main)',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {item.name}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          {item.categoryName} • {formatVND(item.price)}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexShrink: 0 }}>
                        <span
                          className={`badge ${
                            item.stock <= 0 ? 'badge-danger' : 'badge-warning'
                          }`}
                        >
                          Còn {item.stock}
                        </span>
                        <button
                          onClick={() => handleQuickRestock(item, 15)}
                          disabled={restockingId === item.id}
                          className="btn btn-primary btn-sm"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                          }}
                          title="Nhập nhanh thêm 15 sản phẩm vào kho"
                        >
                          <PackagePlus size={13} />
                          {restockingId === item.id ? 'Đang nhập...' : '+15 Kho'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    padding: '2.5rem 1.5rem',
                    textAlign: 'center',
                    color: 'var(--success)',
                    background: '#ecfdf5',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid #a7f3d0',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  <CheckCircle2 size={28} style={{ margin: '0 auto 0.5rem' }} />
                  Tất cả sản phẩm trong kho đều đạt mức tồn kho an toàn (&gt; 5 thiết bị).
                </div>
              )}
            </div>
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
