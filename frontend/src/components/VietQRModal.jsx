import React, { useState, useEffect, useRef } from 'react';
import {
  X, Copy, Check, QrCode, ShieldCheck, Clock,
  CheckCircle2, Building2, Sparkles, Loader2, Zap, ArrowRight
} from 'lucide-react';
import { getActiveBankConfig } from '../config/bankConfig';
import { api } from '../services/api';

export default function VietQRModal({
  isOpen,
  onClose,
  order,
  onConfirmPaid,
  addToast
}) {
  const [copiedField, setCopiedField] = useState(null);
  const [timeLeft, setTimeLeft] = useState(900); // 15 mins countdown
  const [isPaidSuccess, setIsPaidSuccess] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const pollTimerRef = useRef(null);

  // Play synthesized joyful chime via Web Audio API
  const playSuccessSound = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';

      const now = ctx.currentTime;
      // Melody: C5 (523Hz) -> E5 (659Hz) -> G5 (784Hz) -> C6 (1046Hz)
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.1);
      osc.frequency.setValueAtTime(783.99, now + 0.2);
      osc.frequency.setValueAtTime(1046.50, now + 0.32);

      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.75);

      osc.start(now);
      osc.stop(now + 0.75);
    } catch {
      // Audio autoplay policy or not supported
    }
  };

  // Reset state & start polling when modal opens
  useEffect(() => {
    if (!isOpen || !order) {
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      return;
    }

    // Check if order is already completed
    if (order.status === 'COMPLETED') {
      setIsPaidSuccess(true);
    } else {
      setIsPaidSuccess(false);
    }

    setTimeLeft(900);

    // Countdown interval
    const countdownInterval = setInterval(() => {
      setTimeLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Real-time Polling for Webhook confirmation every 2.5 seconds
    pollTimerRef.current = setInterval(async () => {
      try {
        const res = await api.checkPaymentStatus(order.id);
        if (res.data && res.data.isPaid) {
          setIsPaidSuccess(true);
          playSuccessSound();
          if (addToast) {
            addToast(`Thanh toán thành công đơn hàng ${order.orderCode}!`, 'success');
          }
          if (onConfirmPaid) {
            onConfirmPaid({ ...order, status: 'COMPLETED' });
          }
          clearInterval(pollTimerRef.current);
        }
      } catch {
        // Transient error ignored during polling
      }
    }, 2500);

    return () => {
      clearInterval(countdownInterval);
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, [isOpen, order?.id]);

  if (!isOpen || !order) return null;

  const bankConfig = getActiveBankConfig();
  const amount = Math.round(order.totalAmount || 0);
  const addInfo = encodeURIComponent(order.orderCode || 'THANHTOAN');
  const accountNameEncoded = encodeURIComponent(bankConfig.accountName);

  const qrImageUrl = `https://img.vietqr.io/image/${bankConfig.bankId}-${bankConfig.accountNo}-${bankConfig.template}.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountNameEncoded}`;

  const formatVND = (val) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val);
  };

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = (text, fieldName) => {
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    if (addToast) addToast(`Đã sao chép ${fieldName}`, 'success');
    setTimeout(() => {
      setCopiedField(null);
    }, 2000);
  };

  // Dev simulation handler
  const handleSimulateTransfer = async () => {
    try {
      setIsSimulating(true);
      const res = await api.simulateTransfer(order.id);
      if (res.success) {
        setIsPaidSuccess(true);
        playSuccessSound();
        if (addToast) {
          addToast('Giả lập thành công: Đơn hàng đã tự động xác nhận!', 'success');
        }
        if (onConfirmPaid) {
          onConfirmPaid({ ...order, status: 'COMPLETED' });
        }
        if (pollTimerRef.current) clearInterval(pollTimerRef.current);
      }
    } catch (err) {
      if (addToast) addToast(err.message || 'Lỗi giả lập', 'error');
    } finally {
      setIsSimulating(false);
    }
  };

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
        zIndex: 110,
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
          maxWidth: '540px',
          width: '100%',
          maxHeight: '94vh',
          overflowY: 'auto',
          position: 'relative',
          boxShadow: 'var(--shadow-xl)',
          padding: '2rem'
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

        {/* ================= SUCCESS STATE ================= */}
        {isPaidSuccess ? (
          <div style={{ textAlign: 'center', padding: '1.5rem 0.5rem' }} className="fade-in">
            {/* Glowing Success Badge */}
            <div style={{
              width: '88px',
              height: '88px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem auto',
              boxShadow: '0 0 35px rgba(16, 185, 129, 0.45)',
              animation: 'bounce 1.2s infinite alternate ease-in-out'
            }}>
              <CheckCircle2 size={52} strokeWidth={2.5} />
            </div>

            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#ecfdf5',
              color: '#059669',
              padding: '0.4rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '0.85rem',
              fontWeight: 800,
              marginBottom: '0.75rem',
              border: '1px solid #a7f3d0'
            }}>
              <Sparkles size={16} /> THANH TOÁN THÀNH CÔNG (TỰ ĐỘNG)
            </div>

            <h3 style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
              Giao Dịch Đã Hoàn Tất!
            </h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
              Hệ thống đã tự động nhận diện thanh toán qua Webhook VietQR cho đơn hàng của bạn.
            </p>

            {/* Receipt Summary Card */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              textAlign: 'left',
              marginBottom: '1.5rem'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Mã đơn hàng:</span>
                <span style={{ fontWeight: 800, color: 'var(--primary)' }}>{order.orderCode}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Khách hàng:</span>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{order.customerName}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.4rem 0', borderBottom: '1px solid #e2e8f0', fontSize: '0.88rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Phương thức:</span>
                <span style={{ fontWeight: 700, color: '#059669' }}>VietQR Tự Động (Napas 247)</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0 0 0', fontSize: '1.05rem' }}>
                <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>Tổng thanh toán:</span>
                <span style={{ fontWeight: 800, color: 'var(--success)', fontSize: '1.2rem' }}>{formatVND(amount)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                if (onConfirmPaid) onConfirmPaid({ ...order, status: 'COMPLETED' });
                onClose();
              }}
              className="btn btn-primary btn-lg"
              style={{ width: '100%', gap: '0.5rem' }}
            >
              Hoàn Tất & Xem Đơn Hàng <ArrowRight size={18} />
            </button>
          </div>
        ) : (
          /* ================= PENDING / QR SCANNING STATE ================= */
          <div>
            {/* Modal Header */}
            <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                padding: '0.35rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                fontSize: '0.8rem',
                fontWeight: 700,
                marginBottom: '0.5rem'
              }}>
                <QrCode size={15} /> Thanh Toán Chuyển Khoản VietQR (NAPAS 247)
              </div>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
                Quét Mã QR Để Thanh Toán
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                Mở ứng dụng Ngân hàng (App Banking) bất kỳ để quét mã tự động điền số tiền và nội dung
              </p>
            </div>

            {/* Realtime Waiting & Countdown Status Bar */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#f0fdf4',
              border: '1px solid #bbf7d0',
              padding: '0.6rem 1rem',
              borderRadius: 'var(--radius-md)',
              marginBottom: '1rem',
              fontSize: '0.82rem'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#166534', fontWeight: 700 }}>
                <span style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  backgroundColor: '#16a34a',
                  display: 'inline-block',
                  animation: 'ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite'
                }}></span>
                Đang chờ thanh toán tự động...
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#d97706', fontWeight: 700 }}>
                <Clock size={14} />
                <span>{formatTime(timeLeft)}</span>
              </div>
            </div>

            {/* QR Code Container */}
            <div style={{
              background: '#f8fafc',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
            }}>
              <img
                src={qrImageUrl}
                alt="Mã VietQR"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: 'auto',
                  borderRadius: 'var(--radius-md)',
                  boxShadow: 'var(--shadow-md)',
                  backgroundColor: '#ffffff'
                }}
              />
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.75rem' }}>
                <ShieldCheck size={14} color="var(--success)" />
                Xác nhận tự động qua Webhook SePay / PayOS
              </div>
            </div>

            {/* Transfer Details with 1-click Copy */}
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
              marginTop: '1.25rem',
              fontSize: '0.88rem'
            }}>
              {/* Bank */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ngân hàng thụ hưởng</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{bankConfig.bankName}</div>
                </div>
                <Building2 size={20} color="var(--text-light)" />
              </div>

              {/* Account Number */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Số tài khoản</div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--primary)' }}>{bankConfig.accountNo}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(bankConfig.accountNo, 'Số tài khoản')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  {copiedField === 'Số tài khoản' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  {copiedField === 'Số tài khoản' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              {/* Account Name */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Chủ tài khoản</div>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{bankConfig.accountName}</div>
                </div>
              </div>

              {/* Amount */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: '#f8fafc',
                borderRadius: 'var(--radius-md)',
                border: '1px solid var(--border)'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Số tiền thanh toán</div>
                  <div style={{ fontWeight: 800, fontSize: '1.15rem', color: 'var(--success)' }}>{formatVND(amount)}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(amount.toString(), 'Số tiền')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.65rem' }}
                >
                  {copiedField === 'Số tiền' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  {copiedField === 'Số tiền' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>

              {/* Order Memo */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.65rem 0.85rem',
                background: '#fef2f2',
                borderRadius: 'var(--radius-md)',
                border: '1px solid #fecaca'
              }}>
                <div>
                  <div style={{ fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>Nội dung chuyển tiền (Bắt buộc giữ nguyên)</div>
                  <div style={{ fontWeight: 800, color: '#991b1b', fontSize: '1.05rem' }}>{order.orderCode}</div>
                </div>
                <button
                  onClick={() => copyToClipboard(order.orderCode, 'Nội dung chuyển khoản')}
                  className="btn btn-secondary btn-sm"
                  style={{ padding: '0.35rem 0.65rem', background: '#ffffff', borderColor: '#fca5a5', color: '#b91c1c' }}
                >
                  {copiedField === 'Nội dung chuyển khoản' ? <Check size={14} color="var(--success)" /> : <Copy size={14} />}
                  {copiedField === 'Nội dung chuyển khoản' ? 'Đã chép' : 'Sao chép'}
                </button>
              </div>
            </div>

            {/* Developer / Demo Instant Test Simulation Box */}
            <div style={{
              marginTop: '1.25rem',
              padding: '0.85rem',
              borderRadius: 'var(--radius-md)',
              border: '1px dashed #cbd5e1',
              backgroundColor: '#f8fafc',
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                🧪 <strong>Chế độ Kiểm thử (Demo):</strong> Bấm nút dưới để giả lập webhook ngân hàng bắn tiền về ngay lập tức:
              </div>
              <button
                onClick={handleSimulateTransfer}
                disabled={isSimulating}
                className="btn btn-outline btn-sm"
                style={{
                  width: '100%',
                  borderColor: '#8b5cf6',
                  color: '#6d28d9',
                  background: '#faf5ff',
                  fontWeight: 700
                }}
              >
                {isSimulating ? (
                  <>
                    <Loader2 size={14} className="spin" /> Đang kích hoạt Webhook...
                  </>
                ) : (
                  <>
                    <Zap size={15} color="#8b5cf6" /> Giả lập Webhook Chuyển Khoản Thành Công
                  </>
                )}
              </button>
            </div>

            {/* Actions */}
            <div style={{
              display: 'flex',
              gap: '0.75rem',
              marginTop: '1.25rem',
              paddingTop: '1rem',
              borderTop: '1px solid var(--border)'
            }}>
              <button onClick={onClose} className="btn btn-secondary" style={{ flex: 1 }}>
                Đóng
              </button>
              <button
                onClick={() => {
                  if (onConfirmPaid) onConfirmPaid(order);
                  onClose();
                }}
                className="btn btn-primary"
                style={{ flex: 1.5 }}
              >
                <CheckCircle2 size={16} /> Tôi đã chuyển tiền
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
