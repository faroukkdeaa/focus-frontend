import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';
import { useTheme } from './ThemeContext';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 3200;

const TYPE_META = {
  success: {
    Icon: CheckCircle2,
    getStyle: (C) => ({
      icon: C.green,
      iconBg: C.greenDim,
      iconBorder: C.greenBorder,
      border: C.greenBorder,
      title: C.textPrimary,
      message: C.textMuted,
    }),
  },
  error: {
    Icon: AlertTriangle,
    getStyle: (C) => ({
      icon: C.redIcon,
      iconBg: C.redDim,
      iconBorder: C.redBorder,
      border: C.redBorder,
      title: C.textPrimary,
      message: C.textMuted,
    }),
  },
  info: {
    Icon: Info,
    getStyle: (C) => ({
      icon: C.iconA,
      iconBg: C.iconBgA,
      iconBorder: C.iconBorderA,
      border: C.borderAccent,
      title: C.textPrimary,
      message: C.textMuted,
    }),
  },
};

const getMeta = (type, C) => {
  const safeType = TYPE_META[type] ? type : 'info';
  const config = TYPE_META[safeType];
  return {
    type: safeType,
    Icon: config.Icon,
    style: config.getStyle(C),
  };
};

const ToastItem = ({ toast, onClose, C, glass }) => {
  const meta = getMeta(toast.type, C);
  const Icon = meta.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 24, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.98 }}
      transition={{ duration: 0.22, ease: 'easeOut' }}
      role='status'
      aria-live={toast.type === 'error' ? 'assertive' : 'polite'}
      aria-atomic='true'
      style={{
        ...glass({
          width: '100%',
          border: '1px solid ' + meta.style.border,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px',
          pointerEvents: 'auto',
        }),
      }}
    >
      <div
        style={{
          width: '32px',
          height: '32px',
          borderRadius: '10px',
          background: meta.style.iconBg,
          border: '1px solid ' + meta.style.iconBorder,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon style={{ width: '16px', height: '16px', color: meta.style.icon }} />
      </div>

      <div style={{ minWidth: 0, flex: 1 }}>
        {toast.title ? (
          <p
            style={{
              margin: 0,
              fontSize: '0.86rem',
              fontWeight: 800,
              color: meta.style.title,
              lineHeight: 1.3,
            }}
          >
            {toast.title}
          </p>
        ) : null}

        <p
          style={{
            margin: toast.title ? '2px 0 0 0' : 0,
            fontSize: '0.82rem',
            fontWeight: 600,
            color: meta.style.message,
            lineHeight: 1.45,
            wordBreak: 'break-word',
          }}
        >
          {toast.message}
        </p>
      </div>

      <button
        type='button'
        onClick={() => onClose(toast.id)}
        aria-label='Dismiss notification'
        style={{
          border: 'none',
          background: 'transparent',
          color: C.textDim,
          cursor: 'pointer',
          width: '28px',
          height: '28px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <X style={{ width: '15px', height: '15px' }} />
      </button>
    </motion.div>
  );
};

export const ToastProvider = ({ children, maxToasts = 4, position = 'bottom-center' }) => {
  const { C, glass } = useTheme();
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());
  const idRef = useRef(0);

  const removeToast = useCallback((id) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const pushToast = useCallback((type, message, options = {}) => {
    if (!message) return null;

    idRef.current += 1;
    const id = idRef.current;
    const duration = options.duration == null ? DEFAULT_DURATION : options.duration;

    const nextToast = {
      id,
      type,
      title: options.title || '',
      message,
      duration,
    };

    setToasts((prev) => {
      const updated = [nextToast].concat(prev);
      return updated.slice(0, Math.max(1, maxToasts));
    });

    if (duration !== 0) {
      const timer = setTimeout(() => removeToast(id), duration);
      timersRef.current.set(id, timer);
    }

    return id;
  }, [maxToasts, removeToast]);

  const clearToasts = useCallback(() => {
    timersRef.current.forEach((timer) => clearTimeout(timer));
    timersRef.current.clear();
    setToasts([]);
  }, []);

  const toast = useMemo(() => ({
    success: (message, options) => pushToast('success', message, options),
    error: (message, options) => pushToast('error', message, options),
    info: (message, options) => pushToast('info', message, options),
    show: (type, message, options) => pushToast(type, message, options),
    dismiss: removeToast,
    clear: clearToasts,
  }), [clearToasts, pushToast, removeToast]);

  const containerPosition = useMemo(() => {
    if (position === 'top-right') {
      return { top: 18, right: 18, left: 'auto', bottom: 'auto', transform: 'none' };
    }
    if (position === 'top-left') {
      return { top: 18, left: 18, right: 'auto', bottom: 'auto', transform: 'none' };
    }
    if (position === 'bottom-right') {
      return { bottom: 18, right: 18, left: 'auto', top: 'auto', transform: 'none' };
    }
    if (position === 'bottom-left') {
      return { bottom: 18, left: 18, right: 'auto', top: 'auto', transform: 'none' };
    }
    return { bottom: 18, left: '50%', right: 'auto', top: 'auto', transform: 'translateX(-50%)' };
  }, [position]);

  return (
    <ToastContext.Provider value={toast}>
      {children}

      <div
        role='status'
        aria-live='polite'
        aria-atomic='true'
        style={{
          position: 'fixed',
          zIndex: 1000,
          width: 'min(92vw, 440px)',
          pointerEvents: 'none',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          ...containerPosition,
        }}
      >
        <AnimatePresence initial={false}>
          {toasts.map((item) => (
            <ToastItem
              key={item.id}
              toast={item}
              onClose={removeToast}
              C={C}
              glass={glass}
            />
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used inside <ToastProvider>');
  }
  return ctx;
};
