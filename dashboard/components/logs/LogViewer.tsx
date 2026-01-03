"use client";

import { StatusBadge } from "@/components/ui/StatusBadge";
import type { SyncJob } from "@/lib/types";

/**
 * LogViewer Component
 * Modal to display full log content with syntax highlighting
 * Requirements: 4.4
 */

interface LogViewerProps {
  job: SyncJob | null;
  isOpen: boolean;
  onClose: () => void;
}

export function LogViewer({ job, isOpen, onClose }: LogViewerProps) {
  if (!isOpen || !job) return null;

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "N/A";
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  // Format log content with basic syntax highlighting
  const formatLogContent = (content?: string) => {
    if (!content) return "No log content available";

    // Split by lines and apply basic formatting
    const lines = content.split("\n");
    return lines.map((line, index) => {
      let className = "text-gray-700";

      // Color coding based on content
      if (line.includes("ERROR") || line.includes("Error") || line.includes("error")) {
        className = "text-red-600 font-medium";
      } else if (line.includes("WARNING") || line.includes("Warning")) {
        className = "text-yellow-600 font-medium";
      } else if (line.includes("SUCCESS") || line.includes("Success") || line.includes("✓")) {
        className = "text-green-600 font-medium";
      } else if (line.includes("INFO") || line.includes("Info")) {
        className = "text-blue-600";
      } else if (line.match(/^\d{4}-\d{2}-\d{2}/)) {
        // Timestamp lines
        className = "text-gray-500";
      }

      return (
        <div key={index} className={`${className} font-mono text-sm leading-relaxed`}>
          {line || "\u00A0"}
        </div>
      );
    });
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Sync Job Log
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {job.app_name} - {formatDate(job.started_at)}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* Job Details */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Status</p>
                  <StatusBadge status={job.status} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Duration</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatDuration(job.duration_seconds)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Tables Processed</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.tables_processed ?? "N/A"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Rows Imported</p>
                  <p className="text-sm font-medium text-gray-900">
                    {job.rows_imported ?? "N/A"}
                  </p>
                </div>
              </div>

              {/* Error Message */}
              {job.status === "failed" && job.error_message && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-xs text-red-700 font-medium mb-1">
                    Error Message:
                  </p>
                  <p className="text-sm text-red-600">{job.error_message}</p>
                </div>
              )}

              {/* Trigger Type */}
              <div className="mt-4">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.triggered_by === "manual"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  Triggered by: {job.triggered_by}
                </span>
              </div>
            </div>

            {/* Log Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="bg-gray-900 rounded-lg p-4 overflow-x-auto">
                <div className="text-gray-100">
                  {formatLogContent(job.log_content)}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    if (job.log_content) {
                      const blob = new Blob([job.log_content], {
                        type: "text/plain",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sync-log-${job.app_name}-${job.started_at}.txt`;
                      document.body.appendChild(a);
                      a.click();
                      document.body.removeChild(a);
                      URL.revokeObjectURL(url);
                    }
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                >
                  Download Log
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
