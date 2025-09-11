/**
 * GraphQL Testing Utilities
 * 
 * Comprehensive utilities for testing GraphQL APIs including query validation,
 * schema testing, performance monitoring, and error handling.
 */

import { ApiClient, ApiResponse } from './api-client';

export interface GraphQLQuery {
  query: string;
  variables?: Record<string, any>;
  operationName?: string;
}

export interface GraphQLResponse<T = any> {
  data?: T;
  errors?: GraphQLError[];
  extensions?: Record<string, any>;
}

export interface GraphQLError {
  message: string;
  locations?: Array<{ line: number; column: number }>;
  path?: Array<string | number>;
  extensions?: Record<string, any>;
}

export interface GraphQLSchema {
  types: GraphQLType[];
  queries: GraphQLField[];
  mutations: GraphQLField[];
  subscriptions: GraphQLField[];
}

export interface GraphQLType {
  name: string;
  kind: 'SCALAR' | 'OBJECT' | 'INTERFACE' | 'UNION' | 'ENUM' | 'INPUT_OBJECT';
  fields?: GraphQLField[];
  enumValues?: Array<{ name: string; description?: string }>;
  inputFields?: GraphQLField[];
}

export interface GraphQLField {
  name: string;
  type: string;
  args?: GraphQLArgument[];
  description?: string;
  isDeprecated?: boolean;
  deprecationReason?: string;
}

export interface GraphQLArgument {
  name: string;
  type: string;
  defaultValue?: any;
  description?: string;
}

export interface GraphQLTestCase {
  name: string;
  query: GraphQLQuery;
  expectedResponse?: {
    hasData?: boolean;
    hasErrors?: boolean;
    dataValidation?: (data: any) => boolean | string;
    errorValidation?: (errors: GraphQLError[]) => boolean | string;
  };
  performance?: {
    maxResponseTime?: number;
    maxComplexity?: number;
    maxDepth?: number;
  };
}

export interface GraphQLTestResult {
  testName: string;
  passed: boolean;
  duration: number;
  response?: GraphQLResponse;
  errors: string[];
  warnings: string[];
  performance: {
    responseTime: number;
    complexity?: number;
    depth?: number;
    fieldCount?: number;
  };
  coverage?: {
    queriedFields: string[];
    totalFields: number;
    coverage: number; // percentage
  };
}

export interface QueryComplexityOptions {
  maxComplexity: number;
  maxDepth: number;
  scalarCost?: number;
  objectCost?: number;
  listFactor?: number;
  introspectionCost?: number;
}

/**
 * GraphQL Test Client
 */
export class GraphQLTestClient {
  private client: ApiClient;
  private endpoint: string;
  private schema?: GraphQLSchema;

  constructor(client: ApiClient, endpoint: string = '/graphql') {
    this.client = client;
    this.endpoint = endpoint;
  }

  /**
   * Execute a GraphQL query
   */
  async query<T = any>(
    query: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    const payload: GraphQLQuery = {
      query,
      variables,
      operationName,
    };

    return this.client.post<GraphQLResponse<T>>(this.endpoint, payload);
  }

  /**
   * Execute a GraphQL mutation
   */
  async mutate<T = any>(
    mutation: string,
    variables?: Record<string, any>,
    operationName?: string
  ): Promise<ApiResponse<GraphQLResponse<T>>> {
    return this.query<T>(mutation, variables, operationName);
  }

