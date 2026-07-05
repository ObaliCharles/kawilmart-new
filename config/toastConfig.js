import toast from 'react-hot-toast';

export const showSuccess = (message = 'Success!') => {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#10b981',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
      padding: '12px 20px',
    },
    icon: '✓',
  });
};

export const showError = (message = 'Something went wrong') => {
  toast.error(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#ef4444',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)',
      padding: '12px 20px',
    },
    icon: '✕',
  });
};

export const showInfo = (message = 'Info') => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#3b82f6',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)',
      padding: '12px 20px',
    },
    icon: 'ℹ',
  });
};

export const showWarning = (message = 'Warning') => {
  toast(message, {
    duration: 4000,
    position: 'top-right',
    style: {
      background: '#f59e0b',
      color: '#fff',
      fontSize: '14px',
      fontWeight: '500',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
      padding: '12px 20px',
    },
    icon: '⚠',
  });
};

export const toastConfig = {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
};
