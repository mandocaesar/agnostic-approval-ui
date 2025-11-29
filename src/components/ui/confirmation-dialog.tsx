"use client";

import { useState, useEffect } from "react";

export interface ConfirmationOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

interface ConfirmationState extends ConfirmationOptions {
  id: string;
  onConfirm: () => void;
  onCancel: () => void;
}

let confirmations: ConfirmationState[] = [];
let listeners: Array<(confirmations: ConfirmationState[]) => void> = [];

function notifyListeners() {
  listeners.forEach((listener) => listener([...confirmations]));
}

export function confirm(options: ConfirmationOptions): Promise<boolean> {
  return new Promise((resolve) => {
    const id = `confirmation-${Date.now()}-${Math.random()}`;

    const confirmation: ConfirmationState = {
      ...options,
      id,
      onConfirm: () => {
        confirmations = confirmations.filter((c) => c.id !== id);
        notifyListeners();
        resolve(true);
      },
      onCancel: () => {
        confirmations = confirmations.filter((c) => c.id !== id);
        notifyListeners();
        resolve(false);
      },
    };

    confirmations.push(confirmation);
    notifyListeners();
  });
}

export function ConfirmationDialog() {
  const [currentConfirmations, setCurrentConfirmations] = useState<ConfirmationState[]>([]);

  useEffect(() => {
    const listener = (newConfirmations: ConfirmationState[]) => setCurrentConfirmations(newConfirmations);
    listeners.push(listener);

    return () => {
      listeners = listeners.filter((l) => l !== listener);
    };
  }, []);

  if (currentConfirmations.length === 0) return null;

  const confirmation = currentConfirmations[0]; // Show one at a time

  const typeStyles = {
    danger: {
      button: "bg-rose-600 hover:bg-rose-700 focus:ring-rose-500",
      icon: (
        <svg className="h-6 w-6 text-rose-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconBg: "bg-rose-100",
    },
    warning: {
      button: "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500",
      icon: (
        <svg className="h-6 w-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
      iconBg: "bg-amber-100",
    },
    info: {
      button: "bg-blue-600 hover:bg-blue-700 focus:ring-blue-500",
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      iconBg: "bg-blue-100",
    },
  };

  const type = confirmation.type || "danger";
  const styles = typeStyles[type];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={confirmation.onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-title"
    >
      <div
        className="w-full max-w-md transform rounded-2xl bg-white p-6 shadow-xl transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className={`flex-shrink-0 rounded-full p-3 ${styles.iconBg}`}>
            {styles.icon}
          </div>

          <div className="flex-1">
            <h3 id="confirmation-title" className="text-lg font-semibold text-slate-900">
              {confirmation.title}
            </h3>
            <p className="mt-2 text-sm text-slate-600">{confirmation.message}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button
            onClick={confirmation.onCancel}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          >
            {confirmation.cancelText || "Cancel"}
          </button>

          <button
            onClick={confirmation.onConfirm}
            className={`rounded-lg px-4 py-2 text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 ${styles.button}`}
            autoFocus
          >
            {confirmation.confirmText || "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}
