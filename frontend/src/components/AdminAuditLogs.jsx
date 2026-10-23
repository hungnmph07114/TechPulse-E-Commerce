import React, { useState, useEffect } from 'react';
import {
  History,
  Search,
  RefreshCw,
  Download,
  Package,
  FileText,
  MessageSquare,
  ShieldCheck,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { api } from '../services/api';

const CATEGORY_META = {
  ALL: { label: 'Tất cả sự kiện', color: '#475569' },
  INVENTORY: { label: 'Biến động Tồn kho', color: '#0284c7' },
  ORDER: { label: 'Vận đơn & Xuất/Hoàn kho', color: '#059669' },
  PRODUCT: { label: 'Danh mục Sản phẩm', color: '#4f46e5' },
  REVIEW: { label: 'Kiểm duyệt Đánh giá', color: '#d97706' },
  SECURITY: { label: 'Phân quyền & Bảo mật', color: '#dc2626' },
};

export default function AdminAuditLogs({ addToast }) {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminAuditLogs('ALL');
      if (Array.isArray(res.data)) {
        setLogs(res.data);
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Không thể tải nhật ký hệ thống', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatDateTime = (iso) => {
    if (!iso) return '—';
    try {
      return new Date(iso).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const filteredLogs = logs.filter((log) => {
    if (categoryFilter !== 'ALL' && log.category !== categoryFilter) return false;
    if (searchQuery.trim() !== '') {
      const q = searchQuery.trim().toLowerCase();
      return (
        (log.id || '').toLowerCase().includes(q) ||
        (log.targetName || '').toLowerCase().includes(q) ||
        (log.actor || '').toLowerCase().includes(q) ||
        (log.action || '').toLowerCase().includes(q) ||
        (log.details || '').toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleExportAuditCsv = () => {
    if (filteredLogs.length === 0) {
      if (addToast) addToast('Không có dữ liệu nhật ký để xuất CSV', 'warning');
      return;
    }

    const headers = [
      'Ma_Audit',
      'Thoi_Gian',
      'Phan_Loai',
      'Hanh_Dong',
      'Nguoi_Thuc_Hien',
      'Doi_Tuong',
      'Ton_Truoc',
      'Ton_Sau',
      'Chenh_Lech',
      'Chi_Tiet',
    ];

    const rows = filteredLogs.map((l) => [
      l.id,
      formatDateTime(l.createdAt),
      l.category,
      l.action,
      `"${(l.actor || '').replace(/"/g, '""')}"`,
      `"${(l.targetName || '').replace(/"/g, '""')}"`,
      l.prevStock ?? '',
      l.newStock ?? '',
      l.delta ?? '',
      `"${(l.details || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute(
      'download',
      `TechPulse_Audit_Inventory_Log_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    if (addToast) addToast('Đã xuất file CSV Nhật ký Biến động Tồn kho & Audit!', 'success');
  };

  // Summary counts
  const totalStockInEvents = logs.filter((l) => typeof l.delta === 'number' && l.delta > 0).length;
  const totalStockOutEvents = logs.filter((l) => typeof l.delta === 'number' && l.delta < 0).length;
  const totalAdminSecurityEvents = logs.filter(
    (l) => l.category === 'REVIEW' || l.category === 'SECURITY' || l.category === 'PRODUCT'
  ).length;

  return (
    <div className="fade-in" style={{ paddingTop: '1rem', paddingBottom: '2.5rem' }}>
      {/* Top Summary Strip */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
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
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            TỔNG BẢN GHI NHẬT KÝ (AUDIT LOGS)
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
            {logs.length}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Lưu trữ đối soát theo thời gian thực
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
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            LƯỢT NHẬP KHO / HOÀN KHO (+)
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: 'var(--success)',
              marginTop: '0.3rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            +{totalStockInEvents}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Nhập hàng nhanh & hoàn kho khi hủy đơn
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
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            LƯỢT XUẤT KHO BÁN HÀNG (-)
          </div>
          <div
            style={{
              fontSize: '1.75rem',
              fontWeight: 800,
              color: '#0284c7',
              marginTop: '0.3rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            {totalStockOutEvents}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Khấu trừ kho tự động theo mã vận đơn
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
          <div style={{ fontSize: '0.76rem', fontWeight: 700, color: 'var(--text-muted)' }}>
            THAO TÁC QUẢN TRỊ & KIỂM DUYỆT
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
            {totalAdminSecurityEvents}
          </div>
          <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Phân quyền RBAC, sản phẩm & đánh giá
          </div>
        </div>
      </div>

      {/* Filter & Export Controls */}
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
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const active = categoryFilter === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setCategoryFilter(key)}
                style={{
                  padding: '0.45rem 0.85rem',
                  borderRadius: '8px',
                  fontSize: '0.79rem',
                  fontWeight: active ? 700 : 600,
                  backgroundColor: active ? 'var(--primary)' : '#f1f5f9',
                  color: active ? '#ffffff' : 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {meta.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', minWidth: '240px' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '11px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
              }}
            />
            <input
              type="text"
              placeholder="Tìm SKU, mã đơn ORD-..., người thực hiện..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem 0.8rem 0.5rem 2.1rem',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)',
                backgroundColor: '#f8fafc',
                fontSize: '0.82rem',
              }}
            />
          </div>

          <button
            type="button"
            onClick={fetchLogs}
            className="btn btn-secondary btn-sm"
            style={{ padding: '0.5rem 0.85rem' }}
          >
            <RefreshCw size={14} className={loading ? 'spin' : ''} /> Làm mới
          </button>

          <button
            type="button"
            onClick={handleExportAuditCsv}
            className="btn btn-primary btn-sm"
            style={{ padding: '0.5rem 0.95rem' }}
          >
            <Download size={14} /> Xuất Audit CSV
          </button>
        </div>
      </div>

      {/* Audit Log Data Table */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: 'var(--radius-lg)',
          border: '1px solid var(--border)',
          overflow: 'hidden',
        }}
      >
        <div style={{ overflowX: 'auto' }}>
          <table
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              fontSize: '0.84rem',
              fontVariantNumeric: 'tabular-nums',
            }}
          >
            <thead>
              <tr
                style={{
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid var(--border)',
                  textAlign: 'left',
                  color: 'var(--text-muted)',
                  fontSize: '0.75rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.04em',
                }}
              >
                <th style={{ padding: '0.85rem 1rem' }}>Mã / Thời gian</th>
                <th style={{ padding: '0.85rem 1rem' }}>Phân loại</th>
                <th style={{ padding: '0.85rem 1rem' }}>Người thực hiện</th>
                <th style={{ padding: '0.85rem 1rem' }}>Đối tượng / Sản phẩm</th>
                <th style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>Biến động Kho</th>
                <th style={{ padding: '0.85rem 1rem' }}>Chi tiết Nghiệp vụ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Đang tải dữ liệu nhật ký hệ thống...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                    Không có bản ghi nhật ký nào khớp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const hasDelta = typeof log.delta === 'number' && log.delta !== 0;
                  const isPositive = (log.delta || 0) > 0;

                  return (
                    <tr
                      key={log.id}
                      style={{
                        borderBottom: '1px solid #f1f5f9',
                      }}
                    >
                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 800, fontFamily: 'monospace', color: 'var(--text-main)' }}>
                          {log.id}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          {formatDateTime(log.createdAt)}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', whiteSpace: 'nowrap' }}>
                        <div
                          style={{
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            color: CATEGORY_META[log.category]?.color || 'var(--text-main)',
                          }}
                        >
                          {CATEGORY_META[log.category]?.label || log.category}
                        </div>
                        <div style={{ fontSize: '0.72rem', fontFamily: 'monospace', color: 'var(--text-muted)' }}>
                          {log.action}
                        </div>
                      </td>

                      <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        {log.actor}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', maxWidth: '280px' }}>
                        <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{log.targetName}</div>
                        {log.targetId && (
                          <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
                            Ref: {log.targetId}
                          </div>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', textAlign: 'right', whiteSpace: 'nowrap' }}>
                        {hasDelta ? (
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '2px',
                                fontWeight: 800,
                                color: isPositive ? 'var(--success)' : 'var(--danger)',
                              }}
                            >
                              {isPositive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                              {isPositive ? `+${log.delta}` : log.delta} SP
                            </span>
                            {log.prevStock !== null &&
                              log.prevStock !== undefined &&
                              log.newStock !== null &&
                              log.newStock !== undefined && (
                                <div style={{ fontSize: '0.73rem', color: 'var(--text-muted)' }}>
                                  Kho: {log.prevStock} → <strong>{log.newStock}</strong>
                                </div>
                              )}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-light)' }}>—</span>
                        )}
                      </td>

                      <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', lineHeight: 1.45 }}>
                        {log.details}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
