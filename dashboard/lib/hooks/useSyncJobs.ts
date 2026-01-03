"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

/**
 * Custom hook to get the latest sync job for each app
 */
export function useLatestSyncJobs(appIds: Id<"sync_apps">[]) {
  // Query all latest jobs at once
  const allLatestJobs = useQuery(api.queries.getAllLatestSyncJobs);

  // Build a map of appId -> latest job
  const jobsMap = new Map();
  
  if (allLatestJobs) {
    appIds.forEach((appId) => {
      const job = allLatestJobs[appId];
      if (job) {
        jobsMap.set(appId, job);
      }
    });
  }

  return jobsMap;
}