  /**
   * Fetch and cache the GraphQL schema
   */
  async fetchSchema(): Promise<GraphQLSchema> {
    const introspectionQuery = `
      query IntrospectionQuery {
        __schema {
          types {
            name
            kind
            description
            fields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
              args {
                name
                type {
                  name
                  kind
                  ofType {
                    name
                    kind
                  }
                }
                defaultValue
                description
              }
              description
              isDeprecated
              deprecationReason
            }
            enumValues {
              name
              description
              isDeprecated
              deprecationReason
            }
            inputFields {
              name
              type {
                name
                kind
                ofType {
                  name
                  kind
                }
              }
              defaultValue
              description
            }
          }
          queryType {
            name
            fields {
              name
              type {
                name
                kind
              }
              args {
                name
                type {
                  name
                  kind
                }
                defaultValue
              }
              description
              isDeprecated
              deprecationReason
            }
          }
          mutationType {
            name
            fields {
              name
              type {
                name
                kind
              }
              args {
                name
                type {
                  name
                  kind
                }
                defaultValue
              }
              description
              isDeprecated
              deprecationReason
            }
          }
          subscriptionType {
            name
            fields {
              name
              type {
                name
                kind
              }
              args {
                name
                type {
                  name
                  kind
                }
                defaultValue
              }
              description
              isDeprecated
              deprecationReason
            }
          }
        }
      }
    `;

    const response = await this.query(introspectionQuery);
    const schemaData = response.data.data?.__schema;

    if (!schemaData) {
      throw new Error('Failed to fetch GraphQL schema');
    }

    this.schema = this.parseSchema(schemaData);
    return this.schema;
  }

  /**
   * Run a test case
   */
  async runTest(testCase: GraphQLTestCase): Promise<GraphQLTestResult> {
    const startTime = performance.now();
    const errors: string[] = [];
    const warnings: string[] = [];

    try {
      // Validate query complexity and depth if schema is available
      if (this.schema && testCase.performance) {
        const complexityResult = this.analyzeComplexity(testCase.query.query, testCase.performance);
        if (complexityResult.complexity > (testCase.performance.maxComplexity || 1000)) {
          errors.push(`Query complexity ${complexityResult.complexity} exceeds limit ${testCase.performance.maxComplexity}`);
        }
        if (complexityResult.depth > (testCase.performance.maxDepth || 15)) {
          errors.push(`Query depth ${complexityResult.depth} exceeds limit ${testCase.performance.maxDepth}`);
        }
      }

      // Execute the query
      const response = await this.query(
        testCase.query.query,
        testCase.query.variables,
        testCase.query.operationName
      );

      const endTime = performance.now();
      const duration = endTime - startTime;

      // Validate response time
      if (testCase.performance?.maxResponseTime && duration > testCase.performance.maxResponseTime) {
        errors.push(`Response time ${duration}ms exceeds limit ${testCase.performance.maxResponseTime}ms`);
      }

      // Validate response structure
      if (testCase.expectedResponse) {
        const validationErrors = this.validateResponse(response.data, testCase.expectedResponse);
        errors.push(...validationErrors);
      }

      // Calculate performance metrics
      const performance = {
        responseTime: duration,
        complexity: this.schema ? this.calculateComplexity(testCase.query.query) : undefined,
        depth: this.calculateDepth(testCase.query.query),
        fieldCount: this.countFields(testCase.query.query),
      };

      // Calculate coverage if schema is available
      const coverage = this.schema ? this.calculateCoverage(testCase.query.query) : undefined;

      return {
        testName: testCase.name,
        passed: errors.length === 0,
        duration,
        response: response.data,
        errors,
        warnings,
        performance,
        coverage,
      };

    } catch (error) {
      const endTime = performance.now();
      const duration = endTime - startTime;

      return {
        testName: testCase.name,
        passed: false,
        duration,
        errors: [(error as Error).message],
        warnings,
        performance: {
          responseTime: duration,
          depth: 0,
          fieldCount: 0,
        },
      };
    }
  }

  /**
   * Run multiple test cases
   */
  async runTestSuite(testCases: GraphQLTestCase[]): Promise<{
    results: GraphQLTestResult[];
    summary: {
      total: number;
      passed: number;
      failed: number;
      duration: number;
      averageResponseTime: number;
    };
  }> {
    const startTime = performance.now();
    const results: GraphQLTestResult[] = [];

    for (const testCase of testCases) {
      const result = await this.runTest(testCase);
      results.push(result);
    }

    const endTime = performance.now();
    const totalDuration = endTime - startTime;
    const passed = results.filter(r => r.passed).length;
    const avgResponseTime = results.reduce((sum, r) => sum + r.performance.responseTime, 0) / results.length;

    return {
      results,
      summary: {
        total: testCases.length,
        passed,
        failed: testCases.length - passed,
        duration: totalDuration,
        averageResponseTime: avgResponseTime,
      },
    };
  }

