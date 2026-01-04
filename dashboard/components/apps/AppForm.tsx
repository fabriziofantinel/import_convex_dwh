"use client";

import { useState, useEffect } from "react";
import { LoadingButton, LoadingSpinner } from "@/components/ui";
import { useToastContext } from "@/components/providers/ToastProvider";
import { validateSyncAppForm, ValidationError } from "@/lib/validation";

/**
 * AppForm Component
 * Reusable form for creating/editing sync applications
 * Requirements: 2.3, 2.4, 2.7, 2.8, 6.1
 */

interface AppFormProps {
  initialData?: {
    name: string;
    description?: string;
    deploy_key: string;
    tables: string[];
    table_mapping?: Record<string, string>;
    cron_schedule?: string;
    cron_enabled: boolean;
  };
  onSubmit: (data: {
    name: string;
    description?: string;
    deploy_key: string;
    tables: string[];
    table_mapping?: Record<string, string>;
    cron_schedule?: string;
    cron_enabled: boolean;
  }) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
  isEdit?: boolean;
}

export function AppForm({
  initialData,
  onSubmit,
  onCancel,
  isSubmitting = false,
  isEdit = false,
}: AppFormProps) {
  const toast = useToastContext();
  
  const [name, setName] = useState(initialData?.name || "");
  const [description, setDescription] = useState(initialData?.description || "");
  const [deployKey, setDeployKey] = useState(initialData?.deploy_key || "");
  const [availableTables, setAvailableTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<Set<string>>(
    new Set(initialData?.tables || [])
  );
  const [isFetchingTables, setIsFetchingTables] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [cronSchedule, setCronSchedule] = useState(
    initialData?.cron_schedule || ""
  );
  const [cronEnabled, setCronEnabled] = useState(
    initialData?.cron_enabled || false
  );

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert ValidationError[] to Record<string, string>
  const convertErrors = (validationErrors: ValidationError[]): Record<string, string> => {
    const errorMap: Record<string, string> = {};
    validationErrors.forEach(error => {
      errorMap[error.field] = error.message;
    });
    return errorMap;
  };

  // Handle fetching tables from Convex
  const handleFetchTables = async () => {
    // Use new validation library
    const validationResult = validateSyncAppForm({
      name: name,
      deploy_key: deployKey,
      tables: [],
      cron_enabled: false,
    });
    
    const deployKeyErrors = validationResult.errors.filter(e => e.field === 'deploy_key');
    if (deployKeyErrors.length > 0) {
      setErrors(convertErrors(deployKeyErrors));
      return;
    }

    setIsFetchingTables(true);
    setFetchError(null);

    try {
      // Call webhook server via ngrok URL
      const webhookUrl = process.env.NEXT_PUBLIC_WEBHOOK_URL || "http://localhost:5000";
      const response = await fetch(`${webhookUrl}/api/fetch-tables`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_WEBHOOK_TOKEN || "test-token-12345"}`,
          "ngrok-skip-browser-warning": "true",
        },
        body: JSON.stringify({
          deploy_key: deployKey,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch tables: ${errorText}`);
      }

      const result = await response.json();
      
      if (result.success && result.tables) {
        setAvailableTables(result.tables);
        setFetchError(null);
        toast.success("Tables Loaded", `Found ${result.tables.length} tables in your Convex database.`);
      } else {
        setFetchError(result.error || "Failed to fetch tables");
        toast.error("Failed to Load Tables", result.error || "Failed to fetch tables");
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      setFetchError(errorMessage);
      toast.error("Connection Failed", errorMessage);
    } finally {
      setIsFetchingTables(false);
    }
  };

  // Toggle table selection
  const toggleTable = (table: string) => {
    setSelectedTables((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(table)) {
        newSet.delete(table);
      } else {
        newSet.add(table);
      }
      return newSet;
    });
    setErrors((prev) => ({ ...prev, tables: "" }));
  };

  // Select/deselect all tables
  const toggleAllTables = () => {
    if (selectedTables.size === availableTables.length) {
      setSelectedTables(new Set());
    } else {
      setSelectedTables(new Set(availableTables));
    }
    setErrors((prev) => ({ ...prev, tables: "" }));
  };

  // Remove old validation functions - now using validation library
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Get selected tables as array
    const tables = Array.from(selectedTables);
    
    // Use comprehensive validation from library
    const validationResult = validateSyncAppForm({
      name,
      description,
      deploy_key: deployKey,
      tables,
      cron_schedule: cronEnabled ? cronSchedule : undefined,
      cron_enabled: cronEnabled,
    });
    
    if (!validationResult.isValid) {
      setErrors(convertErrors(validationResult.errors));
      return;
    }
    
    // Use sanitized data from validation
    const sanitizedData = validationResult.sanitizedData!;
    
    // Generate automatic table mapping: convex_[app_name]_[table_name]
    const tableMapping: Record<string, string> = {};
    for (const table of sanitizedData.tables) {
      tableMapping[table] = `convex_${sanitizedData.name}_${table}`;
    }
    
    // Submit with sanitized data
    await onSubmit({
      name: sanitizedData.name,
      description: sanitizedData.description,
      deploy_key: sanitizedData.deploy_key,
      tables: sanitizedData.tables,
      table_mapping: tableMapping,
      cron_schedule: sanitizedData.cron_schedule,
      cron_enabled: sanitizedData.cron_enabled,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Application Name */}
      <div>
        <label
          htmlFor="name"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Application Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setErrors((prev) => ({ ...prev, name: "" }));
          }}
          className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.name ? "border-red-500" : "border-gray-300"
          } ${isEdit ? "bg-gray-100 cursor-not-allowed" : ""}`}
          placeholder="e.g., appclinics"
          disabled={isSubmitting || isEdit}
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-600">{errors.name}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          {isEdit 
            ? "Application name cannot be changed after creation"
            : "Unique identifier for this sync application"
          }
        </p>
      </div>

      {/* Application Description */}
      <div>
        <label
          htmlFor="description"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Descrizione Applicazione
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-vertical"
          placeholder="Descrizione opzionale dell'applicazione..."
          rows={3}
          disabled={isSubmitting}
        />
        <p className="mt-1 text-sm text-gray-500">
          Descrizione opzionale per identificare meglio l'applicazione
        </p>
      </div>

      {/* Deploy Key */}
      <div>
        <label
          htmlFor="deploy_key"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Convex Deploy Key <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-2 sm:gap-3">
          <input
            type="text"
            id="deploy_key"
            value={deployKey}
            onChange={(e) => {
              setDeployKey(e.target.value);
              setErrors((prev) => ({ ...prev, deploy_key: "" }));
              // Reset tables when deploy key changes
              setAvailableTables([]);
              setSelectedTables(new Set());
            }}
            className={`flex-1 px-3 sm:px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
              errors.deploy_key ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="dev:project|token"
            disabled={isSubmitting}
          />
          <LoadingButton
            type="button"
            onClick={handleFetchTables}
            isLoading={isFetchingTables}
            loadingText="Loading..."
            disabled={isSubmitting || !deployKey.trim()}
            variant="primary"
            size="md"
            className="shrink-0"
          >
            <span className="hidden sm:inline">Fetch Tables</span>
            <span className="sm:hidden">Fetch</span>
          </LoadingButton>
        </div>
        {errors.deploy_key && (
          <p className="mt-1 text-sm text-red-600">{errors.deploy_key}</p>
        )}
        {fetchError && (
          <p className="mt-1 text-sm text-red-600">{fetchError}</p>
        )}
        <p className="mt-1 text-sm text-gray-500">
          Format: preview:team:project|token, production:team:project|token, or dev:project|token
        </p>
      </div>

      {/* Tables Selection */}
      {availableTables.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Select Tables to Sync <span className="text-red-500">*</span>
            </label>
            <button
              type="button"
              onClick={toggleAllTables}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              {selectedTables.size === availableTables.length
                ? "Deselect All"
                : "Select All"}
            </button>
          </div>
            <div className="border border-gray-300 rounded-md p-4 max-h-64 overflow-y-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {availableTables.map((table) => (
                <label
                  key={table}
                  className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded"
                >
                  <input
                    type="checkbox"
                    checked={selectedTables.has(table)}
                    onChange={() => toggleTable(table)}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    disabled={isSubmitting}
                  />
                  <span className="text-sm text-gray-700 break-all">{table}</span>
                </label>
              ))}
            </div>
          </div>
          {errors.tables && (
            <p className="mt-1 text-sm text-red-600">{errors.tables}</p>
          )}
          <p className="mt-1 text-sm text-gray-500">
            {selectedTables.size} table{selectedTables.size !== 1 ? "s" : ""}{" "}
            selected
          </p>
          <div className="mt-2 p-3 bg-blue-50 rounded-md">
            <p className="text-xs text-blue-700">
              <strong>Note:</strong> Tables will be created in SQL Server with the naming pattern:{" "}
              <code className="bg-blue-100 px-1 py-0.5 rounded">
                convex_{name}_[table_name]
              </code>
            </p>
          </div>
        </div>
      )}

      {/* No Tables Found State */}
      {deployKey && !isFetchingTables && !fetchError && availableTables.length === 0 && (
        <div className="border border-gray-200 rounded-md p-8">
          <div className="text-center">
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
                d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2M4 13h2m13-8V4a1 1 0 00-1-1H7a1 1 0 00-1 1v1m8 0V4a1 1 0 00-1-1H9a1 1 0 00-1 1v1"
              />
            </svg>
            <h3 className="mt-2 text-sm font-medium text-gray-900">No tables found</h3>
            <p className="mt-1 text-sm text-gray-500">
              No tables were found in your Convex database. Make sure your deploy key is correct and your database has tables.
            </p>
            <button
              type="button"
              onClick={handleFetchTables}
              className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              Try Again
            </button>
          </div>
        </div>
      )}

      {/* Cron Schedule */}
      <div className="border-t border-gray-200 pt-6">
        <div className="flex items-center gap-3 mb-4">
          <input
            type="checkbox"
            id="cron_enabled"
            checked={cronEnabled}
            onChange={(e) => setCronEnabled(e.target.checked)}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            disabled={isSubmitting}
          />
          <label
            htmlFor="cron_enabled"
            className="text-sm font-medium text-gray-700"
          >
            Enable Automatic Sync Schedule
          </label>
        </div>

        {cronEnabled && (
          <div>
            <label
              htmlFor="cron_schedule"
              className="block text-sm font-medium text-gray-700 mb-2"
            >
              Cron Schedule <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="cron_schedule"
              value={cronSchedule}
              onChange={(e) => {
                setCronSchedule(e.target.value);
                setErrors((prev) => ({ ...prev, cron_schedule: "" }));
              }}
              className={`w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm ${
                errors.cron_schedule ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="0 2 * * *"
              disabled={isSubmitting}
            />
            {errors.cron_schedule && (
              <p className="mt-1 text-sm text-red-600">{errors.cron_schedule}</p>
            )}
            <p className="mt-1 text-sm text-gray-500">
              Cron expression (e.g., "0 2 * * *" for daily at 2:00 AM)
            </p>
            <div className="mt-2 p-3 bg-blue-50 rounded-md">
              <p className="text-xs text-blue-700">
                <strong>Examples:</strong>
                <br />• "0 2 * * *" - Every day at 2:00 AM
                <br />• "0 */6 * * *" - Every 6 hours
                <br />• "0 0 * * 0" - Every Sunday at midnight
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-gray-200">
        <LoadingButton
          type="submit"
          isLoading={isSubmitting}
          loadingText={isEdit ? "Updating..." : "Creating..."}
          variant="primary"
          size="lg"
          className="flex-1 order-2 sm:order-1"
        >
          {isEdit ? "Update Application" : "Create Application"}
        </LoadingButton>
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="px-6 py-3 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-1 sm:order-2"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
