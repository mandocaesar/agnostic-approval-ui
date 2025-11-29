"use client";

import { useEffect, useState } from "react";

export type ToastType = "success" | "error" | "warning" | "info";

export interface Toast {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

// Global toast state
let toasts: Toast[] = [];
let listeners: Array<(toasts: Toast[]) => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  success: (message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toasts.push({ id, type: "success", message, duration });
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(id), duration);
    }
  },

  error: (message: string, duration = 7000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toasts.push({ id, type: "error", message, duration });
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(id), duration);
    }
  },

  warning: (message: string, duration = 6000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toasts.push({ id, type: "warning", message, duration });
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(id), duration);
    }
  },

  info: (message: string, duration = 5000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    toasts.push({ id, type: "info", message, duration });
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => toast.dismiss(id), duration);
    }
  },

  dismiss: (id: string) => {
    toasts = toasts.filter((t) => t.id !== id);
    notifyListeners();
  },

  dismissAll: () => {
    toasts = [];
    notifyListeners();
  },
};

export function ToastContainer() {
  const [currentToasts, setCurrentToasts] = useState<Toast[]>([]);

  useEffect(() => {
    const listener = (newToasts: Toast[]) => setCurrentToasts(newToasts);
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (currentToasts.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex flex-col items-end justify-end gap-2 p-4 sm:p-6">
      {currentToasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}

function ToastItem({ toast: t }: { toast: Toast }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleDismiss = () => {
    setIsExiting(true);
    setTimeout(() => toast.dismiss(t.id), 300);
  };

  const styles = {
    success: "bg-emerald-50 border-emerald-200 text-emerald-900",
    error: "bg-rose-50 border-rose-200 text-rose-900",
    warning: "bg-amber-50 border-amber-200 text-amber-900",
    info: "bg-blue-50 border-blue-200 text-blue-900",
  };

  const icons = {
    success: (
      <svg className="h-5 w-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    error: (
      <svg className="h-5 w-5 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    warning: (
      <svg className="h-5 w-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
    info: (
      <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  };

  return (
    <div
      className={`
        pointer-events-auto flex items-start gap-3 rounded-xl border-2 p-4 shadow-lg transition-all duration-300
        ${styles[t.type]}
        ${isExiting ? "translate-x-full opacity-0" : "translate-x-0 opacity-100"}
      `}
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
    >
      <div className="flex-shrink-0">{icons[t.type]}</div>

      <div className="flex-1 text-sm font-medium">
        {t.message}
      </div>

      <button
        onClick={handleDismiss}
        className="flex-shrink-0 rounded-lg p-1 hover:bg-black/5 focus:outline-none focus:ring-2 focus:ring-black/20"
        aria-label="Dismiss notification"
      >
        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
