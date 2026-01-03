"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation } from "convex/react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AppCard } from "@/components/dashboard/AppCard";
import { DashboardEmptyState } from "@/components/dashboard/EmptyState";
import { DeleteConfirmModal } from "@/components/apps/DeleteConfirmModal";
import { LoadingSpinner } from "@/components/ui";
import { useLatestSyncJobs } from "@/lib/hooks/useSyncJobs";
import { useSyncPolling } from "@/lib/hooks/useSyncPolling";
import { useTriggerSync } from "@/lib/hooks/useTriggerSync";
import { useToastContext } from "@/components/providers/ToastProvider";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Dashboard Home Page
 * Display list of sync apps with status and actions
 * Requirements: 2.1, 4.1, 4.2, 9.2, 9.3
 */

export default function Home() {
  const router = useRouter();
  const toast = useToastContext();
  
  // Convex hooks
  const apps = useQuery(api.queries.listSyncApps);
  const deleteSyncApp = useMutation(api.mutations.deleteSyncApp);
  const { triggerSync } = useTriggerSync();
  
  // Get latest jobs for all apps
  const appIds = apps?.map((app) => app._id) || [];
  const latestJobs = useLatestSyncJobs(appIds);
  
  const [syncingApps, setSyncingApps] = useState<Set<Id<"sync_apps">>>(
    new Set()
  );
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    appId: Id<"sync_apps"> | null;
    appName: string;
  }>({
    isOpen: false,
    appId: null,
    appName: "",
  });
  const [isDeleting, setIsDeleting] = useState(false);

  // Callback when sync completes
  const handleSyncComplete = useCallback((appId: Id<"sync_apps">) => {
    setSyncingApps((prev) => {
      const next = new Set(prev);
      next.delete(appId);
      return next;
    });
  }, []);

  // Poll for sync status updates
  useSyncPolling(appIds, syncingApps, handleSyncComplete);

  const hasApps = apps && apps.length > 0;

  const handleSyncNow = async (appId: Id<"sync_apps">) => {
    // Check if already syncing
    const latestJob = latestJobs.get(appId);
    if (latestJob && (latestJob.status === "running" || latestJob.status === "pending")) {
      toast.warning("Sync Already Running", "A sync is already running for this application. Please wait for it to complete.");
      return;
    }

    setSyncingApps((prev) => new Set(prev).add(appId));

    try {
      const result = await triggerSync({
        app_id: appId,
        triggered_by: "manual",
      });
      
      if (!result.success) {
        throw new Error(result.error || "Failed to start sync");
      }
      
      // Success - the sync is now running
      toast.success("Sync Started", "The sync has been started successfully. You can monitor its progress here.");
    } catch (error) {
      console.error("Error triggering sync:", error);
      toast.error(
        "Failed to Start Sync",
        error instanceof Error ? error.message : "Failed to start sync"
      );
      
      // Remove from syncing set on error
      setSyncingApps((prev) => {
        const next = new Set(prev);
        next.delete(appId);
        return next;
      });
    }
  };

  const handleEdit = (appId: Id<"sync_apps">) => {
    router.push(`/edit/${appId}`);
  };

  const handleDelete = (appId: Id<"sync_apps">) => {
    const app = apps?.find((a) => a._id === appId);
    if (app) {
      setDeleteModal({
        isOpen: true,
        appId,
        appName: app.name,
      });
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.appId) return;

    setIsDeleting(true);
    try {
      await deleteSyncApp({ id: deleteModal.appId });
      setDeleteModal({ isOpen: false, appId: null, appName: "" });
      toast.success("Application Deleted", `${deleteModal.appName} has been deleted successfully.`);
    } catch (error) {
      console.error("Error deleting app:", error);
      toast.error("Delete Failed", "Failed to delete application. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeleteModal({ isOpen: false, appId: null, appName: "" });
  };

  const handleViewLogs = (appId: Id<"sync_apps">) => {
    router.push(`/apps/${appId}/logs`);
  };

  const handleAddApp = () => {
    router.push("/apps/new");
  };

  return (
    <ProtectedRoute>
      <DashboardLayout>
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-500 mt-1">
                Manage your Convex to SQL Server sync applications
              </p>
            </div>
            {hasApps && (
              <button
                onClick={handleAddApp}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
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
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <span className="hidden sm:inline">Add Application</span>
                <span className="sm:hidden">Add App</span>
              </button>
            )}
          </div>
        </div>

        {/* Loading State */}
        {apps === undefined && (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" text="Loading applications..." />
          </div>
        )}

        {/* Content */}
        {apps !== undefined && (
          <>
            {hasApps ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {apps.map((app) => (
                  <AppCard
                    key={app._id}
                    app={app}
                    lastJob={latestJobs.get(app._id)}
                    onSyncNow={handleSyncNow}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onViewLogs={handleViewLogs}
                    isSyncing={syncingApps.has(app._id)}
                  />
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12">
                <DashboardEmptyState onAddApp={handleAddApp} />
              </div>
            )}
          </>
        )}

        {/* Delete Confirmation Modal */}
        <DeleteConfirmModal
          isOpen={deleteModal.isOpen}
          appName={deleteModal.appName}
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          isDeleting={isDeleting}
        />
      </DashboardLayout>
    </ProtectedRoute>
  );
}
