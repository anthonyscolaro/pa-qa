'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Play, Copy, BookOpen, CheckCircle, XCircle, Clock, Code, FileText } from 'lucide-react';
import LiveCodeEditor from './LiveCodeEditor';
import TestRunner from './TestRunner';

interface TestCase {
  name: string;
  description: string;
  code: string;
  expected?: any;
  framework?: 'jest' | 'vitest' | 'mocha';
}

interface TestExampleProps {
  title?: string;
  description?: string;
  category?: string;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  testCases?: TestCase[];
  sourceCode?: string;
  language?: string;
  className?: string;
}

const defaultTestCases: TestCase[] = [
  {
    name: 'Basic Math Operations',
    description: 'Test addition and subtraction functions',
    code: `// Source code to test
function add(a, b) {
  return a + b;
}

function subtract(a, b) {
  return a - b;
}

// Test cases
describe('Math Operations', () => {
  test('should add two numbers correctly', () => {
    expect(add(2, 3)).toBe(5);
    expect(add(-1, 1)).toBe(0);
    expect(add(0, 0)).toBe(0);
  });

  test('should subtract two numbers correctly', () => {
    expect(subtract(5, 3)).toBe(2);
    expect(subtract(1, 1)).toBe(0);
    expect(subtract(0, 5)).toBe(-5);
  });
});`,
    expected: { passed: 2, failed: 0 },
    framework: 'jest'
  },
  {
    name: 'Array Utilities',
    description: 'Test array manipulation functions',
    code: `// Array utility functions
function findMax(arr) {
  if (arr.length === 0) return null;
  return Math.max(...arr);
}

function removeDuplicates(arr) {
  return [...new Set(arr)];
}

// Test cases
describe('Array Utilities', () => {
  test('should find maximum value in array', () => {
    expect(findMax([1, 3, 2, 8, 5])).toBe(8);
    expect(findMax([-1, -5, -2])).toBe(-1);
    expect(findMax([])).toBe(null);
  });

  test('should remove duplicate values', () => {
    expect(removeDuplicates([1, 2, 2, 3, 3, 3])).toEqual([1, 2, 3]);
    expect(removeDuplicates(['a', 'b', 'a', 'c'])).toEqual(['a', 'b', 'c']);
    expect(removeDuplicates([])).toEqual([]);
  });
});`,
    expected: { passed: 2, failed: 0 },
    framework: 'jest'
  },
  {
    name: 'String Validation',
    description: 'Test email and phone validation functions',
    code: `// Validation functions
function isValidEmail(email) {
  const regex = /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/;
  return regex.test(email);
}

function isValidPhone(phone) {
  const regex = /^\\+?[1-9]\\d{1,14}$/;
  return regex.test(phone.replace(/[\\s-]/g, ''));
}

// Test cases
describe('Validation Functions', () => {
  test('should validate email addresses', () => {
    expect(isValidEmail('test@example.com')).toBe(true);
    expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
    expect(isValidEmail('invalid.email')).toBe(false);
    expect(isValidEmail('test@')).toBe(false);
  });

  test('should validate phone numbers', () => {
    expect(isValidPhone('+1234567890')).toBe(true);
    expect(isValidPhone('123-456-7890')).toBe(true);
    expect(isValidPhone('invalid')).toBe(false);
    expect(isValidPhone('123')).toBe(false);
  });
});`,
    expected: { passed: 2, failed: 0 },
    framework: 'jest'
  }
];

