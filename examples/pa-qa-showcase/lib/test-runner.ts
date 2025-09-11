// Test Runner Web Worker
// Executes tests in an isolated environment using Web Workers

export interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration?: number;
  error?: string;
  logs?: string[];
}

export interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

export interface TestRunnerMessage {
  type: 'test-start' | 'test-complete' | 'suite-complete' | 'error' | 'log';
  id: string;
  data?: any;
}

// Create a Web Worker for test execution
export function createTestWorker(): Worker {
  const workerCode = `
    // Mock testing framework implementation
    const testResults = [];
    const testSuites = [];
    let currentSuite = null;
    let testTimeout = null;

    // Console capture for logging
    const logs = [];
    const originalConsole = {
      log: (...args) => {
        logs.push({ type: 'log', args });
        self.postMessage({ type: 'log', data: { level: 'log', args } });
      },
      error: (...args) => {
        logs.push({ type: 'error', args });
        self.postMessage({ type: 'log', data: { level: 'error', args } });
      },
      warn: (...args) => {
        logs.push({ type: 'warn', args });
        self.postMessage({ type: 'log', data: { level: 'warn', args } });
      },
      info: (...args) => {
        logs.push({ type: 'info', args });
        self.postMessage({ type: 'log', data: { level: 'info', args } });
      }
    };

    // Mock Jest/Vitest-like testing functions
    function describe(name, fn) {
      const suite = {
        name,
        tests: [],
        beforeEach: [],
        afterEach: [],
        beforeAll: [],
        afterAll: []
      };
      
      const originalTest = self.test;
      const originalIt = self.it;
      
      // Override test functions within this suite
      self.test = self.it = (testName, testFn, timeout = 5000) => {
        suite.tests.push({ name: testName, fn: testFn, timeout });
      };
      
      // Override lifecycle hooks
      self.beforeEach = (fn) => suite.beforeEach.push(fn);
      self.afterEach = (fn) => suite.afterEach.push(fn);
      self.beforeAll = (fn) => suite.beforeAll.push(fn);
      self.afterAll = (fn) => suite.afterAll.push(fn);
      
      try {
        fn();
        testSuites.push(suite);
      } finally {
        // Restore original functions
        self.test = originalTest;
        self.it = originalIt;
      }
      
      return suite;
    }

    function test(name, fn, timeout = 5000) {
      if (!currentSuite) {
        currentSuite = { name: 'Default', tests: [], beforeEach: [], afterEach: [], beforeAll: [], afterAll: [] };
        testSuites.push(currentSuite);
      }
      currentSuite.tests.push({ name, fn, timeout });
    }

    // Alias for test
    const it = test;

    // Mock expect function with common matchers
    function expect(actual) {
      const matchers = {
        toBe(expected) {
          if (actual !== expected) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be \${JSON.stringify(expected)}\`);
          }
          return true;
        },
        
        toEqual(expected) {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to equal \${JSON.stringify(expected)}\`);
          }
          return true;
        },
        
        toBeTruthy() {
          if (!actual) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be truthy\`);
          }
          return true;
        },
        
        toBeFalsy() {
          if (actual) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be falsy\`);
          }
          return true;
        },
        
        toThrow(expectedError) {
          let threw = false;
          let thrownError = null;
          
          try {
            if (typeof actual === 'function') {
              actual();
            } else {
              throw new Error('Expected value to be a function');
            }
          } catch (e) {
            threw = true;
            thrownError = e;
          }
          
          if (!threw) {
            throw new Error('Expected function to throw');
          }
          
          if (expectedError && !thrownError.message.includes(expectedError)) {
            throw new Error(\`Expected error to contain "\${expectedError}" but got "\${thrownError.message}"\`);
          }
          
          return true;
        },
        
        toContain(expected) {
          if (Array.isArray(actual)) {
            if (!actual.includes(expected)) {
              throw new Error(\`Expected array \${JSON.stringify(actual)} to contain \${JSON.stringify(expected)}\`);
            }
          } else if (typeof actual === 'string') {
            if (!actual.includes(expected)) {
              throw new Error(\`Expected string "\${actual}" to contain "\${expected}"\`);
            }
          } else {
            throw new Error('Expected value to be an array or string');
          }
          return true;
        },
        
        toHaveLength(expected) {
          if (actual.length !== expected) {
            throw new Error(\`Expected length \${actual.length} to be \${expected}\`);
          }
          return true;
        },
        
        toBeCloseTo(expected, precision = 2) {
          const diff = Math.abs(actual - expected);
          const threshold = Math.pow(10, -precision) / 2;
          if (diff >= threshold) {
            throw new Error(\`Expected \${actual} to be close to \${expected} (precision: \${precision})\`);
          }
          return true;
        },
        
        toBeGreaterThan(expected) {
          if (actual <= expected) {
            throw new Error(\`Expected \${actual} to be greater than \${expected}\`);
          }
          return true;
        },
        
        toBeLessThan(expected) {
          if (actual >= expected) {
            throw new Error(\`Expected \${actual} to be less than \${expected}\`);
          }
          return true;
        },
        
        toBeNull() {
          if (actual !== null) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be null\`);
          }
          return true;
        },
        
        toBeUndefined() {
          if (actual !== undefined) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be undefined\`);
          }
          return true;
        },
        
        toBeDefined() {
          if (actual === undefined) {
            throw new Error('Expected value to be defined');
          }
          return true;
        }
      };
      
      return matchers;
    }

    // Mock lifecycle hooks for global scope
    let beforeEach = () => {};
    let afterEach = () => {};
    let beforeAll = () => {};
    let afterAll = () => {};

    // Mock timer functions
    const jest = {
      setTimeout: (fn, delay) => setTimeout(fn, delay),
      clearTimeout: (id) => clearTimeout(id),
      setInterval: (fn, delay) => setInterval(fn, delay),
      clearInterval: (id) => clearInterval(id),
      useFakeTimers: () => console.log('Using fake timers'),
      useRealTimers: () => console.log('Using real timers'),
      advanceTimersByTime: (ms) => console.log(\`Advancing timers by \${ms}ms\`),
      runAllTimers: () => console.log('Running all timers'),
    };

    // Execute a single test with timeout
    async function executeTest(test, suiteContext) {
      return new Promise(async (resolve) => {
        const startTime = Date.now();
        let timeoutId = null;
        
        try {
          // Set up timeout
          if (test.timeout > 0) {
            timeoutId = setTimeout(() => {
              resolve({
                name: test.name,
                status: 'failed',
                duration: Date.now() - startTime,
                error: \`Test timeout after \${test.timeout}ms\`
              });
            }, test.timeout);
          }
          
          // Run beforeEach hooks
          for (const hook of suiteContext.beforeEach) {
            await hook();
          }
          
          // Execute the test
          await test.fn();
          
          // Run afterEach hooks
          for (const hook of suiteContext.afterEach) {
            await hook();
          }
          
          // Clear timeout and resolve with success
          if (timeoutId) clearTimeout(timeoutId);
          
          resolve({
            name: test.name,
            status: 'passed',
            duration: Date.now() - startTime,
            logs: [...logs]
          });
          
        } catch (error) {
          if (timeoutId) clearTimeout(timeoutId);
          
          resolve({
            name: test.name,
            status: 'failed',
            duration: Date.now() - startTime,
            error: error.message,
            logs: [...logs]
          });
        }
        
        // Clear logs for next test
        logs.length = 0;
      });
    }

    // Main message handler
    self.onmessage = async function(e) {
      const { testCode, id, timeout = 30000 } = e.data;
      
      try {
        // Clear previous state
        testSuites.length = 0;
        testResults.length = 0;
        logs.length = 0;
        currentSuite = null;
        
        // Override console
        self.console = originalConsole;
        
        // Create execution context
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        
        // Execute the test code to collect test suites
        const testSetup = new AsyncFunction(
          'describe', 'test', 'it', 'expect', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'jest', 'console',
          testCode
        );
        
        await testSetup(describe, test, it, expect, beforeEach, afterEach, beforeAll, afterAll, jest, originalConsole);
        
        // If no explicit suites were created, add default suite
        if (testSuites.length === 0 && currentSuite && currentSuite.tests.length > 0) {
          testSuites.push(currentSuite);
        }
        
        // Execute all test suites
        for (const suite of testSuites) {
          const suiteStartTime = Date.now();
          const suiteResults = [];
          
          try {
            // Run beforeAll hooks
            for (const hook of suite.beforeAll) {
              await hook();
            }
            
            // Execute all tests in the suite
            for (const test of suite.tests) {
              self.postMessage({
                type: 'test-start',
                id,
                data: { test: test.name, suite: suite.name }
              });
              
              const result = await executeTest(test, suite);
              suiteResults.push(result);
              
              self.postMessage({
                type: 'test-complete',
                id,
                data: result
              });
            }
            
            // Run afterAll hooks
            for (const hook of suite.afterAll) {
              await hook();
            }
            
          } catch (error) {
            self.postMessage({
              type: 'error',
              id,
              data: { error: error.message, suite: suite.name }
            });
            continue;
          }
          
          // Calculate suite statistics
          const suiteDuration = Date.now() - suiteStartTime;
          const passed = suiteResults.filter(t => t.status === 'passed').length;
          const failed = suiteResults.filter(t => t.status === 'failed').length;
          const skipped = suiteResults.filter(t => t.status === 'skipped').length;
          
          const suiteResult = {
            name: suite.name,
            tests: suiteResults,
            duration: suiteDuration,
            passed,
            failed,
            skipped
          };
          
          self.postMessage({
            type: 'suite-complete',
            id,
            data: suiteResult
          });
        }
        
      } catch (error) {
        self.postMessage({
          type: 'error',
          id,
          data: { error: error.message }
        });
      }
    };
    
    // Handle uncaught errors
    self.onerror = function(error) {
      self.postMessage({
        type: 'error',
        data: { error: error.message || 'Unknown error occurred' }
      });
    };
  `;

  const blob = new Blob([workerCode], { type: 'application/javascript' });
  return new Worker(URL.createObjectURL(blob));
}

