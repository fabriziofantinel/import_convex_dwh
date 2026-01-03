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
      // Update the app schedule in Convex
      await updateApp({
        id: appId as Id<"sync_apps">,
        cron_schedule: scheduleForm.cron_schedule.trim(),
        cron_enabled: scheduleForm.cron_enabled,
      });
      
      // If scheduling is enabled, update Vercel cron job
      if (scheduleForm.cron_enabled) {
        try {
          const response = await fetch('/api/update-cron-schedule', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              cron_schedule: scheduleForm.cron_schedule.trim()
            })
          });
          
          const result = await response.json();
          
          if (result.success) {
            if (result.github_updated) {
              alert(`Schedulazione aggiornata con successo!\n\nOrario Roma: ${result.rome_schedule}\nOrario UTC: ${result.utc_schedule}\n\nIl file vercel.json è stato aggiornato su GitHub.\nVercel farà il deployment automaticamente.`);
            } else {
              alert(`Schedulazione aggiornata!\n\nOrario Roma: ${result.rome_schedule}\nOrario UTC: ${result.utc_schedule}\n\nATTENZIONE: Errore nell'aggiornamento automatico.\nÈ necessario aggiornare manualmente il vercel.json.`);
            }
          } else {
            console.error('Failed to update Vercel cron:', result.error);
            alert("Schedulazione salvata nell'app, ma errore nell'aggiornamento del cron job di Vercel. Potrebbe essere necessario un deployment manuale.");
          }
        } catch (cronError) {
          console.error('Error updating Vercel cron:', cronError);
          alert("Schedulazione salvata nell'app, ma errore nell'aggiornamento del cron job di Vercel. Potrebbe essere necessario un deployment manuale.");
        }
      }
      
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
    
    // Parse cron expression to show Rome time
    const cronParts = cronSchedule.split(' ');
    if (cronParts.length >= 2) {
      const minute = cronParts[0];
      const hour = cronParts[1];
      
      if (minute !== '*' && hour !== '*') {
        // The cron schedule is stored in Rome time, so display it directly
        const romeHour = parseInt(hour);
        const romeMinute = parseInt(minute);
        
        return `Daily at ${romeHour.toString().padStart(2, '0')}:${romeMinute.toString().padStart(2, '0')} (Rome time)`;
      }
    }
    
    // Common cron patterns with Rome time (stored as Rome time, not UTC)
    const patterns: Record<string, string> = {
      "15 0 * * *": "Daily at 00:15 (Rome time)",
      "0 2 * * *": "Daily at 02:00 (Rome time)", 
      "0 6 * * *": "Daily at 06:00 (Rome time)",
      "0 12 * * *": "Daily at 12:00 (Rome time)",
      "31 23 * * *": "Daily at 23:31 (Rome time)",
      "15 23 * * 0": "Weekly on Sunday at 23:15 (Rome time)",
      "15 23 1 * *": "Monthly on the 1st at 23:15 (Rome time)",
    };
    
    return patterns[cronSchedule] || `${cronSchedule} (Rome time)`;
  };

  const cronPresets = [
    { label: "Daily at 00:15 (Rome)", value: "15 0 * * *" },
    { label: "Daily at 02:00 (Rome)", value: "0 2 * * *" },
    { label: "Daily at 06:00 (Rome)", value: "0 6 * * *" },
    { label: "Daily at 12:00 (Rome)", value: "0 12 * * *" },
    { label: "Daily at 23:31 (Rome)", value: "31 23 * * *" },
    { label: "Weekly Sunday 23:15 (Rome)", value: "15 23 * * 0" },
    { label: "Monthly 1st 23:15 (Rome)", value: "15 23 1 * *" },
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
                Fuso Orario e Limitazioni Vercel
              </h3>
              <div className="text-sm text-blue-700 mt-1 space-y-1">
                <p>• <strong>Fuso Orario:</strong> Gli orari sono riferiti al fuso orario di Roma (CET/CEST)</p>
                <p>• <strong>Conversione UTC:</strong> Il sistema converte automaticamente in UTC per Vercel</p>
                <p>• <strong>Vercel Free Tier:</strong> Supporta solo cron job giornalieri (una volta al giorno)</p>
              </div>
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
            Formato Cron e Fuso Orario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Formato Cron (Orario Roma)</h4>
              <code className="text-sm bg-white px-2 py-1 rounded border">
                minute hour day month weekday
              </code>
              <p className="text-sm text-gray-600 mt-2">
                Inserisci l'orario desiderato in fuso orario di Roma. Il sistema convertirà automaticamente in UTC per Vercel.
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Esempi (Orario Roma)</h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li><code>15 0 * * *</code> - Giornaliero alle 00:15</li>
                <li><code>0 2 * * *</code> - Giornaliero alle 02:00</li>
                <li><code>0 6 * * *</code> - Giornaliero alle 06:00</li>
                <li><code>31 23 * * *</code> - Giornaliero alle 23:31</li>
              </ul>
            </div>
          </div>
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
            <p className="text-sm text-green-800">
              <strong>Aggiornamento Automatico:</strong> Quando salvi una nuova schedulazione, 
              il sistema aggiorna automaticamente il cron job di Vercel e triggera un nuovo deployment 
              per applicare le modifiche.
            </p>
          </div>
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>Nota Ora Legale:</strong> Durante l'ora legale (CEST), Roma è UTC+2. 
              Il sistema attualmente usa UTC+1 (ora solare). Durante l'ora legale, 
              la conversione potrebbe avere 1 ora di differenza.
            </p>
          </div>
        </div>
      </DashboardLayout>
    </ProtectedRoute>
  );
}