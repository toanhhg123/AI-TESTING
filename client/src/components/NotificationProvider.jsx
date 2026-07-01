import React, { createContext, useContext, useState, useCallback } from 'react';
import { AlertTriangle, CheckCircle, Info, X, XCircle } from 'lucide-react';

const NotificationContext = createContext(null);

export function NotificationProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const [confirmConfig, setConfirmConfig] = useState(null); // { title, message, onConfirm, onCancel }

  const showToast = useCallback((message, type = 'success') => {
    const id = Date.now() + Math.random().toString();
    setToasts((current) => [...current, { id, message, type }]);

    // Auto dismiss after 3 seconds
    setTimeout(() => {
      setToasts((current) => current.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const showConfirm = useCallback((title, message) => {
    return new Promise((resolve) => {
      setConfirmConfig({
        title,
        message,
        onConfirm: () => {
          setConfirmConfig(null);
          resolve(true);
        },
        onCancel: () => {
          setConfirmConfig(null);
          resolve(false);
        },
      });
    });
  }, []);

  return (
    <NotificationContext.Provider value={{ showToast, showConfirm }}>
      {children}

      {/* Dynamic Toasts list rendering */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast-card toast-${t.type}`}>
            {t.type === 'success' && <CheckCircle size={18} />}
            {t.type === 'error' && <XCircle size={18} />}
            {t.type === 'warning' && <AlertTriangle size={18} />}
            {t.type === 'info' && <Info size={18} />}
            <span className="toast-message">{t.message}</span>
            <button
              className="toast-close-btn"
              type="button"
              onClick={() => setToasts((current) => current.filter((item) => item.id !== t.id))}
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Dynamic Custom Confirm dialog rendering */}
      {confirmConfig && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-card">
            <h4 className="confirm-modal-title">{confirmConfig.title}</h4>
            <p className="confirm-modal-message">{confirmConfig.message}</p>
            <div className="confirm-modal-actions">
              <button
                className="confirm-modal-btn cancel"
                type="button"
                onClick={confirmConfig.onCancel}
              >
                Hủy
              </button>
              <button
                className="confirm-modal-btn confirm"
                type="button"
                onClick={confirmConfig.onConfirm}
              >
                Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}