  /**
   * Test all queries in the schema
   */
  async testAllQueries(options: {
    maxDepth?: number;
    maxComplexity?: number;
    generateVariables?: boolean;
    skipDeprecated?: boolean;
  } = {}): Promise<GraphQLTestResult[]> {
    if (!this.schema) {
      await this.fetchSchema();
    }

    const testCases: GraphQLTestCase[] = [];
    const opts = {
      maxDepth: 5,
      maxComplexity: 100,
      generateVariables: true,
      skipDeprecated: false,
      ...options,
    };

    for (const query of this.schema!.queries) {
      if (opts.skipDeprecated && query.isDeprecated) {
        continue;
      }

      const queryString = this.generateQuery(query, opts.maxDepth);
      const variables = opts.generateVariables ? this.generateVariables(query) : undefined;

      testCases.push({
        name: `Query: ${query.name}`,
        query: {
          query: queryString,
          variables,
        },
        performance: {
          maxResponseTime: 5000,
          maxComplexity: opts.maxComplexity,
          maxDepth: opts.maxDepth,
        },
      });
    }

    const results = await this.runTestSuite(testCases);
    return results.results;
  }

  /**
   * Load test GraphQL endpoint
   */
  async loadTest(
    query: GraphQLQuery,
    options: {
      concurrency: number;
      duration: number; // milliseconds
      rampUp?: number; // milliseconds
    }
  ): Promise<{
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
    averageResponseTime: number;
    minResponseTime: number;
    maxResponseTime: number;
    requestsPerSecond: number;
    errors: Array<{ error: string; count: number }>;
  }> {
    const startTime = performance.now();
    const endTime = startTime + options.duration;
    const responseTimes: number[] = [];
    const errors: Map<string, number> = new Map();
    let totalRequests = 0;
    let successfulRequests = 0;

    // Create workers with optional ramp-up
    const workers = [];
    const rampUpDelay = options.rampUp ? options.rampUp / options.concurrency : 0;

    for (let i = 0; i < options.concurrency; i++) {
      const worker = this.createLoadTestWorker(
        query,
        endTime,
        responseTimes,
        errors,
        () => { totalRequests++; },
        () => { successfulRequests++; }
      );

      if (rampUpDelay > 0) {
        setTimeout(() => worker, i * rampUpDelay);
      } else {
        workers.push(worker);
      }
    }

    await Promise.all(workers);

    const actualDuration = performance.now() - startTime;
    const failedRequests = totalRequests - successfulRequests;

    return {
      totalRequests,
      successfulRequests,
      failedRequests,
      averageResponseTime: responseTimes.length > 0 
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
        : 0,
      minResponseTime: responseTimes.length > 0 ? Math.min(...responseTimes) : 0,
      maxResponseTime: responseTimes.length > 0 ? Math.max(...responseTimes) : 0,
      requestsPerSecond: totalRequests / (actualDuration / 1000),
      errors: Array.from(errors.entries()).map(([error, count]) => ({ error, count })),
    };
  }

  /**
   * Parse schema from introspection result
   */
  private parseSchema(schemaData: any): GraphQLSchema {
    const types = schemaData.types.map((type: any) => ({
      name: type.name,
      kind: type.kind,
      fields: type.fields?.map((field: any) => ({
        name: field.name,
        type: this.getTypeString(field.type),
        args: field.args?.map((arg: any) => ({
          name: arg.name,
          type: this.getTypeString(arg.type),
          defaultValue: arg.defaultValue,
          description: arg.description,
        })),
        description: field.description,
        isDeprecated: field.isDeprecated,
        deprecationReason: field.deprecationReason,
      })),
      enumValues: type.enumValues?.map((enumValue: any) => ({
        name: enumValue.name,
        description: enumValue.description,
      })),
      inputFields: type.inputFields?.map((field: any) => ({
        name: field.name,
        type: this.getTypeString(field.type),
        defaultValue: field.defaultValue,
        description: field.description,
      })),
    }));

    return {
      types,
      queries: schemaData.queryType?.fields || [],
      mutations: schemaData.mutationType?.fields || [],
      subscriptions: schemaData.subscriptionType?.fields || [],
    };
  }

