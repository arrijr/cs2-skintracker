"use client";
// /frontend/src/app/components/ToastContainer.tsx
// {/* Toast container for displaying notifications */}

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';

interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration?: number;
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const unsubscribe = toast.subscribe(setToasts);
    return unsubscribe;
  }, []);

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500 border-emerald-400';
      case 'error':
        return 'bg-red-500 border-red-400';
      case 'warning':
        return 'bg-amber-500 border-amber-400';
      case 'info':
        return 'bg-blue-500 border-blue-400';
      default:
        return 'bg-zinc-500 border-zinc-400';
    }
  };

  const getToastIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓';
      case 'error':
        return '✕';
      case 'warning':
        return '⚠';
      case 'info':
        return 'i';
      default:
        return '•';
    }
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toastItem) => (
        <div
          key={toastItem.id}
          className={`
            flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border-l-4 text-white
            transform transition-all duration-300 ease-in-out
            ${getToastStyles(toastItem.type)}
            animate-slide-in-right
          `}
          style={{ minWidth: '300px', maxWidth: '400px' }}
        >
          <span className="text-lg font-bold">
            {getToastIcon(toastItem.type)}
          </span>
          <span className="flex-1 text-sm">{toastItem.message}</span>
          <button
            onClick={() => toast.dismiss(toastItem.id)}
            className="text-white/70 hover:text-white text-lg leading-none"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
