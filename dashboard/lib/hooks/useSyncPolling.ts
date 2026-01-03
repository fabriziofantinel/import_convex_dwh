"use client";

import { useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Custom hook to poll sync job status
 * Polls every 2 seconds when there are running syncs
 * Requirements: 3.3, 3.4, 3.5
 */
export function useSyncPolling(
  appIds: Id<"sync_apps">[],
  runningSyncIds: Set<Id<"sync_apps">>,
  onSyncComplete: (appId: Id<"sync_apps">) => void
) {
  const previousStatusRef = useRef<Map<Id<"sync_apps">, string>>(new Map());
  
  // Query all running jobs
  const runningJobs = useQuery(api.queries.getRunningSyncJobs);

  useEffect(() => {
    if (!runningJobs) return;
    
    // Check each app that we think is running
    const runningAppIds = Array.from(runningSyncIds);
    
    runningAppIds.forEach((appId) => {
      // Check if this app still has a running job
      const hasRunningJob = runningJobs.some((job) => job.app_id === appId);
      const previousStatus = previousStatusRef.current.get(appId);

      // If we thought it was running but it's not anymore, it completed
      if (previousStatus === "running" && !hasRunningJob) {
        onSyncComplete(appId);
        previousStatusRef.current.delete(appId);
      } else if (hasRunningJob) {
        // Still running, update status
        previousStatusRef.current.set(appId, "running");
      }
    });
  }, [runningJobs, runningSyncIds, onSyncComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      previousStatusRef.current.clear();
    };
  }, []);
}
