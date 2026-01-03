import { Doc, Id } from "@/convex/_generated/dataModel";

// Re-export Convex types for convenience
export type SyncApp = Doc<"sync_apps">;
export type SyncJob = Doc<"sync_jobs">;
export type SqlConfig = Doc<"sql_config">;
export type EmailConfig = Doc<"email_config">;

export type SyncAppId = Id<"sync_apps">;
export type SyncJobId = Id<"sync_jobs">;

// Extended types with computed fields
export type SyncAppWithStatus = SyncApp & {
  latest_job: SyncJob | null;
};

// Form types for creating/updating
export type CreateSyncAppInput = {
  name: string;
  description?: string;
  deploy_key: string;
  tables: string[];
  table_mapping?: Record<string, string>;
  cron_schedule?: string;
  cron_enabled: boolean;
};

export type UpdateSyncAppInput = Partial<CreateSyncAppInput>;

export type CreateSqlConfigInput = {
  host: string;
  database: string;
  schema: string;
  username: string;
  password: string; // Will be encrypted before saving
  timeout: number;
};

export type CreateEmailConfigInput = {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string; // Will be encrypted before saving
  from_email: string;
  to_emails: string[];
  use_tls: boolean;
};

// Status types
export type SyncStatus = "pending" | "running" | "success" | "failed" | "never_run";
export type TriggerType = "manual" | "cron";

// API response types
export type TriggerSyncResponse = {
  success: boolean;
  job_id: SyncJobId;
  message: string;
};

export type SyncCallbackPayload = {
  job_id: SyncJobId;
  status: "success" | "failed";
  completed_at: number;
  duration_seconds?: number;
  tables_processed?: number;
  rows_imported?: number;
  error_message?: string;
  log_content?: string;
};
