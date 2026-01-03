'use client';

import { useState, useEffect } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { useAuth } from '@/lib/hooks/useAuth';
import { encrypt } from '@/lib/encryption';
import { LoadingButton } from '@/components/ui';
import { useToastContext } from '@/components/providers/ToastProvider';
import { validateEmailConfigForm, ValidationError } from '@/lib/validation';

interface EmailConfigFormData {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password: string;
  from_email: string;
  to_emails: string;
  use_tls: boolean;
}

export function EmailConfigForm() {
  const { user } = useAuth();
  const toast = useToastContext();
  const emailConfig = useQuery(api.queries.getEmailConfig);
  const updateEmailConfig = useMutation(api.mutations.updateEmailConfig);

  const [formData, setFormData] = useState<EmailConfigFormData>({
    smtp_host: '',
    smtp_port: 587,
    smtp_user: '',
    smtp_password: '',
    from_email: '',
    to_emails: '',
    use_tls: true,
  });

  const [isLoading, setIsLoading] = useState(false);
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
    if (emailConfig) {
      setFormData({
        smtp_host: emailConfig.smtp_host,
        smtp_port: emailConfig.smtp_port,
        smtp_user: emailConfig.smtp_user,
        smtp_password: '', // Don't show encrypted password
        from_email: emailConfig.from_email,
        to_emails: emailConfig.to_emails.join(', '),
        use_tls: emailConfig.use_tls,
      });
    }
  }, [emailConfig]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({
        ...prev,
        [name]: checked,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: name === 'smtp_port' ? parseInt(value) || 0 : value,
      }));
    }
    
    setMessage(null);
    // Clear field-specific errors
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error('Authentication Required', 'User not authenticated');
      return;
    }

    // Use comprehensive validation from library
    const validationResult = validateEmailConfigForm({
      smtp_host: formData.smtp_host,
      smtp_port: formData.smtp_port,
      smtp_user: formData.smtp_user,
      smtp_password: formData.smtp_password,
      from_email: formData.from_email,
      to_emails: formData.to_emails,
      use_tls: formData.use_tls,
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
      
      // Parse to_emails into array
      const toEmailsList = sanitizedData.to_emails.split(',').map((e: string) => e.trim()).filter((e: string) => e);
      
      // Encrypt password before saving
      const encryptedPassword = sanitizedData.smtp_password 
        ? encrypt(sanitizedData.smtp_password) 
        : emailConfig?.smtp_password_encrypted || '';

      await updateEmailConfig({
        smtp_host: sanitizedData.smtp_host,
        smtp_port: sanitizedData.smtp_port,
        smtp_user: sanitizedData.smtp_user,
        smtp_password_encrypted: encryptedPassword,
        from_email: sanitizedData.from_email,
        to_emails: toEmailsList,
        use_tls: sanitizedData.use_tls,
        updated_by: user.sub || 'unknown',
      });

      toast.success('Configuration Saved', 'Email configuration saved successfully');
      
      // Clear password field after save
      setFormData((prev) => ({ ...prev, smtp_password: '' }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save configuration';
      toast.error('Save Failed', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* SMTP Host */}
      <div>
        <label htmlFor="smtp_host" className="block text-sm font-medium text-gray-700">
          SMTP Host *
        </label>
        <input
          type="text"
          id="smtp_host"
          name="smtp_host"
          value={formData.smtp_host}
          onChange={handleChange}
          placeholder="smtp.gmail.com"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.smtp_host || errors.hostname ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {(errors.smtp_host || errors.hostname) && (
          <p className="mt-1 text-sm text-red-600">{errors.smtp_host || errors.hostname}</p>
        )}
      </div>

      {/* SMTP Port */}
      <div>
        <label htmlFor="smtp_port" className="block text-sm font-medium text-gray-700">
          SMTP Port *
        </label>
        <input
          type="number"
          id="smtp_port"
          name="smtp_port"
          value={formData.smtp_port}
          onChange={handleChange}
          min="1"
          max="65535"
          placeholder="587"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.smtp_port || errors.port ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {(errors.smtp_port || errors.port) && (
          <p className="mt-1 text-sm text-red-600">{errors.smtp_port || errors.port}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Common ports: 587 (TLS), 465 (SSL), 25 (unencrypted)
        </p>
      </div>

      {/* SMTP User */}
      <div>
        <label htmlFor="smtp_user" className="block text-sm font-medium text-gray-700">
          SMTP Username *
        </label>
        <input
          type="text"
          id="smtp_user"
          name="smtp_user"
          value={formData.smtp_user}
          onChange={handleChange}
          placeholder="your-email@example.com"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.smtp_user ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.smtp_user && (
          <p className="mt-1 text-sm text-red-600">{errors.smtp_user}</p>
        )}
      </div>

      {/* SMTP Password */}
      <div>
        <label htmlFor="smtp_password" className="block text-sm font-medium text-gray-700">
          SMTP Password {emailConfig && '(leave blank to keep current)'}
        </label>
        <div className="mt-1 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            id="smtp_password"
            name="smtp_password"
            value={formData.smtp_password}
            onChange={handleChange}
            placeholder={emailConfig ? 'Enter new password to change' : 'SMTP password'}
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

      {/* From Email */}
      <div>
        <label htmlFor="from_email" className="block text-sm font-medium text-gray-700">
          From Email *
        </label>
        <input
          type="email"
          id="from_email"
          name="from_email"
          value={formData.from_email}
          onChange={handleChange}
          placeholder="notifications@example.com"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.from_email ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {errors.from_email && (
          <p className="mt-1 text-sm text-red-600">{errors.from_email}</p>
        )}
      </div>

      {/* To Emails */}
      <div>
        <label htmlFor="to_emails" className="block text-sm font-medium text-gray-700">
          Recipient Emails *
        </label>
        <textarea
          id="to_emails"
          name="to_emails"
          value={formData.to_emails}
          onChange={handleChange}
          rows={3}
          placeholder="admin@example.com, team@example.com"
          className={`mt-1 block w-full rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border ${
            errors.to_emails || errors.emails ? 'border-red-500' : 'border-gray-300'
          }`}
          required
        />
        {(errors.to_emails || errors.emails) && (
          <p className="mt-1 text-sm text-red-600">{errors.to_emails || errors.emails}</p>
        )}
        <p className="mt-1 text-xs text-gray-500">
          Separate multiple email addresses with commas
        </p>
      </div>

      {/* Use TLS */}
      <div className="flex items-center">
        <input
          type="checkbox"
          id="use_tls"
          name="use_tls"
          checked={formData.use_tls}
          onChange={handleChange}
          className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
        />
        <label htmlFor="use_tls" className="ml-2 block text-sm text-gray-700">
          Use TLS/STARTTLS encryption
        </label>
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

      {/* Submit Button */}
      <div>
        <LoadingButton
          type="submit"
          isLoading={isLoading}
          loadingText="Saving..."
          variant="primary"
          size="md"
        >
          Save Configuration
        </LoadingButton>
      </div>
    </form>
  );
}
