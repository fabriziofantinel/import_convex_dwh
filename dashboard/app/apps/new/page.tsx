"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation } from "convex/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AppForm } from "@/components/apps/AppForm";
import { api } from "@/convex/_generated/api";
import { useAuth } from "@/lib/hooks/useAuth";

/**
 * New Application Page
 * Form to create a new sync application
 * Requirements: 2.2, 2.3
 */

export default function NewAppPage() {
  const router = useRouter();
  const { getUserId } = useAuth();
  const createSyncApp = useMutation(api.mutations.createSyncApp);
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
      const userId = getUserId();
      
      await createSyncApp({
        ...data,
        created_by: userId || "unknown",
      });

      // Redirect to dashboard on success
      router.push("/");
    } catch (err) {
      console.error("Error creating app:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create application"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    router.push("/");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">
              Add New Application
            </h1>
            <p className="text-gray-500 mt-1">
              Configure a new Convex application to sync with SQL Server
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
                    Error creating application
                  </h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <AppForm
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}