export function TestExample({
  title = 'Interactive Test Example',
  description = 'Run and explore test cases interactively',
  category = 'Unit Testing',
  difficulty = 'beginner',
  testCases = defaultTestCases,
  sourceCode,
  language = 'javascript',
  className = '',
}: TestExampleProps) {
  const [activeTab, setActiveTab] = useState<'code' | 'tests'>('tests');
  const [selectedTest, setSelectedTest] = useState<number>(0);
  const [testResults, setTestResults] = useState<{ [key: number]: any }>({});
  const [isRunning, setIsRunning] = useState<{ [key: number]: boolean }>({});

  const handleRunTest = useCallback(async (testIndex: number, code: string) => {
    setIsRunning(prev => ({ ...prev, [testIndex]: true }));
    
    try {
      // Simulate test execution with Web Worker
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      // Mock test results based on the test case
      const testCase = testCases[testIndex];
      const mockResult = {
        name: testCase.name,
        tests: [
          {
            name: 'Test case 1',
            status: Math.random() > 0.1 ? 'passed' : 'failed',
            duration: 50 + Math.random() * 200,
            error: Math.random() > 0.9 ? 'Assertion failed: Expected 5 but got 4' : undefined
          },
          {
            name: 'Test case 2', 
            status: Math.random() > 0.15 ? 'passed' : 'failed',
            duration: 30 + Math.random() * 150,
            error: Math.random() > 0.85 ? 'TypeError: Cannot read property of undefined' : undefined
          }
        ],
        duration: 100 + Math.random() * 300,
        passed: 0,
        failed: 0,
        skipped: 0
      };

      // Calculate totals
      mockResult.passed = mockResult.tests.filter(t => t.status === 'passed').length;
      mockResult.failed = mockResult.tests.filter(t => t.status === 'failed').length;
      mockResult.skipped = mockResult.tests.filter(t => t.status === 'skipped').length;

      setTestResults(prev => ({ ...prev, [testIndex]: mockResult }));
    } catch (error) {
      setTestResults(prev => ({ 
        ...prev, 
        [testIndex]: { 
          error: error instanceof Error ? error.message : 'Test execution failed',
          tests: [],
          duration: 0,
          passed: 0,
          failed: 1,
          skipped: 0
        }
      }));
    } finally {
      setIsRunning(prev => ({ ...prev, [testIndex]: false }));
    }
  }, [testCases]);

  const copyTestCode = useCallback(async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, []);

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'intermediate': return 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20';
      case 'advanced': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getTestStatus = (testIndex: number) => {
    const result = testResults[testIndex];
    if (isRunning[testIndex]) return 'running';
    if (!result) return 'pending';
    if (result.error || result.failed > 0) return 'failed';
    return 'passed';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed': return <XCircle className="w-4 h-4 text-red-500" />;
      case 'running': return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      default: return <Clock className="w-4 h-4 text-gray-400" />;
    }
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <BookOpen className="w-4 h-4" />
              {title}
            </h3>
            {description && (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
              {category}
            </span>
            <span className={`text-xs px-2 py-1 rounded ${getDifficultyColor(difficulty)}`}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setActiveTab('tests')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'tests'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
              : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
          }`}
        >
          <FileText className="w-4 h-4 inline mr-1" />
          Test Cases ({testCases.length})
        </button>
        {sourceCode && (
          <button
            onClick={() => setActiveTab('code')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'code'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20'
                : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
            }`}
          >
            <Code className="w-4 h-4 inline mr-1" />
            Source Code
          </button>
        )}
      </div>

      {activeTab === 'tests' ? (
        <div className="flex h-96">
          {/* Test List */}
          <div className="w-1/3 border-r border-gray-200 dark:border-gray-700">
            <div className="p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                Test Cases
              </span>
            </div>
            <div className="overflow-auto max-h-80">
              {testCases.map((testCase, index) => {
                const status = getTestStatus(index);
                const result = testResults[index];
                
                return (
                  <div
                    key={index}
                    className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                      selectedTest === index ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                    }`}
                    onClick={() => setSelectedTest(index)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {testCase.name}
                      </span>
                      {getStatusIcon(status)}
                    </div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {testCase.description}
                    </p>
                    {result && (
                      <div className="flex items-center gap-2 mt-2 text-xs">
                        {result.passed > 0 && (
                          <span className="text-green-600 dark:text-green-400">
                            {result.passed} passed
                          </span>
                        )}
                        {result.failed > 0 && (
                          <span className="text-red-600 dark:text-red-400">
                            {result.failed} failed
                          </span>
                        )}
                        {result.duration && (
                          <span className="text-gray-500 dark:text-gray-400">
                            {Math.round(result.duration)}ms
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Test Details */}
          <div className="flex-1 flex flex-col">
            {testCases[selectedTest] && (
              <>
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                      {testCases[selectedTest].name}
                    </h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {testCases[selectedTest].description}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => copyTestCode(testCases[selectedTest].code)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                      title="Copy test code"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button
                      onClick={() => handleRunTest(selectedTest, testCases[selectedTest].code)}
                      disabled={isRunning[selectedTest]}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded transition-colors"
                    >
                      <Play className="w-3 h-3" />
                      {isRunning[selectedTest] ? 'Running...' : 'Run Test'}
                    </button>
                  </div>
                </div>

                <div className="flex-1">
                  <TestRunner
                    testCode={testCases[selectedTest].code}
                    framework={testCases[selectedTest].framework}
                    title="Test Execution"
                    className="border-0 rounded-none"
                  />
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
        <div className="h-96">
          <LiveCodeEditor
            initialCode={sourceCode || '// No source code provided'}
            language={language}
            title="Source Code"
            description="Review the implementation being tested"
            readonly={true}
            showOutput={false}
            className="border-0 rounded-none h-full"
          />
        </div>
      )}

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <span>
            Interactive test examples • Click "Run Test" to execute
          </span>
          <span>
            Framework: {testCases[selectedTest]?.framework || 'jest'}
          </span>
        </div>
      </div>
    </div>
  );
}

export default TestExample;