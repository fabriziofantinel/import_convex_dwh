"use client";

/**
 * StatusBadge Component
 * Colored badge for sync status
 * Requirements: 9.3
 */

type SyncStatus = "success" | "failed" | "running" | "never_run" | "pending";

interface StatusBadgeProps {
  status: SyncStatus;
  className?: string;
}

const statusConfig = {
  success: {
    label: "Success",
    bgColor: "bg-green-100",
    textColor: "text-green-800",
    dotColor: "bg-green-500",
  },
  failed: {
    label: "Failed",
    bgColor: "bg-red-100",
    textColor: "text-red-800",
    dotColor: "bg-red-500",
  },
  running: {
    label: "Running",
    bgColor: "bg-yellow-100",
    textColor: "text-yellow-800",
    dotColor: "bg-yellow-500",
  },
  pending: {
    label: "Pending",
    bgColor: "bg-blue-100",
    textColor: "text-blue-800",
    dotColor: "bg-blue-500",
  },
  never_run: {
    label: "Never Run",
    bgColor: "bg-gray-100",
    textColor: "text-gray-800",
    dotColor: "bg-gray-500",
  },
};

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const config = statusConfig[status];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
      {config.label}
    </span>
  );
}
