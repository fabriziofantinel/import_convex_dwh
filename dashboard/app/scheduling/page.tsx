"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { LoadingButton } from "@/components/ui/LoadingButton";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Scheduling Page
 * Manage sync schedules for all applications
 */

export default function SchedulingPage() {
  const apps = useQuery(api.queries.listSyncApps);
  const updateApp = useMutation(api.mutations.updateSyncApp);
  
  const [editingApp, setEditingApp] = useState<string | null>(null);
  const [scheduleForm, setScheduleForm] = useState({
    cron_schedule: "",
    cron_enabled: false,
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleEditSchedule = (app: any) => {
    setEditingApp(app._id);
    setScheduleForm({
      cron_schedule: app.cron_schedule || "0 2 * * *", // Default: daily at 2 AM
      cron_enabled: app.cron_enabled || false,
    });
  };

  const handleCancelEdit = () => {
    setEditingApp(null);
    setScheduleForm({
      cron_schedule: "",
      cron_enabled: false,
    });
  };

  const handleSaveSchedule = async (appId: string) => {
    if (!scheduleForm.cron_schedule.trim()) {
      alert("Please enter a valid cron schedule");
      return;
    }

    setIsUpdating(true);
    try {
      await updateApp({
        id: appId as Id<"sync_apps">,
        cron_schedule: scheduleForm.cron_schedule.trim(),
        cron_enabled: scheduleForm.cron_enabled,
      });
      
      setEditingApp(null);
      setScheduleForm({
        cron_schedule: "",
        cron_enabled: false,
      });
    } catch (error) {
      console.error("Error updating schedule:", error);
      alert("Failed to update schedule. Please try again.");
    } finally {
      setIsUpdating(false);
    }
  };

  const formatCronSchedule = (cronSchedule?: string) => {
    if (!cronSchedule) return "Not scheduled";
    
    // Common cron patterns
    const patterns: Record<string, string> = {
      "0 2 * * *": "Daily at 2:00 AM",
      "0 */6 * * *": "Every 6 hours",
      "0 */12 * * *": "Every 12 hours",
      "0 0 * * 0": "Weekly on Sunday at midnight",
      "0 0 1 * *": "Monthly on the 1st at midnight",
    };
    
    return patterns[cronSchedule] || cronSchedule;
  };

  const cronPresets = [
    { label: "Daily at 2:00 AM", value: "0 2 * * *" },
    { label: "Every 6 hours", value: "0 */6 * * *" },
    { label: "Every 12 hours", value: "0 */12 * * *" },
    { label: "Weekly (Sunday at midnight)", value: "0 0 * * 0" },
    { label: "Monthly (1st at midnight)", value: "0 0 1 * *" },
  ];

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Sync Scheduling</h1>
          <p className="text-gray-500 mt-1">
            Configure automatic sync schedules for your applications
          </p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <svg
              className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-blue-800">
                Vercel Free Tier Limitation
              </h3>
              <p className="text-sm text-blue-700 mt-1">
                Vercel Hobby accounts support only daily cron jobs. All schedules will run once per day maximum.
              </p>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {apps === undefined && (
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
              <span className="text-gray-600">Loading applications...</span>
            </div>
          </div>
        )}

        {/* Applications Table */}
        {apps !== undefined && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            {apps.length === 0 ? (
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
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  No applications found
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  Create an application first to configure scheduling
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
                        Schedule
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {apps.map((app) => (
                      <tr key={app._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {app.name}
                            </div>
                            {app.description && (
                              <div className="text-sm text-gray-500">
                                {app.description}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge 
                            status={app.cron_enabled ? "success" : "failed"}
                          />
                          <span className="ml-2 text-sm text-gray-600">
                            {app.cron_enabled ? "Enabled" : "Disabled"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {editingApp === app._id ? (
                            <div className="space-y-3">
                              {/* Enable/Disable Toggle */}
                              <label className="flex items-center">
                                <input
                                  type="checkbox"
                                  checked={scheduleForm.cron_enabled}
                                  onChange={(e) =>
                                    setScheduleForm({
                                      ...scheduleForm,
                                      cron_enabled: e.target.checked,
                                    })
                                  }
                                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <span className="ml-2 text-sm text-gray-700">
                                  Enable scheduling
                                </span>
                              </label>

                              {/* Cron Schedule Input */}
                              <div>
                                <input
                                  type="text"
                                  value={scheduleForm.cron_schedule}
                                  onChange={(e) =>
                                    setScheduleForm({
                                      ...scheduleForm,
                                      cron_schedule: e.target.value,
                                    })
                                  }
                                  placeholder="0 2 * * *"
                                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                />
                              </div>

                              {/* Preset Buttons */}
                              <div className="flex flex-wrap gap-1">
                                {cronPresets.map((preset) => (
                                  <button
                                    key={preset.value}
                                    onClick={() =>
                                      setScheduleForm({
                                        ...scheduleForm,
                                        cron_schedule: preset.value,
                                      })
                                    }
                                    className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border text-gray-700"
                                  >
                                    {preset.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ) : (
                            formatCronSchedule(app.cron_schedule)
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          {editingApp === app._id ? (
                            <div className="flex gap-2">
                              <LoadingButton
                                onClick={() => handleSaveSchedule(app._id)}
                                isLoading={isUpdating}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                Save
                              </LoadingButton>
                              <button
                                onClick={handleCancelEdit}
                                className="px-3 py-1 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleEditSchedule(app)}
                              className="text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Edit Schedule
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Cron Schedule Format
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Format</h4>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                minute hour day month weekday
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Use * for "any value" and specific numbers for exact times.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Examples</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code>0 2 * * *</code> - Daily at 2:00 AM</li>
                <li><code>0 */6 * * *</code> - Every 6 hours</li>
                <li><code>0 0 * * 0</code> - Weekly on Sunday</li>
                <li><code>0 0 1 * *</code> - Monthly on the 1st</li>
              </ul>
            </div>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}