  /**
   * Get type string from GraphQL type object
   */
  private getTypeString(type: any): string {
    if (type.ofType) {
      return type.kind === 'NON_NULL' 
        ? `${this.getTypeString(type.ofType)}!`
        : `[${this.getTypeString(type.ofType)}]`;
    }
    return type.name;
  }

  /**
   * Validate GraphQL response
   */
  private validateResponse(
    response: GraphQLResponse,
    expected: GraphQLTestCase['expectedResponse']
  ): string[] {
    const errors: string[] = [];

    if (!expected) return errors;

    if (expected.hasData !== undefined) {
      if (expected.hasData && !response.data) {
        errors.push('Expected response to have data but it was null/undefined');
      }
      if (!expected.hasData && response.data) {
        errors.push('Expected response to not have data but it was present');
      }
    }

    if (expected.hasErrors !== undefined) {
      if (expected.hasErrors && (!response.errors || response.errors.length === 0)) {
        errors.push('Expected response to have errors but none were found');
      }
      if (!expected.hasErrors && response.errors && response.errors.length > 0) {
        errors.push('Expected response to not have errors but errors were found');
      }
    }

    if (expected.dataValidation && response.data) {
      const validationResult = expected.dataValidation(response.data);
      if (typeof validationResult === 'string') {
        errors.push(validationResult);
      } else if (!validationResult) {
        errors.push('Data validation failed');
      }
    }

    if (expected.errorValidation && response.errors) {
      const validationResult = expected.errorValidation(response.errors);
      if (typeof validationResult === 'string') {
        errors.push(validationResult);
      } else if (!validationResult) {
        errors.push('Error validation failed');
      }
    }

    return errors;
  }

  /**
   * Analyze query complexity and depth
   */
  private analyzeComplexity(query: string, limits: QueryComplexityOptions): {
    complexity: number;
    depth: number;
  } {
    // Simplified complexity analysis - in production, use graphql-query-complexity
    const depth = this.calculateDepth(query);
    const fieldCount = this.countFields(query);
    const complexity = fieldCount * (limits.scalarCost || 1) + depth * (limits.objectCost || 2);

    return { complexity, depth };
  }

