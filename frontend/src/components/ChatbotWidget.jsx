import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Truck,
  RotateCcw,
  Zap,
} from 'lucide-react';
import { api } from '../services/api';

const INITIAL_MESSAGE = {
  role: 'model',
  text: 'Xin chào! Mình là Trợ lý Tư vấn & Hỗ trợ Đơn hàng của TechPulse Store. Bạn cần tư vấn chọn mua sản phẩm, săn mã giảm giá hay kiểm tra tiến trình vận đơn (ORD-...)?',
};

const QUICK_PROMPTS = [
  'Tư vấn điện thoại flagship dưới 35 triệu',
  'Hiện có những mã giảm giá (Voucher) nào?',
  'Chính sách vận chuyển & bảo hành thế nào?',
];

export default function ChatbotWidget({ onOpenTrackOrder }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [modelType, setModelType] = useState('standard'); // 'standard' (gemini-3.8-flash) | 'fast' (gemini-3.1-flash-lite)
  const threadEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && threadEndRef.current) {
      threadEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textOverride) => {
    const textToSend = (textOverride !== undefined ? textOverride : input).trim();
    if (!textToSend || loading) return;

    const userMsg = { role: 'user', text: textToSend };
    const prevHistory = [...messages];
    setMessages((prev) => [...prev, userMsg]);
    if (textOverride === undefined) setInput('');
    setLoading(true);

    try {
      const res = await api.sendChatMessage({
        message: textToSend,
        history: prevHistory,
        modelType,
      });

      if (res.data) {
        setMessages((prev) => [
          ...prev,
          {
            role: 'model',
            text: res.data.reply,
            matchedOrder: res.data.matchedOrder || null,
          },
        ]);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          text:
            'Hệ thống tư vấn đang bận xử lý. Bạn có thể bấm nút "Theo dõi vận đơn" để tra cứu đơn hàng ngay lập tức nhé!',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 95 }}>
      {isOpen ? (
        <div
          className="fade-in"
          style={{
            width: '370px',
            maxWidth: 'calc(100vw - 32px)',
            height: '520px',
            maxHeight: 'calc(100vh - 90px)',
            backgroundColor: '#ffffff',
            borderRadius: 'var(--radius-xl)',
            boxShadow: 'var(--shadow-xl)',
            border: '1px solid var(--border)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Chat Header */}
          <div
            style={{
              background: 'linear-gradient(135deg, #1e1b4b 0%, #4f46e5 100%)',
              color: '#ffffff',
              padding: '0.9rem 1.1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '999px',
                  backgroundColor: 'rgba(255,255,255,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={19} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.9rem', lineHeight: 1.2 }}>
                  Tư Vấn Viên TechPulse
                </div>
                <div style={{ fontSize: '0.7rem', color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <span
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '999px',
                      backgroundColor: '#10b981',
                    }}
                  />
                  Trực tuyến 24/7 • Kho PostgreSQL
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <button
                type="button"
                onClick={() =>
                  setModelType((prev) => (prev === 'standard' ? 'fast' : 'standard'))
                }
                title={
                  modelType === 'fast'
                    ? 'Đang bật chế độ Phản hồi siêu tốc (Flash Lite)'
                    : 'Đang bật chế độ Tư vấn chuyên sâu (Flash)'
                }
                style={{
                  padding: '3px 7px',
                  borderRadius: '999px',
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  backgroundColor:
                    modelType === 'fast' ? '#f59e0b' : 'rgba(255,255,255,0.18)',
                  color: '#ffffff',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
              >
                <Zap size={11} /> {modelType === 'fast' ? 'Siêu tốc' : 'Tiêu chuẩn'}
              </button>

              <button
                type="button"
                onClick={() => setMessages([INITIAL_MESSAGE])}
                title="Làm mới hội thoại"
                style={{
                  color: 'rgba(255,255,255,0.8)',
                  padding: '4px',
                  borderRadius: '999px',
                }}
              >
                <RotateCcw size={15} />
              </button>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                title="Thu gọn"
                style={{
                  color: '#ffffff',
                  padding: '4px',
                  borderRadius: '999px',
                }}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Scrollable Message Thread */}
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '1rem',
              backgroundColor: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            {messages.map((m, idx) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.45rem',
                      flexDirection: isUser ? 'row-reverse' : 'row',
                      maxWidth: '88%',
                    }}
                  >
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '999px',
                        backgroundColor: isUser ? 'var(--primary)' : '#e0e7ff',
                        color: isUser ? '#ffffff' : 'var(--primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        marginTop: '2px',
                      }}
                    >
                      {isUser ? <User size={14} /> : <Sparkles size={14} />}
                    </div>

                    <div
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: 'var(--radius-lg)',
                        backgroundColor: isUser ? 'var(--primary)' : '#ffffff',
                        color: isUser ? '#ffffff' : 'var(--text-main)',
                        border: isUser ? 'none' : '1px solid var(--border)',
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        whiteSpace: 'pre-line',
                        boxShadow: 'var(--shadow-xs)',
                      }}
                    >
                      {m.text}

                      {m.matchedOrder && onOpenTrackOrder && (
                        <div style={{ marginTop: '0.6rem', paddingTop: '0.5rem', borderTop: '1px dashed var(--border)' }}>
                          <button
                            type="button"
                            onClick={() => onOpenTrackOrder(m.matchedOrder.orderCode)}
                            className="btn btn-primary btn-sm"
                            style={{ width: '100%', fontSize: '0.76rem', padding: '0.4rem 0.65rem' }}
                          >
                            <Truck size={13} /> Xem tiến trình đơn {m.matchedOrder.orderCode}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                <Loader2 size={15} className="spin" color="var(--primary)" />
                <span>Đang tra cứu dữ liệu sản phẩm & đơn hàng...</span>
              </div>
            )}

            <div ref={threadEndRef} />
          </div>

          {/* Quick Suggestion Chips */}
          <div
            style={{
              padding: '0.45rem 0.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.35rem',
              overflowX: 'auto',
            }}
          >
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={() => onOpenTrackOrder('')}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 700,
                  backgroundColor: 'var(--primary-light)',
                  color: 'var(--primary)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
              >
                <Truck size={11} /> Theo dõi đơn
              </button>
            )}
            {QUICK_PROMPTS.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => handleSend(qp)}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: '999px',
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  backgroundColor: '#f1f5f9',
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                  flexShrink: 0,
                }}
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            style={{
              padding: '0.65rem 0.75rem',
              backgroundColor: '#ffffff',
              borderTop: '1px solid var(--border)',
              display: 'flex',
              gap: '0.45rem',
            }}
          >
            <input
              type="text"
              placeholder="Nhập câu hỏi hoặc mã đơn ORD-..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{
                flex: 1,
                padding: '0.55rem 0.8rem',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border)',
                fontSize: '0.84rem',
                backgroundColor: '#f8fafc',
              }}
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="btn btn-primary"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '999px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.55rem',
            padding: '0.75rem 1.15rem',
            borderRadius: '999px',
            background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
            color: '#ffffff',
            fontWeight: 700,
            fontSize: '0.88rem',
            boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)',
            border: '1px solid rgba(255,255,255,0.25)',
          }}
        >
          <MessageSquare size={19} />
          <span>Tư vấn & Tra cứu đơn</span>
        </button>
      )}
    </div>
  );
}
