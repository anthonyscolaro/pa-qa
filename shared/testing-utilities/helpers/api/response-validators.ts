/**
 * Response Validation Utilities
 * 
 * Comprehensive validation utilities for API responses using Pydantic-style
 * schema validation with TypeScript support for strict type checking.
 */

import { z, ZodSchema, ZodError } from 'zod';

export interface ValidationResult<T = any> {
  isValid: boolean;
  data?: T;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  metadata: {
    validatedAt: Date;
    schema: string;
    responseTime?: number;
    responseSize?: number;
  };
}

export interface ValidationError {
  path: string;
  message: string;
  code: string;
  expected?: any;
  received?: any;
  severity: 'error' | 'critical';
}

export interface ValidationWarning {
  path: string;
  message: string;
  code: string;
  suggestion?: string;
}

export interface ResponseSchema {
  name: string;
  schema: ZodSchema;
  optional?: boolean;
  transform?: (data: any) => any;
}

export interface ValidationConfig {
  strictMode?: boolean;
  allowUnknownFields?: boolean;
  validateHeaders?: boolean;
  validateStatus?: boolean;
  customValidators?: CustomValidator[];
  warningThresholds?: {
    responseTime?: number;
    responseSize?: number;
  };
}

export interface CustomValidator {
  name: string;
  validate: (data: any, context: ValidationContext) => ValidationError[];
}

export interface ValidationContext {
  response: Response;
  headers: Headers;
  status: number;
  responseTime?: number;
  responseSize?: number;
}

/**
 * Common Zod schemas for API responses
 */
export const CommonSchemas = {
  // Basic types
  id: z.union([z.string(), z.number()]),
  timestamp: z.string().datetime(),
  email: z.string().email(),
  url: z.string().url(),
  uuid: z.string().uuid(),
  
  // Pagination
  paginationMeta: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
    hasNext: z.boolean(),
    hasPrev: z.boolean(),
  }),

  paginatedResponse: <T extends ZodSchema>(itemSchema: T) => z.object({
    data: z.array(itemSchema),
    meta: CommonSchemas.paginationMeta,
  }),

  // Error responses
  apiError: z.object({
    error: z.object({
      code: z.string(),
      message: z.string(),
      details: z.any().optional(),
      timestamp: CommonSchemas.timestamp,
      requestId: z.string().optional(),
    }),
  }),

  validationError: z.object({
    error: z.object({
      code: z.literal('VALIDATION_ERROR'),
      message: z.string(),
      fields: z.array(z.object({
        field: z.string(),
        message: z.string(),
        code: z.string(),
      })),
    }),
  }),

  // Success responses
  successResponse: <T extends ZodSchema>(dataSchema: T) => z.object({
    success: z.literal(true),
    data: dataSchema,
    message: z.string().optional(),
  }),

  // User/Auth
  user: z.object({
    id: CommonSchemas.id,
    email: CommonSchemas.email,
    name: z.string(),
    createdAt: CommonSchemas.timestamp,
    updatedAt: CommonSchemas.timestamp,
    isActive: z.boolean(),
    roles: z.array(z.string()).optional(),
  }),

  authToken: z.object({
    accessToken: z.string(),
    refreshToken: z.string().optional(),
    expiresIn: z.number(),
    tokenType: z.string().default('Bearer'),
  }),

  // Common business entities
  address: z.object({
    street: z.string(),
    city: z.string(),
    state: z.string(),
    postalCode: z.string(),
    country: z.string(),
  }),

  money: z.object({
    amount: z.number(),
    currency: z.string().length(3),
  }),

  // HTTP headers
  corsHeaders: z.object({
    'access-control-allow-origin': z.string(),
    'access-control-allow-methods': z.string(),
    'access-control-allow-headers': z.string(),
  }).partial(),

  securityHeaders: z.object({
    'strict-transport-security': z.string(),
    'x-content-type-options': z.string(),
    'x-frame-options': z.string(),
    'x-xss-protection': z.string(),
  }).partial(),
};

/**
 * Response Validator Class
 */
export class ResponseValidator {
  private config: ValidationConfig;
  private schemas: Map<string, ResponseSchema> = new Map();

  constructor(config: ValidationConfig = {}) {
    this.config = {
      strictMode: false,
      allowUnknownFields: true,
      validateHeaders: false,
      validateStatus: true,
      customValidators: [],
      warningThresholds: {
        responseTime: 1000,
        responseSize: 1024 * 1024, // 1MB
      },
      ...config,
    };
  }

  /**
   * Register a schema for validation
   */
  registerSchema(schema: ResponseSchema): void {
    this.schemas.set(schema.name, schema);
  }

  /**
   * Register multiple schemas
   */
  registerSchemas(schemas: ResponseSchema[]): void {
    schemas.forEach(schema => this.registerSchema(schema));
  }

