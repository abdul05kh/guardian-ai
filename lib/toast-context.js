'use client';
import { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback((message, type = 'info', duration = 3000) => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duration);
  }, []);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div style={{
        position: 'fixed',
        bottom: '24px',
        right: '24px',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        pointerEvents: 'none'
      }}>
        {toasts.map((toast) => (
          <div key={toast.id} style={{
            background: 'var(--bg-tertiary)',
            border: `1px solid ${
              toast.type === 'success' ? 'var(--success)' : 
              toast.type === 'error' ? 'var(--danger)' : 
              toast.type === 'warning' ? 'var(--warning)' : 'var(--border-accent)'
            }`,
            color: 'var(--text-primary)',
            padding: '16px 24px',
            borderRadius: 'var(--radius-md)',
            boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            pointerEvents: 'auto',
            animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            minWidth: '250px'
          }}>
            <span style={{
              color: toast.type === 'success' ? 'var(--success-glow)' : 
                     toast.type === 'error' ? 'var(--danger-glow)' : 
                     toast.type === 'warning' ? 'var(--warning-glow)' : 'var(--blue-glow)'
            }}>
              {toast.type === 'success' ? '✓' : 
               toast.type === 'error' ? '✕' : 
               toast.type === 'warning' ? '⚠️' : 'ℹ'}
            </span>
            <span style={{ fontSize: '14px', fontWeight: 500 }}>{toast.message}</span>
            <button 
              onClick={() => removeToast(toast.id)}
              style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                fontSize: '18px'
              }}
            >×</button>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast must be used within ToastProvider');
  return context;
}
