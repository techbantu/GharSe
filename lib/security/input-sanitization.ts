/**
 * ═══════════════════════════════════════════════════════════════════════════
 * INPUT SANITIZATION & VALIDATION UTILITIES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Purpose: Prevent XSS, SQL Injection, and other injection attacks
 *
 * Security Principles:
 * 1. Never trust user input
 * 2. Validate input type, format, and range
 * 3. Sanitize before storage
 * 4. Escape before display
 * 5. Use Content Security Policy as defense in depth
 *
 * Protection Against:
 * - XSS (Cross-Site Scripting)
 * - SQL Injection (via Prisma parameterized queries)
 * - NoSQL Injection
 * - Command Injection
 * - Path Traversal
 * - HTML Injection
 *
 * @module lib/security/input-sanitization
 * @author GharSe Engineering Team
 * @version 2.0.0
 * @since 2025-11-15
 */

import { logger } from '@/lib/logger';

/**
 * Sanitize HTML input to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 *
 * Use cases:
 * - User names, emails, addresses
 * - Order special instructions
 * - Customer feedback
 * - Any user-provided text that will be displayed
 *
 * @param input - Raw user input
 * @returns Sanitized string safe for display
 */
export function sanitizeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  return (
    input
      // Remove all HTML tags
      .replace(/<[^>]*>/g, '')
      // Remove script tags and their content
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      // Remove event handlers (onclick, onerror, etc.)
      .replace(/on\w+\s*=\s*["'][^"']*["']/gi, '')
      // Remove javascript: and data: protocols
      .replace(/javascript:/gi, '')
      .replace(/data:text\/html/gi, '')
      // Normalize whitespace
      .trim()
  );
}

/**
 * Sanitize input for safe HTML display
 * Escapes HTML special characters
 *
 * Use when you need to display user input as-is but safely
 *
 * @param input - Raw user input
 * @returns HTML-escaped string
 */
export function escapeHtml(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }

  const htmlEscapeMap: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return input.replace(/[&<>"'/]/g, (char) => htmlEscapeMap[char] || char);
}

/**
 * Sanitize email address
 * Validates format and removes dangerous characters
 *
 * @param email - Raw email input
 * @returns Sanitized email or null if invalid
 */
export function sanitizeEmail(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }

  // Basic email validation regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  const trimmed = email.trim().toLowerCase();

  if (!emailRegex.test(trimmed)) {
    logger.warn('Invalid email format', { email: email.substring(0, 5) + '***' });
    return null;
  }

  return trimmed;
}

/**
 * Sanitize phone number
 * Removes all non-numeric characters except + for international prefix
 *
 * @param phone - Raw phone input
 * @returns Sanitized phone number
 */
export function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') {
    return '';
  }

  // Keep only digits and + for international prefix
  return phone.replace(/[^\d+]/g, '');
}

/**
 * Sanitize URL to prevent javascript: and data: protocol injection
 *
 * @param url - Raw URL input
 * @returns Sanitized URL or null if dangerous
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const trimmed = url.trim();

  // Block dangerous protocols
  const dangerousProtocols = /^(javascript|data|vbscript|file):/i;
  if (dangerousProtocols.test(trimmed)) {
    logger.warn('Dangerous URL protocol detected', { url: trimmed.substring(0, 20) });
    return null;
  }

  // Only allow http, https, mailto
  const allowedProtocols = /^(https?|mailto):/i;
  if (trimmed.includes(':') && !allowedProtocols.test(trimmed)) {
    logger.warn('Disallowed URL protocol', { url: trimmed.substring(0, 20) });
    return null;
  }

  return trimmed;
}

/**
 * Sanitize file path to prevent path traversal attacks
 * Removes .. and absolute paths
 *
 * @param path - Raw path input
 * @returns Sanitized path or null if dangerous
 */
export function sanitizeFilePath(path: string): string | null {
  if (!path || typeof path !== 'string') {
    return null;
  }

  // Block path traversal attempts
  if (path.includes('..') || path.startsWith('/')) {
    logger.warn('Path traversal attempt detected', { path });
    return null;
  }

  // Remove dangerous characters
  return path.replace(/[^a-zA-Z0-9._-]/g, '');
}

/**
 * Sanitize JSON input
 * Validates and sanitizes JSON strings
 *
 * @param input - Raw JSON string
 * @returns Parsed and validated JSON or null if invalid
 */
