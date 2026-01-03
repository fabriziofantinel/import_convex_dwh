"use client";

import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AppForm } from "@/components/apps/AppForm";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Edit Application Page
 * Form to edit an existing sync application
 * Requirements: 2.4, 2.5
 */

export default function EditAppPage() {
  const router = useRouter();
  const params = useParams();
  const appId = params.id as Id<"sync_apps">;
  
  const app = useQuery(api.queries.getSyncApp, { id: appId });
  const updateSyncApp = useMutation(api.mutations.updateSyncApp);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (data: {
    name: string;
    description?: string;
    deploy_key: string;
    tables: string[];
    table_mapping?: Record<string, string>;
    cron_schedule?: string;
    cron_enabled: boolean;
  }) => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateSyncApp({
        id: appId,
        ...data,
      });

      // Redirect to dashboard on success
      router.push("/");
    } catch (err) {
      console.error("Error updating app:", err);
      setError(
        err instanceof Error ? err.message : "Failed to update application"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  // Loading state
  if (app === undefined) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
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
                <span className="text-gray-600">Loading application...</span>
              </div>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  // Not found state
  if (app === null) {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="max-w-4xl mx-auto">
            <div className="text-center py-12">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                <svg
                  className="w-8 h-8 text-red-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Application not found
              </h3>
              <p className="text-gray-500 mb-6">
                The application you're looking for doesn't exist or has been deleted.
              </p>
              <button
                onClick={() => router.push("/")}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Edit Application
            </h1>
            <p className="text-gray-500 mt-1">
              Update configuration for <span className="font-medium">{app.name}</span>
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-red-600 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">
                    Error updating application
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AppForm
              initialData={{
                name: app.name,
                description: app.description,
                deploy_key: app.deploy_key,
                tables: app.tables,
                table_mapping: app.table_mapping,
                cron_schedule: app.cron_schedule,
                cron_enabled: app.cron_enabled,
              }}
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
              isEdit
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}