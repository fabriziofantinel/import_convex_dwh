'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { encrypt } from '@/lib/encryption';
import { LoadingButton } from '@/components/ui';
import { useToastContext } from '@/components/providers/ToastProvider';
import { validateSqlConfigForm, ValidationError } from '@/lib/validation';

interface SqlConfigFormData {
  host: string;
  database: string;
  schema: string;
  username: string;
  password: string;
  timeout: number;
}

export function SqlConfigForm() {
  const { user } = useAuth();
  const toast = useToastContext();
  const sqlConfig = useQuery(api.queries.getSqlConfig);
  const updateSqlConfig = useMutation(api.mutations.updateSqlConfig);

  const [formData, setFormData] = useState<SqlConfigFormData>({
    host: '',
    database: '',
    schema: '',
    username: '',
    password: '',
    timeout: 30,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Convert ValidationError[] to Record<string, string>
  const convertErrors = (validationErrors: ValidationError[]): Record<string, string> => {
    const errorMap: Record<string, string> = {};
    validationErrors.forEach(error => {
      errorMap[error.field] = error.message;
    });
    return errorMap;
  };

  // Load existing config
  useEffect(() => {
    if (sqlConfig) {
      setFormData({
        host: sqlConfig.host,
        database: sqlConfig.database,
        schema: sqlConfig.schema,
        username: sqlConfig.username,
        password: '', // Don't show encrypted password
        timeout: sqlConfig.timeout,
      });
    }
  }, [sqlConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'timeout' ? parseInt(value) || 0 : value,
    }));
    setMessage(null);
    // Clear field-specific errors
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    setMessage(null);

    try {
      // In a real implementation, this would call a Convex action
      // that tests the SQL connection on the webhook server
      // For now, we'll simulate a test
      await new Promise((resolve) => setTimeout(resolve, 1500));
      
      // TODO: Implement actual connection test via webhook
      toast.success("Connection Test Successful", "Note: This is a simulated test. Implement actual test via webhook.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection test failed';
      toast.error("Connection Test Failed", errorMessage);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Authentication Required', 'User not authenticated');
      return;
    }

    // Use comprehensive validation from library
    const validationResult = validateSqlConfigForm({
      host: formData.host,
      database: formData.database,
      schema: formData.schema,
      username: formData.username,
      password: formData.password,
      timeout: formData.timeout,
    });

    if (!validationResult.isValid) {
      setErrors(convertErrors(validationResult.errors));
      toast.error('Validation Error', 'Please fix the validation errors');
      return;
    }

    setIsLoading(true);
    setMessage(null);
    setErrors({});

    try {
      // Use sanitized data from validation
      const sanitizedData = validationResult.sanitizedData!;
      
      // Encrypt password before saving
      const encryptedPassword = sanitizedData.password 
        ? encrypt(sanitizedData.password) 
        : sqlConfig?.password_encrypted || '';

      await updateSqlConfig({
        host: sanitizedData.host,
        database: sanitizedData.database,
        schema: sanitizedData.schema,
        username: sanitizedData.username,
        password_encrypted: encryptedPassword,
        timeout: sanitizedData.timeout,
        updated_by: user.sub || 'unknown',
      });

      toast.success('Configuration Saved', 'SQL configuration saved successfully');
      
      // Clear password field after save
      setFormData((prev) => ({ ...prev, password: '' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error('Save Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Host */}
      <div>
        <label htmlFor="host" className="block text-sm font-medium text-gray-700">
          Host *
        </label>
        <input
          type="text"
          id="host"
          name="host"
          value={formData.host}
          onChange={handleChange}
          placeholder="localhost or IP address"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.host || errors.hostname ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {(errors.host || errors.hostname) && (
          <p className="mt-1 text-sm text-red-600">{errors.host || errors.hostname}</p>
        )}
      </div>

      {/* Database */}
      <div>
        <label htmlFor="database" className="block text-sm font-medium text-gray-700">
          Database *
        </label>
        <input
          type="text"
          id="database"
          name="database"
          value={formData.database}
          onChange={handleChange}
          placeholder="Database name"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.database ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.database && (
          <p className="mt-1 text-sm text-red-600">{errors.database}</p>
        )}
      </div>

      {/* Schema */}
      <div>
        <label htmlFor="schema" className="block text-sm font-medium text-gray-700">
          Schema *
        </label>
        <input
          type="text"
          id="schema"
          name="schema"
          value={formData.schema}
          onChange={handleChange}
          placeholder="dbo"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.schema ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.schema && (
          <p className="mt-1 text-sm text-red-600">{errors.schema}</p>
        )}
      </div>

      {/* Username */}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
          Username *
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          placeholder="SQL Server username"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.username ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username}</p>
        )}
      </div>

      {/* Password */}
      <div>
        <label htmlFor="password" className="block text-sm font-medium text-gray-700">
          Password {sqlConfig && '(leave blank to keep current)'}
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder={sqlConfig ? 'Enter new password to change' : 'SQL Server password'}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
          >
            {showPassword ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Timeout */}
      <div>
        <label htmlFor="timeout" className="block text-sm font-medium text-gray-700">
          Timeout (seconds)
        </label>
        <input
          type="number"
          id="timeout"
          name="timeout"
          value={formData.timeout}
          onChange={handleChange}
          min="1"
          max="300"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.timeout ? 'border-red-500' : 'border-gray-300'
          }`}
        />
        {errors.timeout && (
          <p className="mt-1 text-sm text-red-600">{errors.timeout}</p>
        )}
      </div>

      {/* Message */}
      {message && (
        <div
          className={`rounded-md p-4 ${
            message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}
        >
          <p className="text-sm">{message.text}</p>
        </div>
      )}

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Saving..."
          variant="primary"
          size="md"
          className="flex-1 sm:flex-none"
        >
          Save Configuration
        </LoadingButton>

        <LoadingButton
          type="button"
          onClick={handleTestConnection}
          isLoading={isTesting}
          loadingText="Testing..."
          disabled={!formData.host || !formData.database}
          variant="secondary"
          size="md"
          className="flex-1 sm:flex-none"
        >
          Test Connection
        </LoadingButton>
      </div>
    </form>
  );
}
