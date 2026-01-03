'use client';

import { useState } from 'react';
import { ProtectedRoute } from '@/components/auth';
import { DashboardLayout } from '@/components/layout';
import { SqlConfigForm } from '@/components/settings/SqlConfigForm';
import { EmailConfigForm } from '@/components/settings/EmailConfigForm';

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <DashboardLayout>
        <SettingsContent />
      </DashboardLayout>
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const [activeTab, setActiveTab] = useState<'sql' | 'email'>('sql');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
        <p className="mt-2 text-sm text-gray-600">
          Configure global SQL Server and email notification settings
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-4 sm:space-x-8 overflow-x-auto">
          <button
            onClick={() => setActiveTab('sql')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0
              ${
                activeTab === 'sql'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="hidden sm:inline">SQL Server Configuration</span>
            <span className="sm:hidden">SQL Server</span>
          </button>
          <button
            onClick={() => setActiveTab('email')}
            className={`
              whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm shrink-0
              ${
                activeTab === 'email'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            <span className="hidden sm:inline">Email Configuration</span>
            <span className="sm:hidden">Email</span>
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        {activeTab === 'sql' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              SQL Server Configuration
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure the SQL Server connection settings used by all sync applications.
            </p>
            <SqlConfigForm />
          </div>
        )}
        
        {activeTab === 'email' && (
          <div>
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Email Configuration
            </h2>
            <p className="text-sm text-gray-600 mb-6">
              Configure SMTP settings for email notifications when syncs fail or recover.
            </p>
            <EmailConfigForm />
          </div>
        )}
      </div>
    </div>
  );
}
