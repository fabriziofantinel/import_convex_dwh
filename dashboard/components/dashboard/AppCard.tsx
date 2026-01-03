"use client";

import { StatusBadge, LoadingButton } from "@/components/ui";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * AppCard Component
 * Card displaying sync app with status, stats, and actions
 * Requirements: 2.1, 4.1, 4.2, 9.2, 9.3
 */

interface AppCardProps {
  app: {
    _id: Id<"sync_apps">;
    name: string;
    description?: string;
    tables: string[];
    cron_enabled: boolean;
    cron_schedule?: string;
  };
  lastJob?: {
    status: "success" | "failed" | "running" | "pending";
    completed_at?: number;
    duration_seconds?: number;
    tables_processed?: number;
    rows_imported?: number;
    error_message?: string;
  };
  onSyncNow: (appId: Id<"sync_apps">) => void;
  onEdit: (appId: Id<"sync_apps">) => void;
  onDelete: (appId: Id<"sync_apps">) => void;
  onViewLogs: (appId: Id<"sync_apps">) => void;
  isSyncing?: boolean;
}

export function AppCard({
  app,
  lastJob,
  onSyncNow,
  onEdit,
  onDelete,
  onViewLogs,
  isSyncing = false,
}: AppCardProps) {
  const status = lastJob?.status || "never_run";
  const isRunning = status === "running" || status === "pending" || isSyncing;

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "Never";
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900">{app.name}</h3>
          {app.description && (
            <p className="text-sm text-gray-600 mt-1 mb-2">{app.description}</p>
          )}
          <p className="text-sm text-gray-500">
            {app.tables.length} {app.tables.length === 1 ? "table" : "tables"}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4 pb-4 border-b border-gray-100">
        <div>
          <p className="text-xs text-gray-500 mb-1">Last Sync</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDate(lastJob?.completed_at)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Duration</p>
          <p className="text-sm font-medium text-gray-900">
            {formatDuration(lastJob?.duration_seconds)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Tables Processed</p>
          <p className="text-sm font-medium text-gray-900">
            {lastJob?.tables_processed ?? "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Rows Imported</p>
          <p className="text-sm font-medium text-gray-900">
            {lastJob?.rows_imported ?? "N/A"}
          </p>
        </div>
      </div>

      {/* Cron Info */}
      {app.cron_enabled && app.cron_schedule && (
        <div className="mb-4 p-3 bg-blue-50 rounded-md">
          <div className="flex items-center gap-2">
            <svg
              className="w-4 h-4 text-blue-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span className="text-xs text-blue-700 font-medium">
              Scheduled: {app.cron_schedule}
            </span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {status === "failed" && lastJob?.error_message && (
        <div className="mb-4 p-3 bg-red-50 rounded-md">
          <p className="text-xs text-red-700 font-medium mb-1">Error:</p>
          <p className="text-xs text-red-600 line-clamp-2">
            {lastJob.error_message}
          </p>
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <LoadingButton
          onClick={() => onSyncNow(app._id)}
          isLoading={isRunning}
          loadingText="Syncing..."
          disabled={isRunning}
          variant="primary"
          size="md"
          className="flex-1"
        >
          Sync Now
        </LoadingButton>
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(app._id)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onViewLogs(app._id)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 transition-colors"
          >
            Logs
          </button>
          <button
            onClick={() => onDelete(app._id)}
            className="flex-1 sm:flex-none px-3 sm:px-4 py-2 rounded-md text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
