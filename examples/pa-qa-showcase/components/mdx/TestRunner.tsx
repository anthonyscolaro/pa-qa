'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Play, Square, RotateCcw, FileText, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface TestResult {
  name: string;
  status: 'passed' | 'failed' | 'skipped' | 'running';
  duration?: number;
  error?: string;
  logs?: string[];
}

interface TestSuite {
  name: string;
  tests: TestResult[];
  duration: number;
  passed: number;
  failed: number;
  skipped: number;
}

interface TestRunnerProps {
  testCode?: string;
  title?: string;
  description?: string;
  autoRun?: boolean;
  framework?: 'jest' | 'vitest' | 'mocha' | 'custom';
  className?: string;
}

interface TestRunnerState {
  isRunning: boolean;
  currentTest: string | null;
  results: TestSuite | null;
  logs: string[];
  startTime: number | null;
}

export function TestRunner({
  testCode = '',
  title = 'Test Runner',
  description,
  autoRun = false,
  framework = 'jest',
  className = '',
}: TestRunnerProps) {
  const [state, setState] = useState<TestRunnerState>({
    isRunning: false,
    currentTest: null,
    results: null,
    logs: [],
    startTime: null,
  });

  const workerRef = useRef<Worker | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Web Worker for test execution
  useEffect(() => {
    // Create a Web Worker for running tests in isolation
    const workerCode = `
      // Mock test framework functions
      const describe = (name, fn) => {
        return { name, fn, type: 'describe' };
      };

      const test = (name, fn) => {
        return { name, fn, type: 'test' };
      };

      const it = test; // Alias for test

      const expect = (actual) => ({
        toBe: (expected) => {
          if (actual !== expected) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be \${JSON.stringify(expected)}\`);
          }
          return true;
        },
        toEqual: (expected) => {
          if (JSON.stringify(actual) !== JSON.stringify(expected)) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to equal \${JSON.stringify(expected)}\`);
          }
          return true;
        },
        toBeTruthy: () => {
          if (!actual) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be truthy\`);
          }
          return true;
        },
        toBeFalsy: () => {
          if (actual) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to be falsy\`);
          }
          return true;
        },
        toThrow: () => {
          let threw = false;
          try {
            actual();
          } catch (e) {
            threw = true;
          }
          if (!threw) {
            throw new Error('Expected function to throw');
          }
          return true;
        },
        toContain: (expected) => {
          if (!actual.includes(expected)) {
            throw new Error(\`Expected \${JSON.stringify(actual)} to contain \${JSON.stringify(expected)}\`);
          }
          return true;
        },
        toHaveLength: (expected) => {
          if (actual.length !== expected) {
            throw new Error(\`Expected length \${actual.length} to be \${expected}\`);
          }
          return true;
        }
      });

      // Mock console for capturing logs
      const logs = [];
      const originalConsole = {
        log: (...args) => logs.push(['log', ...args]),
        error: (...args) => logs.push(['error', ...args]),
        warn: (...args) => logs.push(['warn', ...args]),
        info: (...args) => logs.push(['info', ...args])
      };

      self.onmessage = async function(e) {
        const { testCode, id } = e.data;
        
        try {
          // Reset logs
          logs.length = 0;
          
          // Override console
          self.console = originalConsole;
          
          // Parse and execute test code
          const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
          const testFunction = new AsyncFunction(
            'describe', 'test', 'it', 'expect', 'console',
            \`
            const testSuites = [];
            const currentSuite = { name: 'Default', tests: [] };
            
            // Override describe to collect test suites
            const describe = (name, fn) => {
              const suite = { name, tests: [] };
              testSuites.push(suite);
              
              const originalTest = test;
              const test = (testName, testFn) => {
                suite.tests.push({ name: testName, fn: testFn });
              };
              const it = test;
              
              fn();
              
              return suite;
            };
            
            // Override test for default suite
            const test = (name, fn) => {
              currentSuite.tests.push({ name, fn });
            };
            const it = test;
            
            \${testCode}
            
            if (currentSuite.tests.length > 0) {
              testSuites.push(currentSuite);
            }
            
            return testSuites;
            \`
          );

          const testSuites = await testFunction(describe, test, it, expect, originalConsole);
          
          // Execute tests
          for (const suite of testSuites) {
            const results = [];
            
            for (const test of suite.tests) {
              self.postMessage({
                type: 'test-start',
                test: test.name,
                id
              });
              
              const startTime = Date.now();
              
              try {
                await test.fn();
                const duration = Date.now() - startTime;
                
                results.push({
                  name: test.name,
                  status: 'passed',
                  duration,
                  logs: [...logs]
                });
                
                self.postMessage({
                  type: 'test-complete',
                  test: test.name,
                  status: 'passed',
                  duration,
                  id
                });
              } catch (error) {
                const duration = Date.now() - startTime;
                
                results.push({
                  name: test.name,
                  status: 'failed',
                  duration,
                  error: error.message,
                  logs: [...logs]
                });
                
                self.postMessage({
                  type: 'test-complete',
                  test: test.name,
                  status: 'failed',
                  duration,
                  error: error.message,
                  id
                });
              }
              
              // Clear logs for next test
              logs.length = 0;
            }
            
            // Send suite results
            self.postMessage({
              type: 'suite-complete',
              suite: {
                name: suite.name,
                tests: results,
                duration: results.reduce((acc, test) => acc + (test.duration || 0), 0),
                passed: results.filter(t => t.status === 'passed').length,
                failed: results.filter(t => t.status === 'failed').length,
                skipped: results.filter(t => t.status === 'skipped').length
              },
              id
            });
          }
          
        } catch (error) {
          self.postMessage({
            type: 'error',
            error: error.message,
            id
          });
        }
      };
    `;

    const blob = new Blob([workerCode], { type: 'application/javascript' });
    workerRef.current = new Worker(URL.createObjectURL(blob));

    workerRef.current.onmessage = (e) => {
      const { type, id, ...data } = e.data;

      switch (type) {
        case 'test-start':
          setState(prev => ({
            ...prev,
            currentTest: data.test,
          }));
          break;

        case 'test-complete':
          setState(prev => ({
            ...prev,
            logs: [...prev.logs, `${data.status === 'passed' ? '✓' : '✗'} ${data.test} (${data.duration}ms)`],
          }));
          break;

        case 'suite-complete':
          setState(prev => ({
            ...prev,
            results: data.suite,
            currentTest: null,
          }));
          break;

        case 'error':
          setState(prev => ({
            ...prev,
            isRunning: false,
            currentTest: null,
            logs: [...prev.logs, `Error: ${data.error}`],
          }));
          break;
      }
    };

    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-run tests when testCode changes
  useEffect(() => {
    if (autoRun && testCode) {
      runTests();
    }
  }, [testCode, autoRun]);

  const runTests = useCallback(() => {
    if (!workerRef.current || state.isRunning) return;

    setState(prev => ({
      ...prev,
      isRunning: true,
      currentTest: null,
      results: null,
      logs: [],
      startTime: Date.now(),
    }));

    // Send test code to worker
    const id = Math.random().toString(36).substr(2, 9);
    workerRef.current.postMessage({ testCode, id });

    // Set timeout for long-running tests
    timeoutRef.current = setTimeout(() => {
      stopTests();
      setState(prev => ({
        ...prev,
        logs: [...prev.logs, 'Tests timed out after 30 seconds'],
      }));
    }, 30000);
  }, [testCode, state.isRunning]);

  const stopTests = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isRunning: false,
      currentTest: null,
    }));

    // Terminate and recreate worker to stop execution
    if (workerRef.current) {
      workerRef.current.terminate();
      // Worker will be recreated by the useEffect
    }
  }, []);

  const clearResults = useCallback(() => {
    setState(prev => ({
      ...prev,
      results: null,
      logs: [],
      currentTest: null,
    }));
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'skipped':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'running':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default:
        return null;
    }
  };

  const totalDuration = state.startTime ? Date.now() - state.startTime : 0;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {framework}
          </span>
          <button
            onClick={runTests}
            disabled={state.isRunning || !testCode}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded transition-colors"
          >
            <Play className="w-3 h-3" />
            {state.isRunning ? 'Running...' : 'Run Tests'}
          </button>
          {state.isRunning && (
            <button
              onClick={stopTests}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <Square className="w-3 h-3" />
              Stop
            </button>
          )}
          <button
            onClick={clearResults}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Status */}
      {(state.isRunning || state.currentTest) && (
        <div className="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
            <Clock className="w-4 h-4 animate-spin" />
            {state.currentTest ? `Running: ${state.currentTest}` : 'Initializing tests...'}
          </div>
        </div>
      )}

      {/* Results */}
      {state.results && (
        <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              {state.results.name}
            </h4>
            <div className="flex items-center gap-4 text-xs">
              <span className="text-green-600 dark:text-green-400">
                {state.results.passed} passed
              </span>
              {state.results.failed > 0 && (
                <span className="text-red-600 dark:text-red-400">
                  {state.results.failed} failed
                </span>
              )}
              {state.results.skipped > 0 && (
                <span className="text-yellow-600 dark:text-yellow-400">
                  {state.results.skipped} skipped
                </span>
              )}
              <span className="text-gray-500 dark:text-gray-400">
                {state.results.duration}ms
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {state.results.tests.map((test, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800"
              >
                <div className="flex items-center gap-2">
                  {getStatusIcon(test.status)}
                  <span className="text-sm text-gray-900 dark:text-gray-100">
                    {test.name}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                  {test.duration && (
                    <span>{test.duration}ms</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Failed test details */}
          {state.results.tests.some(t => t.error) && (
            <div className="mt-4">
              <h5 className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
                Failures:
              </h5>
              <div className="space-y-2">
                {state.results.tests
                  .filter(test => test.error)
                  .map((test, index) => (
                    <div
                      key={index}
                      className="p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
                    >
                      <div className="text-sm font-medium text-red-900 dark:text-red-100">
                        {test.name}
                      </div>
                      <div className="text-sm text-red-700 dark:text-red-300 mt-1 font-mono">
                        {test.error}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Logs */}
      {state.logs.length > 0 && (
        <div className="px-4 py-3">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-2">
            Test Output
          </h4>
          <div className="bg-gray-900 dark:bg-gray-800 rounded p-3 max-h-32 overflow-auto">
            <div className="text-xs text-green-400 font-mono space-y-1">
              {state.logs.map((log, index) => (
                <div key={index}>{log}</div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!testCode && (
        <div className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No test code provided</p>
        </div>
      )}
    </div>
  );
}

export default TestRunner;