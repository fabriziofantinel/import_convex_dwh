import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface TriggerSyncParams {
  app_id: Id<"sync_apps">;
  triggered_by: "manual" | "cron";
}

interface TriggerSyncResult {
  success: boolean;
  job_id?: Id<"sync_jobs">;
  message?: string;
  error?: string;
}

export function useTriggerSync() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const prepareSyncJob = useMutation(api.mutations.prepareSyncJob);

  const triggerSync = async (
    params: TriggerSyncParams
  ): Promise<TriggerSyncResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 1: Call Convex mutation to create job
      const jobData = await prepareSyncJob(params);

      // Step 2: Call webhook server via proxy to bypass ngrok browser warning
      const webhookResponse = await fetch("/api/proxy-trigger-sync", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          job_id: jobData.job_id,
          app_name: jobData.app_name,
          deploy_key: jobData.deploy_key,
          tables: jobData.tables,
          table_mapping: jobData.table_mapping,
        }),
      });

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        throw new Error(`Webhook request failed: ${errorText}`);
      }

      const webhookData = await webhookResponse.json();

      return {
        success: true,
        job_id: jobData.job_id,
        message: webhookData.message || `Sync started for ${jobData.app_name}`,
      };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Unknown error occurred";
      setError(errorMessage);
      return {
        success: false,
        error: errorMessage,
      };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    triggerSync,
    isLoading,
    error,
  };
}
