"use client";

import { useState, useCallback } from "react";
import type { ToastData } from "@/components/ui/Toast";

/**
 * useToast Hook
 * Hook for managing toast notifications
 * Requirements: 9.5
 */

export function useToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((
    toast: Omit<ToastData, "id" | "duration"> & { duration?: number }
  ) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast: ToastData = {
      id,
      duration: 5000, // Default 5 seconds
      ...toast,
    };

    setToasts((prev) => [...prev, newToast]);
    return id;
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const clearAllToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => {
    return addToast({
      type: "success",
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const error = useCallback((title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => {
    return addToast({
      type: "error",
      title,
      message,
      duration: 8000, // Errors stay longer by default
      ...options,
    });
  }, [addToast]);

  const warning = useCallback((title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => {
    return addToast({
      type: "warning",
      title,
      message,
      ...options,
    });
  }, [addToast]);

  const info = useCallback((title: string, message?: string, options?: { duration?: number; action?: ToastData["action"] }) => {
    return addToast({
      type: "info",
      title,
      message,
      ...options,
    });
  }, [addToast]);

  return {
    toasts,
    addToast,
    removeToast,
    clearAllToasts,
    success,
    error,
    warning,
    info,
  };
}