"use client";

import { useState } from "react";
import { StatusBadge, EmptyState } from "@/components/ui";
import type { SyncJob } from "@/lib/types";

/**
 * SyncJobList Component
 * Display list of sync jobs with status, timestamp, and statistics
 * Requirements: 4.3, 4.4
 */

interface SyncJobListProps {
  jobs: SyncJob[];
  onViewLog: (job: SyncJob) => void;
}

export function SyncJobList({ jobs, onViewLog }: SyncJobListProps) {
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

  if (jobs.length === 0) {
    const logsIcon = (
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
          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
        />
      </svg>
    );

    return (
      <EmptyState
        icon={logsIcon}
        title="No sync logs"
        description="No sync jobs have been executed yet for this application. Run your first sync to see logs here."
      />
    );
  }

  return (
    <div className="overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Started At
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Duration
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Tables
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Rows
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Trigger
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {jobs.map((job) => (
            <tr
              key={job._id}
              className="hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => onViewLog(job)}
            >
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={job.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDate(job.started_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {formatDuration(job.duration_seconds)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {job.tables_processed ?? "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {job.rows_imported ?? "N/A"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.triggered_by === "manual"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-purple-100 text-purple-800"
                  }`}
                >
                  {job.triggered_by}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewLog(job);
                  }}
                  className="text-blue-600 hover:text-blue-900 font-medium"
                >
                  View Log
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
