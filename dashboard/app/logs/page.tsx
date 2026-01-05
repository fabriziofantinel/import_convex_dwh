"use client";

import { useState, useMemo, useCallback } from "react";
import { useQuery } from "convex/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LogViewer } from "@/components/logs";
import { api } from "@/convex/_generated/api";

/**
 * All Logs Page
 * Display all sync jobs from all applications with filters
 */

// Helper to calculate date range - returns stable values
function calculateDateRange(days: string): { from_date: number | undefined; to_date: number | undefined } {
  if (days === "all") {
    return { from_date: undefined, to_date: undefined };
  }
  
  const daysNum = parseInt(days);
  const now = Date.now();
  // Round to start of current hour to avoid constant recalculation
  const roundedNow = Math.floor(now / (60 * 60 * 1000)) * (60 * 60 * 1000);
  const from = roundedNow - (daysNum * 24 * 60 * 60 * 1000);
  
  return {
    from_date: from,
    to_date: roundedNow + (60 * 60 * 1000) // Add 1 hour buffer
  };
}

export default function AllLogsPage() {
  const apps = useQuery(api.queries.listSyncApps);
  
  const [selectedAppId, setSelectedAppId] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [dateRange, setDateRange] = useState<string>("7"); // days
  const [selectedJob, setSelectedJob] = useState<any>(null);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  
  // Store calculated dates in state to keep them stable
  const [dateFilter, setDateFilter] = useState(() => calculateDateRange("7"));

  // Update date filter when dateRange changes
  const handleDateRangeChange = useCallback((newRange: string) => {
    setDateRange(newRange);
    setDateFilter(calculateDateRange(newRange));
  }, []);

  const { from_date, to_date } = dateFilter;

  // Query with filters
  const allJobs = useQuery(api.queries.getAllSyncJobs, { 
    limit: 100,
    app_id: selectedAppId !== "all" ? selectedAppId as any : undefined,
    status: selectedStatus !== "all" ? selectedStatus as any : undefined,
    from_date,
    to_date
  });

  const handleViewLog = (job: any) => {
    setSelectedJob(job);
    setIsLogViewerOpen(true);
  };

  const handleCloseLogViewer = () => {
    setIsLogViewerOpen(false);
    setSelectedJob(null);
  };

  const formatDate = (timestamp?: number) => {
    if (!timestamp) return "N/A";
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
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">All Sync Logs</h1>
          <p className="text-gray-500 mt-1">
            View and filter sync job history across all applications
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* App Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Application
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => setSelectedAppId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Applications</option>
                {apps?.map((app) => (
                  <option key={app._id} value={app._id}>
                    {app.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="running">Running</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Period
              </label>
              <select
                value={dateRange}
                onChange={(e) => handleDateRangeChange(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="1">Last 24 hours</option>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 text-sm text-gray-600">
            Showing {allJobs?.length ?? 0} sync jobs
          </div>
        </div>

        {/* Loading State */}
        {(apps === undefined || allJobs === undefined) && (
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

        {/* Jobs Table */}
        {apps !== undefined && allJobs !== undefined && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {allJobs.length === 0 ? (
              <div className="text-center py-12">
                <svg
                  className="mx-auto h-12 w-12 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No logs found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  No sync jobs match the selected filters
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Application
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Started
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tables
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Rows
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {allJobs.map((job) => (
                      <tr key={job._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {job.app_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={job.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDate(job.started_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {formatDuration(job.duration_seconds)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.tables_processed ?? "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {job.rows_imported ?? "N/A"}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <button
                            onClick={() => handleViewLog(job)}
                            className="text-blue-600 hover:text-blue-800 font-medium"
                          >
                            View Log
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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