  /**
   * Validate response data against a registered schema
   */
  validate<T = any>(
    schemaName: string,
    data: any,
    context?: Partial<ValidationContext>
  ): ValidationResult<T> {
    const schema = this.schemas.get(schemaName);
    if (!schema) {
      return {
        isValid: false,
        errors: [{
          path: 'schema',
          message: `Schema '${schemaName}' not found`,
          code: 'SCHEMA_NOT_FOUND',
          severity: 'critical',
        }],
        warnings: [],
        metadata: {
          validatedAt: new Date(),
          schema: schemaName,
        },
      };
    }

    return this.validateWithSchema(schema, data, context);
  }

  /**
   * Validate response data against a Zod schema directly
   */
  validateWithSchema<T = any>(
    schema: ResponseSchema | ZodSchema,
    data: any,
    context?: Partial<ValidationContext>
  ): ValidationResult<T> {
    const startTime = performance.now();
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    let validationSchema: ZodSchema;
    let schemaName: string;

    if ('schema' in schema) {
      validationSchema = schema.schema;
      schemaName = schema.name;
      
      // Apply transform if provided
      if (schema.transform) {
        try {
          data = schema.transform(data);
        } catch (error) {
          errors.push({
            path: 'transform',
            message: `Transform function failed: ${(error as Error).message}`,
            code: 'TRANSFORM_ERROR',
            severity: 'error',
          });
        }
      }
    } else {
      validationSchema = schema;
      schemaName = 'inline';
    }

    // Validate against schema
    try {
      const result = validationSchema.parse(data);
      
      // Run custom validators
      if (context && this.config.customValidators) {
        for (const validator of this.config.customValidators) {
          const customErrors = validator.validate(data, context as ValidationContext);
          errors.push(...customErrors);
        }
      }

      // Generate warnings
      this.generateWarnings(data, context, warnings);

      const endTime = performance.now();

      return {
        isValid: errors.length === 0,
        data: result,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          schema: schemaName,
          responseTime: endTime - startTime,
          responseSize: context?.responseSize,
        },
      };
    } catch (error) {
      if (error instanceof ZodError) {
        errors.push(...this.formatZodErrors(error));
      } else {
        errors.push({
          path: 'unknown',
          message: `Validation failed: ${(error as Error).message}`,
          code: 'VALIDATION_ERROR',
          severity: 'error',
        });
      }

      return {
        isValid: false,
        errors,
        warnings,
        metadata: {
          validatedAt: new Date(),
          schema: schemaName,
        },
      };
    }
  }

  /**
   * Validate response headers
   */
  validateHeaders(
    headers: Headers,
    expectedHeaders: Record<string, string | RegExp>
  ): ValidationResult<Record<string, string>> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const result: Record<string, string> = {};

    for (const [key, expected] of Object.entries(expectedHeaders)) {
      const value = headers.get(key);
      
      if (value === null) {
        errors.push({
          path: `headers.${key}`,
          message: `Missing required header: ${key}`,
          code: 'MISSING_HEADER',
          severity: 'error',
        });
        continue;
      }

      result[key] = value;

      if (typeof expected === 'string') {
        if (value !== expected) {
          errors.push({
            path: `headers.${key}`,
            message: `Header value mismatch`,
            code: 'HEADER_VALUE_MISMATCH',
            expected,
            received: value,
            severity: 'error',
          });
        }
      } else if (expected instanceof RegExp) {
        if (!expected.test(value)) {
          errors.push({
            path: `headers.${key}`,
            message: `Header value doesn't match pattern`,
            code: 'HEADER_PATTERN_MISMATCH',
            expected: expected.toString(),
            received: value,
            severity: 'error',
          });
        }
      }
    }

    return {
      isValid: errors.length === 0,
      data: result,
      errors,
      warnings,
      metadata: {
        validatedAt: new Date(),
        schema: 'headers',
      },
    };
  }

  /**
   * Validate status code
   */
  validateStatus(
    status: number,
    expected: number | number[] | ((status: number) => boolean)
  ): ValidationResult<number> {
    const errors: ValidationError[] = [];
    let isValid = false;

    if (typeof expected === 'number') {
      isValid = status === expected;
    } else if (Array.isArray(expected)) {
      isValid = expected.includes(status);
    } else if (typeof expected === 'function') {
      isValid = expected(status);
    }

    if (!isValid) {
      errors.push({
        path: 'status',
        message: `Unexpected status code`,
        code: 'STATUS_CODE_MISMATCH',
        expected,
        received: status,
        severity: 'error',
      });
    }

    return {
      isValid,
      data: status,
      errors,
      warnings: [],
      metadata: {
        validatedAt: new Date(),
        schema: 'status',
      },
    };
  }

  /**
   * Format Zod errors into our error format
   */
  private formatZodErrors(zodError: ZodError): ValidationError[] {
    return zodError.errors.map(error => ({
      path: error.path.join('.'),
      message: error.message,
      code: error.code,
      expected: 'expected' in error ? error.expected : undefined,
      received: 'received' in error ? error.received : undefined,
      severity: 'error' as const,
    }));
  }

  /**
   * Generate warnings based on thresholds and best practices
   */
  private generateWarnings(
    data: any,
    context?: Partial<ValidationContext>,
    warnings: ValidationWarning[] = []
  ): void {
    if (!context) return;

    // Response time warning
    if (
      this.config.warningThresholds?.responseTime &&
      context.responseTime &&
      context.responseTime > this.config.warningThresholds.responseTime
    ) {
      warnings.push({
        path: 'performance.responseTime',
        message: `Response time (${context.responseTime}ms) exceeds threshold`,
        code: 'SLOW_RESPONSE',
        suggestion: 'Consider optimizing the API endpoint or increasing timeout',
      });
    }

    // Response size warning
    if (
      this.config.warningThresholds?.responseSize &&
      context.responseSize &&
      context.responseSize > this.config.warningThresholds.responseSize
    ) {
      warnings.push({
        path: 'performance.responseSize',
        message: `Response size (${context.responseSize} bytes) is large`,
        code: 'LARGE_RESPONSE',
        suggestion: 'Consider implementing pagination or compression',
      });
    }

    // Security headers warning
    if (context.headers && this.config.validateHeaders) {
      const securityHeaders = ['strict-transport-security', 'x-content-type-options'];
      securityHeaders.forEach(header => {
        if (!context.headers!.has(header)) {
          warnings.push({
            path: `headers.${header}`,
            message: `Missing security header: ${header}`,
            code: 'MISSING_SECURITY_HEADER',
            suggestion: 'Add security headers to improve response security',
          });
        }
      });
    }
  }
}

