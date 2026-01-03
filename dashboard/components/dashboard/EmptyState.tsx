"use client";

import { EmptyState } from "@/components/ui";

/**
 * Dashboard EmptyState Component
 * Display when no apps are configured
 * Requirements: 9.2
 */

interface DashboardEmptyStateProps {
  onAddApp: () => void;
}

export function DashboardEmptyState({ onAddApp }: DashboardEmptyStateProps) {
  const appsIcon = (
    <svg
      className="w-12 h-12 text-gray-400"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
      />
    </svg>
  );

  return (
    <EmptyState
      icon={appsIcon}
      title="No applications configured"
      description="Get started by adding your first Convex application to sync with SQL Server."
      action={{
        label: "Add Application",
        onClick: onAddApp,
        variant: "primary",
      }}
    />
  );
}