export function sanitizeJson<T = any>(input: string): T | null {
  if (!input || typeof input !== 'string') {
    return null;
  }

  try {
    const parsed = JSON.parse(input);

    // Prevent prototype pollution
    if (parsed.__proto__ || parsed.constructor || parsed.prototype) {
      logger.warn('Prototype pollution attempt detected in JSON');
      return null;
    }

    return parsed as T;
  } catch (error) {
    logger.warn('Invalid JSON input', {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/**
 * Validate and sanitize currency amount
 * Ensures positive number with max 2 decimal places
 *
 * @param amount - Raw amount input
 * @param min - Minimum allowed amount (default: 0)
 * @param max - Maximum allowed amount (default: 1000000)
 * @returns Sanitized amount or null if invalid
 */
export function sanitizeAmount(amount: number | string, min = 0, max = 1000000): number | null {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num) || num < min || num > max) {
    logger.warn('Invalid amount', { amount, min, max });
    return null;
  }

  // Round to 2 decimal places
  return Math.round(num * 100) / 100;
}

/**
 * Sanitize integer input
 * Ensures value is a valid integer within range
 *
 * @param value - Raw input
 * @param min - Minimum allowed value
 * @param max - Maximum allowed value
 * @returns Sanitized integer or null if invalid
 */
export function sanitizeInteger(value: number | string, min: number, max: number): number | null {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (!Number.isInteger(num) || num < min || num > max) {
    logger.warn('Invalid integer', { value, min, max });
    return null;
  }

  return num;
}

/**
 * Sanitize and validate order special instructions
 * Limits length and removes dangerous content
 *
 * @param instructions - Raw instructions
 * @param maxLength - Maximum allowed length (default: 500)
 * @returns Sanitized instructions
 */
export function sanitizeOrderInstructions(instructions: string, maxLength = 500): string {
  if (!instructions || typeof instructions !== 'string') {
    return '';
  }

  // Sanitize HTML first
  let sanitized = sanitizeHtml(instructions);

  // Limit length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
    logger.warn('Order instructions truncated', { originalLength: instructions.length, maxLength });
  }

  return sanitized.trim();
}

/**
 * Sanitize user name
 * Allows letters, spaces, hyphens, apostrophes
 *
 * @param name - Raw name input
 * @returns Sanitized name or null if invalid
 */
export function sanitizeName(name: string): string | null {
  if (!name || typeof name !== 'string') {
    return null;
  }

  // Allow only letters, spaces, hyphens, apostrophes, and dots
  const sanitized = name.replace(/[^a-zA-Z\s\-'\.]/g, '').trim();

  if (sanitized.length < 2 || sanitized.length > 100) {
    logger.warn('Invalid name length', { length: sanitized.length });
    return null;
  }

  return sanitized;
}

/**
 * Sanitize address
 * Removes dangerous characters while allowing common address characters
 *
 * @param address - Raw address input
 * @returns Sanitized address
 */
export function sanitizeAddress(address: string): string {
  if (!address || typeof address !== 'string') {
    return '';
  }

  // Remove HTML and dangerous characters
  let sanitized = sanitizeHtml(address);

  // Allow alphanumeric, spaces, common punctuation, and address characters
  sanitized = sanitized.replace(/[^a-zA-Z0-9\s\-,.'#/]/g, '');

  return sanitized.trim();
}

/**
 * Comprehensive input validator using Zod-like validation
 *
 * Example usage:
 * ```typescript
 * const validator = createValidator({
 *   name: { type: 'string', minLength: 2, maxLength: 100, required: true },
 *   email: { type: 'email', required: true },
 *   age: { type: 'number', min: 0, max: 120 },
 * });
 *
 * const result = validator.validate(userInput);
 * if (!result.success) {
 *   console.error(result.errors);
 * }
 * ```
 */
export interface ValidationRule {
  type: 'string' | 'number' | 'email' | 'phone' | 'url' | 'boolean';
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
}

export interface ValidationResult {
  success: boolean;
  data?: any;
  errors?: Record<string, string>;
}

export function createValidator(rules: Record<string, ValidationRule>) {
  return {
    validate(input: Record<string, any>): ValidationResult {
      const errors: Record<string, string> = {};
      const data: Record<string, any> = {};

      for (const [field, rule] of Object.entries(rules)) {
        const value = input[field];

        // Check required
        if (rule.required && (value === undefined || value === null || value === '')) {
          errors[field] = `${field} is required`;
          continue;
        }

        // Skip validation if not required and no value
        if (!rule.required && (value === undefined || value === null || value === '')) {
          continue;
        }

        // Type-specific validation
        switch (rule.type) {
          case 'email':
            const sanitizedEmail = sanitizeEmail(value);
            if (!sanitizedEmail) {
              errors[field] = `${field} must be a valid email`;
            } else {
              data[field] = sanitizedEmail;
            }
            break;

          case 'phone':
            const sanitizedPhone = sanitizePhone(value);
            if (!sanitizedPhone) {
              errors[field] = `${field} must be a valid phone number`;
            } else {
              data[field] = sanitizedPhone;
            }
            break;

          case 'url':
            const sanitizedUrl = sanitizeUrl(value);
            if (!sanitizedUrl) {
              errors[field] = `${field} must be a valid URL`;
            } else {
              data[field] = sanitizedUrl;
            }
            break;

          case 'number':
            const num = typeof value === 'number' ? value : parseFloat(value);
            if (isNaN(num)) {
              errors[field] = `${field} must be a number`;
            } else if (rule.min !== undefined && num < rule.min) {
              errors[field] = `${field} must be at least ${rule.min}`;
            } else if (rule.max !== undefined && num > rule.max) {
              errors[field] = `${field} must be at most ${rule.max}`;
            } else {
              data[field] = num;
            }
            break;

          case 'string':
            const str = String(value);
            if (rule.minLength && str.length < rule.minLength) {
              errors[field] = `${field} must be at least ${rule.minLength} characters`;
            } else if (rule.maxLength && str.length > rule.maxLength) {
              errors[field] = `${field} must be at most ${rule.maxLength} characters`;
            } else if (rule.pattern && !rule.pattern.test(str)) {
              errors[field] = `${field} format is invalid`;
            } else {
              data[field] = sanitizeHtml(str);
            }
            break;

          case 'boolean':
            data[field] = Boolean(value);
            break;
        }

        // Custom validation
        if (rule.custom && !errors[field]) {
          if (!rule.custom(data[field] || value)) {
            errors[field] = `${field} failed custom validation`;
          }
        }
      }

      if (Object.keys(errors).length > 0) {
        return { success: false, errors };
      }

      return { success: true, data };
    },
  };
}

/**
 * Sanitize all fields in an object
 * Recursively sanitizes all string fields
 *
 * @param obj - Object to sanitize
 * @returns Sanitized object
 */
export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  const sanitized: any = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeHtml(value);
    } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizeObject(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => (typeof item === 'string' ? sanitizeHtml(item) : item));
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized as T;
}

/**
 * Detect potential SQL injection patterns
 * Used for additional security logging (Prisma already prevents SQL injection via parameterized queries)
 *
 * @param input - User input to check
 * @returns true if suspicious patterns detected
 */
export function detectSqlInjection(input: string): boolean {
  if (!input || typeof input !== 'string') {
    return false;
  }

  const sqlPatterns = [
    /(\bOR\b.*=.*)/i, // OR 1=1
    /(\bUNION\b.*\bSELECT\b)/i, // UNION SELECT
    /(\bDROP\b.*\bTABLE\b)/i, // DROP TABLE
    /(\bDELETE\b.*\bFROM\b)/i, // DELETE FROM
    /(\bINSERT\b.*\bINTO\b)/i, // INSERT INTO
    /(--|\/\*|#)/,  // SQL comments
    /(\bEXEC\b|\bEXECUTE\b)/i, // EXEC/EXECUTE
  ];

  return sqlPatterns.some((pattern) => pattern.test(input));
}

/**
 * Log and sanitize suspicious input
 * Use this for user-provided content that seems suspicious
 *
 * @param field - Field name
 * @param value - Field value
 * @param userId - Optional user ID for tracking
 * @returns Sanitized value
 */
export function sanitizeAndLogSuspiciousInput(field: string, value: string, userId?: string): string {
  const sanitized = sanitizeHtml(value);

  // Check for suspicious patterns
  const hasSqlInjection = detectSqlInjection(value);
  const hasScriptTags = /<script/i.test(value);
  const hasEventHandlers = /on\w+\s*=/i.test(value);

  if (hasSqlInjection || hasScriptTags || hasEventHandlers) {
    logger.error('Suspicious input detected', {
      field,
      originalLength: value.length,
      sanitizedLength: sanitized.length,
      hasSqlInjection,
      hasScriptTags,
      hasEventHandlers,
      userId,
      sample: value.substring(0, 50) + '...',
    });
  }

  return sanitized;
}