/**
 * Factory functions for common validation scenarios
 */
export const createResponseValidator = (config?: ValidationConfig): ResponseValidator => {
  return new ResponseValidator(config);
};

export const createStrictValidator = (): ResponseValidator => {
  return new ResponseValidator({
    strictMode: true,
    allowUnknownFields: false,
    validateHeaders: true,
    validateStatus: true,
  });
};

export const createPerformanceValidator = (thresholds: {
  responseTime?: number;
  responseSize?: number;
}): ResponseValidator => {
  return new ResponseValidator({
    warningThresholds: thresholds,
    customValidators: [
      {
        name: 'performance',
        validate: (data, context) => {
          const errors: ValidationError[] = [];
          
          if (thresholds.responseTime && context.responseTime && 
              context.responseTime > thresholds.responseTime * 2) {
            errors.push({
              path: 'performance.responseTime',
              message: 'Response time critically slow',
              code: 'CRITICAL_SLOW_RESPONSE',
              severity: 'critical',
            });
          }
          
          return errors;
        },
      },
    ],
  });
};

/**
 * Utility functions for common validation patterns
 */
export const validateApiResponse = <T>(
  response: any,
  schema: ZodSchema<T>,
  context?: Partial<ValidationContext>
): ValidationResult<T> => {
  const validator = new ResponseValidator();
  return validator.validateWithSchema(schema, response, context);
};

export const validatePaginatedResponse = <T>(
  response: any,
  itemSchema: ZodSchema<T>
): ValidationResult<{ data: T[]; meta: any }> => {
  const schema = CommonSchemas.paginatedResponse(itemSchema);
  return validateApiResponse(response, schema);
};

export const validateErrorResponse = (response: any): ValidationResult => {
  return validateApiResponse(response, CommonSchemas.apiError);
};

/**
 * Assertion helpers for testing frameworks
 */
export const assertValidResponse = <T>(
  response: any,
  schema: ZodSchema<T>,
  context?: Partial<ValidationContext>
): asserts response is T => {
  const result = validateApiResponse(response, schema, context);
  
  if (!result.isValid) {
    const errorMessages = result.errors.map(e => `${e.path}: ${e.message}`).join(', ');
    throw new Error(`Response validation failed: ${errorMessages}`);
  }
};

export const assertValidHeaders = (
  headers: Headers,
  expectedHeaders: Record<string, string | RegExp>
): void => {
  const validator = new ResponseValidator();
  const result = validator.validateHeaders(headers, expectedHeaders);
  
  if (!result.isValid) {
    const errorMessages = result.errors.map(e => `${e.path}: ${e.message}`).join(', ');
    throw new Error(`Header validation failed: ${errorMessages}`);
  }
};

export const assertValidStatus = (
  status: number,
  expected: number | number[] | ((status: number) => boolean)
): void => {
  const validator = new ResponseValidator();
  const result = validator.validateStatus(status, expected);
  
  if (!result.isValid) {
    const errorMessages = result.errors.map(e => e.message).join(', ');
    throw new Error(`Status validation failed: ${errorMessages}`);
  }
};