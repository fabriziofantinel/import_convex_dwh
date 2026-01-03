"use client";

import { createContext, useContext } from "react";
import { useToast } from "@/lib/hooks/useToast";
import { ToastContainer } from "@/components/ui/ToastContainer";
import type { ToastData } from "@/components/ui/Toast";

/**
 * ToastProvider Component
 * Context provider for toast notifications
 * Requirements: 9.5
 */

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, "id" | "duration"> & { duration?: number }) => string;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
  success: (title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => string;
  error: (title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => string;
  warning: (title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => string;
  info: (title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => string;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const toastMethods = useToast();

  return (
    <ToastContext.Provider value={toastMethods}>
      {children}
      <ToastContainer
        toasts={toastMethods.toasts}
        onRemoveToast={toastMethods.removeToast}
      />
    </ToastContext.Provider>
  );
}

export function useToastContext() {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToastContext must be used within a ToastProvider");
  }
  return context;
}