// Utility function to run tests with a simplified API
export async function runTests(testCode: string, options: {
  timeout?: number;
  onTestStart?: (testName: string) => void;
  onTestComplete?: (result: TestResult) => void;
  onSuiteComplete?: (suite: TestSuite) => void;
  onError?: (error: string) => void;
  onLog?: (level: string, args: any[]) => void;
} = {}): Promise<TestSuite[]> {
  return new Promise((resolve, reject) => {
    const worker = createTestWorker();
    const suites: TestSuite[] = [];
    const id = Math.random().toString(36).substr(2, 9);

    const cleanup = () => {
      worker.terminate();
    };

    const timeout = setTimeout(() => {
      cleanup();
      reject(new Error('Test execution timed out'));
    }, options.timeout || 30000);

    worker.onmessage = (e) => {
      const { type, data } = e.data;

      switch (type) {
        case 'test-start':
          options.onTestStart?.(data.test);
          break;

        case 'test-complete':
          options.onTestComplete?.(data);
          break;

        case 'suite-complete':
          suites.push(data);
          options.onSuiteComplete?.(data);
          break;

        case 'log':
          options.onLog?.(data.level, data.args);
          break;

        case 'error':
          clearTimeout(timeout);
          cleanup();
          options.onError?.(data.error);
          reject(new Error(data.error));
          break;
      }
    };

    worker.onerror = (error) => {
      clearTimeout(timeout);
      cleanup();
      reject(error);
    };

    // Start test execution
    worker.postMessage({ testCode, id, timeout: options.timeout });

    // Check if tests completed
    const checkCompletion = () => {
      // This is a simplified check - in a real implementation,
      // you'd track the expected number of suites
      setTimeout(() => {
        clearTimeout(timeout);
        cleanup();
        resolve(suites);
      }, 1000);
    };

    setTimeout(checkCompletion, 100);
  });
}

