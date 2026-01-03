/**
 * Input Validation and Sanitization Library
 * Requirements: 10.5 - Sanitize all user inputs and validate formats
 */

import DOMPurify from 'isomorphic-dompurify';

// Validation error type
export interface ValidationError {
  field: string;
  message: string;
}

// Validation result type
export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  sanitizedData?: any;
}

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  if (typeof input !== 'string') return '';
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: [],
  });
}

/**
 * Sanitize general text input
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') return '';
  
  // Remove null bytes and control characters except newlines and tabs
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w@.-]/g, ''); // Only allow word chars, @, ., -
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
}

/**
 * Validate multiple emails (comma-separated)
 */
export function validateEmailList(emails: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!emails.trim()) {
    errors.push({ field: 'emails', message: 'At least one email is required' });
    return errors;
  }
  
  const emailList = emails.split(',').map(e => e.trim()).filter(e => e);
  
  if (emailList.length === 0) {
    errors.push({ field: 'emails', message: 'At least one valid email is required' });
    return errors;
  }
  
  const invalidEmails = emailList.filter(email => !validateEmail(email));
  if (invalidEmails.length > 0) {
    errors.push({
      field: 'emails',
      message: `Invalid email addresses: ${invalidEmails.join(', ')}`
    });
  }
  
  return errors;
}

/**
 * Validate Convex deploy key format
 */
export function validateDeployKey(deployKey: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!deployKey.trim()) {
    errors.push({ field: 'deploy_key', message: 'Deploy key is required' });
    return errors;
  }
  
  // Format: preview:team:project|token, production:team:project|token, or dev:project|token
  const deployKeyRegex = /^(preview|production|dev):[a-zA-Z0-9_-]+(:[a-zA-Z0-9_-]+)?\|[a-zA-Z0-9_=+/]+$/;
  
  if (!deployKeyRegex.test(deployKey.trim())) {
    errors.push({
      field: 'deploy_key',
      message: 'Deploy key must be in format: preview:team:project|token, production:team:project|token, or dev:project|token'
    });
  }
  
  return errors;
}

/**
 * Validate cron schedule format
 */
export function validateCronSchedule(schedule: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!schedule.trim()) {
    return errors; // Empty is allowed if cron is disabled
  }
  
  // Basic cron validation: 5 parts separated by spaces
  const parts = schedule.trim().split(/\s+/);
  if (parts.length !== 5) {
    errors.push({
      field: 'cron_schedule',
      message: 'Cron schedule must have 5 parts: minute hour day month weekday'
    });
    return errors;
  }
  
  // Validate each part
  const validators = [
    { name: 'minute', min: 0, max: 59 },
    { name: 'hour', min: 0, max: 23 },
    { name: 'day', min: 1, max: 31 },
    { name: 'month', min: 1, max: 12 },
    { name: 'weekday', min: 0, max: 7 }, // 0 and 7 are both Sunday
  ];
  
  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const validator = validators[i];
    
    if (!validateCronPart(part, validator.min, validator.max)) {
      errors.push({
        field: 'cron_schedule',
        message: `Invalid ${validator.name} value: ${part}`
      });
    }
  }
  
  return errors;
}

/**
 * Validate individual cron part
 */
function validateCronPart(part: string, min: number, max: number): boolean {
  // Allow * (any value)
  if (part === '*') return true;
  
  // Allow ranges (e.g., 1-5)
  if (part.includes('-')) {
    const [start, end] = part.split('-');
    const startNum = parseInt(start);
    const endNum = parseInt(end);
    return !isNaN(startNum) && !isNaN(endNum) && 
           startNum >= min && startNum <= max &&
           endNum >= min && endNum <= max &&
           startNum <= endNum;
  }
  
  // Allow lists (e.g., 1,3,5)
  if (part.includes(',')) {
    const values = part.split(',');
    return values.every(val => {
      const num = parseInt(val);
      return !isNaN(num) && num >= min && num <= max;
    });
  }
  
  // Allow step values (e.g., */5, 0-23/2)
  if (part.includes('/')) {
    const [range, step] = part.split('/');
    const stepNum = parseInt(step);
    if (isNaN(stepNum) || stepNum <= 0) return false;
    
    if (range === '*') return true;
    
    // Validate range part
    return validateCronPart(range, min, max);
  }
  
  // Single number
  const num = parseInt(part);
  return !isNaN(num) && num >= min && num <= max;
}

/**
 * Validate hostname/IP address
 */
export function validateHostname(hostname: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!hostname.trim()) {
    errors.push({ field: 'hostname', message: 'Hostname is required' });
    return errors;
  }
  
  const sanitized = hostname.trim();
  
  // Check for valid hostname or IP
  const hostnameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
  
  if (!hostnameRegex.test(sanitized) && !ipRegex.test(sanitized)) {
    errors.push({
      field: 'hostname',
      message: 'Invalid hostname or IP address format'
    });
  }
  
  return errors;
}

/**
 * Validate port number
 */
export function validatePort(port: number): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (isNaN(port) || port < 1 || port > 65535) {
    errors.push({
      field: 'port',
      message: 'Port must be between 1 and 65535'
    });
  }
  
  return errors;
}

/**
 * Validate application name
 */
