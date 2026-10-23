import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ toasts, removeToast }) {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.75rem',
      zIndex: 9999,
      pointerEvents: 'none'
    }}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className="fade-in"
          style={{
            pointerEvents: 'auto',
            minWidth: '300px',
            maxWidth: '420px',
            padding: '0.9rem 1.1rem',
            background: '#ffffff',
            borderRadius: 'var(--radius-md)',
            boxShadow: 'var(--shadow-xl)',
            borderLeft: `4px solid ${
              t.type === 'error' ? 'var(--danger)' :
              t.type === 'warning' ? 'var(--warning)' : 'var(--success)'
            }`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '0.75rem',
            border: '1px solid var(--border)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {t.type === 'error' ? (
              <AlertCircle size={20} color="var(--danger)" />
            ) : t.type === 'warning' ? (
              <Info size={20} color="var(--warning)" />
            ) : (
              <CheckCircle2 size={20} color="var(--success)" />
            )}
            <span style={{ fontSize: '0.88rem', fontWeight: 500, color: 'var(--text-main)' }}>
              {t.message}
            </span>
          </div>
          <button
            onClick={() => removeToast(t.id)}
            style={{ color: 'var(--text-light)', padding: '2px' }}
          >
            <X size={16} />
          </button>
        </div>
      ))}
    </div>
  );
}