  /**
   * Calculate query depth
   */
  private calculateDepth(query: string): number {
    const braceMatches = query.match(/{/g);
    return braceMatches ? braceMatches.length : 0;
  }

  /**
   * Count fields in query
   */
  private countFields(query: string): number {
    // Simplified field counting - remove comments and strings first
    const cleanQuery = query.replace(/\/\*[\s\S]*?\*\//g, '').replace(/"[^"]*"/g, '');
    const fieldMatches = cleanQuery.match(/\w+\s*(?:\([^)]*\))?\s*{?/g);
    return fieldMatches ? fieldMatches.length : 0;
  }

  /**
   * Calculate query complexity
   */
  private calculateComplexity(query: string): number {
    // Simplified complexity calculation
    const depth = this.calculateDepth(query);
    const fieldCount = this.countFields(query);
    return fieldCount + depth * 2;
  }

  /**
   * Calculate query coverage
   */
  private calculateCoverage(query: string): {
    queriedFields: string[];
    totalFields: number;
    coverage: number;
  } {
    if (!this.schema) {
      return { queriedFields: [], totalFields: 0, coverage: 0 };
    }

    // Extract field names from query (simplified)
    const fieldMatches = query.match(/\w+(?=\s*(?:\([^)]*\))?\s*[{,\s])/g) || [];
    const queriedFields = [...new Set(fieldMatches)];

    // Count total available fields
    const totalFields = this.schema.queries.length + 
                       this.schema.mutations.length + 
                       this.schema.subscriptions.length;

    const coverage = totalFields > 0 ? (queriedFields.length / totalFields) * 100 : 0;

    return { queriedFields, totalFields, coverage };
  }

  /**
   * Generate a query for a given field
   */
  private generateQuery(field: GraphQLField, maxDepth: number, currentDepth: number = 0): string {
    if (currentDepth >= maxDepth) {
      return field.name;
    }

    let queryString = field.name;

    // Add arguments if any
    if (field.args && field.args.length > 0) {
      const args = field.args.map(arg => `${arg.name}: ${this.generateDefaultValue(arg.type)}`).join(', ');
      queryString += `(${args})`;
    }

    // Add selection set for object types
    if (this.isObjectType(field.type)) {
      queryString += ' { id }'; // Basic selection for object types
    }

    return queryString;
  }

  /**
   * Generate variables for a query
   */
  private generateVariables(field: GraphQLField): Record<string, any> {
    const variables: Record<string, any> = {};

    if (field.args) {
      for (const arg of field.args) {
        variables[arg.name] = this.generateVariableValue(arg.type);
      }
    }

    return variables;
  }

  /**
   * Generate default value for a type
   */
  private generateDefaultValue(type: string): string {
    if (type.includes('String')) return '"test"';
    if (type.includes('Int') || type.includes('Float')) return '1';
    if (type.includes('Boolean')) return 'true';
    if (type.includes('ID')) return '"1"';
    return 'null';
  }

  /**
   * Generate variable value for testing
   */
  private generateVariableValue(type: string): any {
    if (type.includes('String')) return 'test';
    if (type.includes('Int') || type.includes('Float')) return 1;
    if (type.includes('Boolean')) return true;
    if (type.includes('ID')) return '1';
    return null;
  }

  /**
   * Check if type is an object type
   */
  private isObjectType(type: string): boolean {
    return !['String', 'Int', 'Float', 'Boolean', 'ID'].some(scalar => type.includes(scalar));
  }

  /**
   * Create a load test worker
   */
  private async createLoadTestWorker(
    query: GraphQLQuery,
    endTime: number,
    responseTimes: number[],
    errors: Map<string, number>,
    incrementTotal: () => void,
    incrementSuccess: () => void
  ): Promise<void> {
    while (performance.now() < endTime) {
      const requestStart = performance.now();
      incrementTotal();

      try {
        await this.query(query.query, query.variables, query.operationName);
        const requestEnd = performance.now();
        responseTimes.push(requestEnd - requestStart);
        incrementSuccess();
      } catch (error) {
        const errorMessage = (error as Error).message;
        errors.set(errorMessage, (errors.get(errorMessage) || 0) + 1);
      }
    }
  }
}

/**
 * Factory functions for common GraphQL test scenarios
 */
export const createSimpleQueryTest = (fieldName: string): GraphQLTestCase => ({
  name: `Simple ${fieldName} query`,
  query: {
    query: `query { ${fieldName} { id } }`,
  },
  expectedResponse: {
    hasData: true,
    hasErrors: false,
  },
});

export const createMutationTest = (mutationName: string, variables: Record<string, any>): GraphQLTestCase => ({
  name: `${mutationName} mutation`,
  query: {
    query: `mutation($input: ${mutationName}Input!) { ${mutationName}(input: $input) { id } }`,
    variables: { input: variables },
  },
  expectedResponse: {
    hasData: true,
    hasErrors: false,
  },
});

export const createErrorTest = (invalidQuery: string): GraphQLTestCase => ({
  name: 'Error handling test',
  query: {
    query: invalidQuery,
  },
  expectedResponse: {
    hasErrors: true,
  },
});

/**
 * Create GraphQL test client
 */
export const createGraphQLTestClient = (client: ApiClient, endpoint?: string): GraphQLTestClient => {
  return new GraphQLTestClient(client, endpoint);
};