export function validateAppName(name: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!name.trim()) {
    errors.push({ field: 'name', message: 'Application name is required' });
    return errors;
  }
  
  const sanitized = name.trim();
  
  // Only allow alphanumeric, underscore, hyphen
  const nameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!nameRegex.test(sanitized)) {
    errors.push({
      field: 'name',
      message: 'Application name can only contain letters, numbers, underscores, and hyphens'
    });
  }
  
  if (sanitized.length < 2 || sanitized.length > 50) {
    errors.push({
      field: 'name',
      message: 'Application name must be between 2 and 50 characters'
    });
  }
  
  return errors;
}

/**
 * Validate table names
 */
export function validateTableNames(tables: string[]): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!tables || tables.length === 0) {
    errors.push({ field: 'tables', message: 'At least one table is required' });
    return errors;
  }
  
  const tableNameRegex = /^[a-zA-Z][a-zA-Z0-9_]*$/;
  
  for (const table of tables) {
    if (!tableNameRegex.test(table)) {
      errors.push({
        field: 'tables',
        message: `Invalid table name: ${table}. Table names must start with a letter and contain only letters, numbers, and underscores.`
      });
    }
  }
  
  return errors;
}

/**
 * Validate SQL identifier (database, schema, username)
 */
export function validateSqlIdentifier(value: string, fieldName: string): ValidationError[] {
  const errors: ValidationError[] = [];
  
  if (!value.trim()) {
    errors.push({ field: fieldName, message: `${fieldName} is required` });
    return errors;
  }
  
  const sanitized = value.trim();
  
  // SQL identifier rules: start with letter or underscore, contain letters, numbers, underscores
  const sqlIdentifierRegex = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  
  if (!sqlIdentifierRegex.test(sanitized)) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must start with a letter or underscore and contain only letters, numbers, and underscores`
    });
  }
  
  if (sanitized.length > 128) {
    errors.push({
      field: fieldName,
      message: `${fieldName} must be 128 characters or less`
    });
  }
  
  return errors;
}

/**
 * Comprehensive form validation for sync app
 */
export function validateSyncAppForm(data: {
  name: string;
  description?: string;
  deploy_key: string;
  tables: string[];
  cron_schedule?: string;
  cron_enabled: boolean;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Sanitize data
  const sanitizedData = {
    name: sanitizeText(data.name),
    description: data.description ? sanitizeText(data.description) : undefined,
    deploy_key: sanitizeText(data.deploy_key),
    tables: data.tables.map(t => sanitizeText(t)),
    cron_schedule: data.cron_schedule ? sanitizeText(data.cron_schedule) : undefined,
    cron_enabled: data.cron_enabled,
  };
  
  // Validate each field
  errors.push(...validateAppName(sanitizedData.name));
  errors.push(...validateDeployKey(sanitizedData.deploy_key));
  errors.push(...validateTableNames(sanitizedData.tables));
  
  if (sanitizedData.cron_enabled && sanitizedData.cron_schedule) {
    errors.push(...validateCronSchedule(sanitizedData.cron_schedule));
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Comprehensive form validation for SQL config
 */
export function validateSqlConfigForm(data: {
  host: string;
  database: string;
  schema: string;
  username: string;
  password?: string;
  timeout: number;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Sanitize data
  const sanitizedData = {
    host: sanitizeText(data.host),
    database: sanitizeText(data.database),
    schema: sanitizeText(data.schema),
    username: sanitizeText(data.username),
    password: data.password ? data.password : undefined, // Don't sanitize passwords
    timeout: data.timeout,
  };
  
  // Validate each field
  errors.push(...validateHostname(sanitizedData.host));
  errors.push(...validateSqlIdentifier(sanitizedData.database, 'database'));
  errors.push(...validateSqlIdentifier(sanitizedData.schema, 'schema'));
  errors.push(...validateSqlIdentifier(sanitizedData.username, 'username'));
  
  if (isNaN(sanitizedData.timeout) || sanitizedData.timeout < 1 || sanitizedData.timeout > 300) {
    errors.push({
      field: 'timeout',
      message: 'Timeout must be between 1 and 300 seconds'
    });
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}

/**
 * Comprehensive form validation for email config
 */
export function validateEmailConfigForm(data: {
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_password?: string;
  from_email: string;
  to_emails: string;
  use_tls: boolean;
}): ValidationResult {
  const errors: ValidationError[] = [];
  
  // Sanitize data
  const sanitizedData = {
    smtp_host: sanitizeText(data.smtp_host),
    smtp_port: data.smtp_port,
    smtp_user: sanitizeEmail(data.smtp_user),
    smtp_password: data.smtp_password ? data.smtp_password : undefined, // Don't sanitize passwords
    from_email: sanitizeEmail(data.from_email),
    to_emails: sanitizeText(data.to_emails),
    use_tls: data.use_tls,
  };
  
  // Validate each field
  errors.push(...validateHostname(sanitizedData.smtp_host));
  errors.push(...validatePort(sanitizedData.smtp_port));
  
  if (!validateEmail(sanitizedData.smtp_user)) {
    errors.push({ field: 'smtp_user', message: 'Invalid SMTP username email format' });
  }
  
  if (!validateEmail(sanitizedData.from_email)) {
    errors.push({ field: 'from_email', message: 'Invalid from email format' });
  }
  
  errors.push(...validateEmailList(sanitizedData.to_emails));
  
  return {
    isValid: errors.length === 0,
    errors,
    sanitizedData,
  };
}