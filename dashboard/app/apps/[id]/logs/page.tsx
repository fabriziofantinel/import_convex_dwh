"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { SyncJobList, LogViewer } from "@/components/logs";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import type { SyncJob } from "@/lib/types";

/**
 * Logs Page
 * Display list of recent sync jobs for a specific app
 * Requirements: 4.3, 4.4
 * Updated: 2026-01-03
 */

export default function LogsPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.id as Id<"sync_apps">;

  // Fetch app details
  const app = useQuery(api.queries.getSyncApp, { id: appId });

  // Fetch last 10 sync jobs
  const syncJobs = useQuery(api.queries.getSyncJobs, {
    app_id: appId,
    limit: 10,
  });

  // State for log viewer modal
  const [selectedJob, setSelectedJob] = useState<SyncJob | null>(null);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);

  const handleBack = () => {
    router.push("/");
  };

  const handleViewLog = (job: SyncJob) => {
    setSelectedJob(job);
    setIsLogViewerOpen(true);
  };

  const handleCloseLogViewer = () => {
    setIsLogViewerOpen(false);
    setSelectedJob(null);
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={handleBack}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>

          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Sync Logs {app && `- ${app.name}`}
            </h1>
            <p className="text-gray-500 mt-1">
              View recent sync job history and details
            </p>
          </div>
        </div>

        {/* Loading State */}
        {(app === undefined || syncJobs === undefined) && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-3">
              <svg
                className="animate-spin h-8 w-8 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span className="text-gray-600">Loading logs...</span>
            </div>
          </div>
        )}

        {/* Content */}
        {app !== undefined && syncJobs !== undefined && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <SyncJobList jobs={syncJobs} onViewLog={handleViewLog} />
          </div>
        )}

        {/* Log Viewer Modal */}
        <LogViewer
          job={selectedJob}
          isOpen={isLogViewerOpen}
          onClose={handleCloseLogViewer}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
