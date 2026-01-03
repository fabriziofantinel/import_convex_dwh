"use client";

import { useAuth } from "@/lib/hooks/useAuth";

interface LogoutButtonProps {
  className?: string;
  children?: React.ReactNode;
}

/**
 * Logout Button Component
 * Handles user logout
 * Requirements: 1.4
 */
export function LogoutButton({ className, children }: LogoutButtonProps) {
  const { logout, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return null;
  }

  return (
    <button
      onClick={logout}
      className={
        className ||
        "px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
      }
    >
      {children || "Logout"}
    </button>
  );
}
