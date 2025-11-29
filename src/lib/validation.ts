/**
 * Form Validation Utilities
 * Provides type-safe validation with clear error messages
 */

export type ValidationRule<T> = (value: T) => string | null;

export interface FieldValidation<T = unknown> {
  value: T;
  rules: ValidationRule<T>[];
}

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

/**
 * Common validation rules
 */
export const ValidationRules = {
  required: (message = "This field is required"): ValidationRule<unknown> => {
    return (value) => {
      if (value === null || value === undefined || value === "") {
        return message;
      }
      if (typeof value === "string" && value.trim() === "") {
        return message;
      }
      if (Array.isArray(value) && value.length === 0) {
        return message;
      }
      return null;
    };
  },

  email: (message = "Invalid email address"): ValidationRule<string> => {
    return (value) => {
      if (!value) return null; // Use required() for required fields
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return emailRegex.test(value) ? null : message;
    };
  },

  minLength: (min: number, message?: string): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      return value.length >= min
        ? null
        : message || `Must be at least ${min} characters`;
    };
  },

  maxLength: (max: number, message?: string): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      return value.length <= max
        ? null
        : message || `Must be at most ${max} characters`;
    };
  },

  min: (min: number, message?: string): ValidationRule<number> => {
    return (value) => {
      if (value === null || value === undefined) return null;
      return value >= min ? null : message || `Must be at least ${min}`;
    };
  },

  max: (max: number, message?: string): ValidationRule<number> => {
    return (value) => {
      if (value === null || value === undefined) return null;
      return value <= max ? null : message || `Must be at most ${max}`;
    };
  },

  pattern: (regex: RegExp, message = "Invalid format"): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      return regex.test(value) ? null : message;
    };
  },

  url: (message = "Invalid URL"): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      try {
        new URL(value);
        return null;
      } catch {
        return message;
      }
    };
  },

  numeric: (message = "Must be a number"): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      return !isNaN(Number(value)) ? null : message;
    };
  },

  alphanumeric: (message = "Only letters and numbers allowed"): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      return /^[a-zA-Z0-9]+$/.test(value) ? null : message;
    };
  },

  phone: (message = "Invalid phone number"): ValidationRule<string> => {
    return (value) => {
      if (!value) return null;
      // Basic phone validation (adjust regex as needed)
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      return phoneRegex.test(value) && value.replace(/\D/g, "").length >= 10
        ? null
        : message;
    };
  },

  match: (otherValue: unknown, fieldName: string): ValidationRule<unknown> => {
    return (value) => {
      return value === otherValue ? null : `Must match ${fieldName}`;
    };
  },

  custom: <T>(validatorFn: (value: T) => boolean, message: string): ValidationRule<T> => {
    return (value) => {
      return validatorFn(value) ? null : message;
    };
  },
};

/**
 * Validates a single field with multiple rules
 */
export function validateField<T>(value: T, rules: ValidationRule<T>[]): string | null {
  for (const rule of rules) {
    const error = rule(value);
    if (error) return error;
  }
  return null;
}

/**
 * Validates multiple fields
 *
 * @example
 * const result = validateFields({
 *   email: { value: formData.email, rules: [ValidationRules.required(), ValidationRules.email()] },
 *   password: { value: formData.password, rules: [ValidationRules.required(), ValidationRules.minLength(8)] },
 * });
 *
 * if (!result.isValid) {
 *   setErrors(result.errors);
 * }
 */
export function validateFields<T extends Record<string, FieldValidation>>(
  fields: T
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, field] of Object.entries(fields)) {
    const error = validateField(field.value, field.rules);
    if (error) {
      errors[fieldName] = error;
      isValid = false;
    }
  }

  return { isValid, errors };
}

/**
 * Creates a reusable validator function
 *
 * @example
 * const validateApproval = createValidator({
 *   title: [ValidationRules.required(), ValidationRules.minLength(3)],
 *   amount: [ValidationRules.required(), ValidationRules.min(0)],
 * });
 *
 * const result = validateApproval(formData);
 */
export function createValidator<T extends Record<string, unknown>>(
  schema: Record<keyof T, ValidationRule<T[keyof T]>[]>
) {
  return (data: T): ValidationResult => {
    const fields = Object.entries(schema).reduce((acc, [key, rules]) => {
      acc[key] = {
        value: data[key as keyof T],
        rules: rules as ValidationRule<unknown>[],
      };
      return acc;
    }, {} as Record<string, FieldValidation>);

    return validateFields(fields);
  };
}

/**
 * Sanitizes user input to prevent XSS
 */
export function sanitizeInput(input: string): string {
  return input
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;")
    .replace(/\//g, "&#x2F;");
}

/**
 * Validates and sanitizes form data
 */
export function validateAndSanitize<T extends Record<string, unknown>>(
  data: T,
  schema: Record<keyof T, ValidationRule<T[keyof T]>[]>
): {
  isValid: boolean;
  errors: Record<string, string>;
  sanitizedData: T;
} {
  const result = createValidator(schema)(data);

  const sanitizedData = Object.entries(data).reduce((acc, [key, value]) => {
    acc[key as keyof T] = (typeof value === "string" ? sanitizeInput(value) : value) as T[keyof T];
    return acc;
  }, {} as T);

  return {
    ...result,
    sanitizedData,
  };
}
