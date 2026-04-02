import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { 
  CheckCircleIcon, 
  ExclamationCircleIcon, 
  InformationCircleIcon, 
  XMarkIcon 
} from '@heroicons/react/24/solid';
import { useSocket } from './SocketContext';

const NotificationContext = createContext();

export function useNotification() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
}

export function NotificationProvider({ children }) {
  const socket = useSocket();
  const [notifications, setNotifications] = useState([]); // Toasts
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem("notificationHistory");
    return saved ? JSON.parse(saved) : [];
  }); // Persistent History

  // Save history to local storage
  useEffect(() => {
    localStorage.setItem("notificationHistory", JSON.stringify(history));
  }, [history]);

  const showNotification = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    // Auto-remove toast after duration
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, duration);
  }, []);

  const addToHistory = useCallback((title, message, type = 'info') => {
    const newNotif = {
      id: Date.now(),
      title,
      message,
      type,
      read: false,
      timestamp: new Date().toISOString()
    };
    setHistory(prev => [newNotif, ...prev].slice(0, 50)); // Keep last 50
    
    // Also show toast
    showNotification(message, type);
  }, [showNotification]);

  const markAsRead = useCallback((id) => {
    setHistory(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllAsRead = useCallback(() => {
    setHistory(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  // Listen for socket events
  useEffect(() => {
    if (!socket) return;

    const handleTransaction = (txn) => {
      addToHistory("New Order", `New transaction ${txn.transactionId} received - ₱${txn.totalAmount}`, "success");
    };

    socket.on("transaction_created", handleTransaction);

    return () => {
      socket.off("transaction_created", handleTransaction);
    };
  }, [socket, addToHistory]);

  const unreadCount = history.filter(n => !n.read).length;

  return (
    <NotificationContext.Provider value={{ 
      showNotification, 
      history, 
      unreadCount, 
      markAsRead, 
      markAllAsRead, 
      clearHistory 
    }}>
      {children}
      
      {/* Notification Container - Responsive Positioning */}
      <div className="fixed top-4 right-4 left-4 sm:left-auto sm:top-6 sm:right-6 z-[9999] flex flex-col gap-3 w-auto sm:w-full sm:max-w-sm pointer-events-none">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto w-full transform transition-all duration-500 ease-out translate-x-0 opacity-100 animate-slide-in-right
              flex items-start sm:items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl sm:rounded-2xl shadow-2xl backdrop-blur-xl border border-white/10
              ${
                notification.type === 'success' 
                  ? 'bg-gradient-to-r from-green-900/90 to-green-800/90 text-green-100 border-green-500/30' 
                  : notification.type === 'error'
                  ? 'bg-gradient-to-r from-red-900/90 to-red-800/90 text-red-100 border-red-500/30'
                  : notification.type === 'warning'
                  ? 'bg-gradient-to-r from-yellow-900/90 to-yellow-800/90 text-yellow-100 border-yellow-500/30'
                  : 'bg-gradient-to-r from-blue-900/90 to-blue-800/90 text-blue-100 border-blue-500/30'
              }
            `}
            role="alert"
          >
            {/* Icon */}
            <div className={`
              flex-shrink-0 p-2 rounded-full 
              ${
                notification.type === 'success' ? 'bg-green-500/20 text-green-400' :
                notification.type === 'error' ? 'bg-red-500/20 text-red-400' :
                notification.type === 'warning' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-blue-500/20 text-blue-400'
              }
            `}>
              {notification.type === 'success' && <CheckCircleIcon className="w-6 h-6" />}
              {notification.type === 'error' && <ExclamationCircleIcon className="w-6 h-6" />}
              {notification.type === 'warning' && <ExclamationCircleIcon className="w-6 h-6" />}
              {notification.type === 'info' && <InformationCircleIcon className="w-6 h-6" />}
            </div>

            {/* Content */}
            <div className="flex-1">
              <h4 className="font-bold text-xs uppercase tracking-wider opacity-70 mb-0.5">
                {notification.type}
              </h4>
              <p className="text-sm font-medium leading-relaxed">
                {notification.message}
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => removeNotification(notification.id)}
              className="p-1 rounded-lg hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
}