// Export default test runner configuration
export const defaultTestConfig = {
  timeout: 30000,
  retries: 0,
  verbose: false,
  bail: false,
  collectCoverage: false,
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
};

// Test framework detection
export function detectTestFramework(testCode: string): 'jest' | 'vitest' | 'mocha' | 'unknown' {
  if (testCode.includes('describe') && testCode.includes('expect')) {
    if (testCode.includes('vi.') || testCode.includes('vitest')) {
      return 'vitest';
    }
    if (testCode.includes('jest.') || testCode.includes('@jest/')) {
      return 'jest';
    }
    return 'jest'; // Default assumption for describe/expect pattern
  }
  
  if (testCode.includes('should') || testCode.includes('chai')) {
    return 'mocha';
  }
  
  return 'unknown';
}

// Validation helpers
export function validateTestCode(testCode: string): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // Check for basic syntax
  try {
    new Function(testCode);
  } catch (e) {
    errors.push(`Syntax error: ${e instanceof Error ? e.message : 'Unknown syntax error'}`);
  }
  
  // Check for test structure
  if (!testCode.includes('test') && !testCode.includes('it') && !testCode.includes('describe')) {
    errors.push('No test functions found (test, it, or describe)');
  }
  
  // Check for assertions
  if (!testCode.includes('expect') && !testCode.includes('assert') && !testCode.includes('should')) {
    errors.push('No assertions found (expect, assert, or should)');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}