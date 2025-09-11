'use client';

import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Play,
  RefreshCw,
  CheckCircle,
  XCircle,
  AlertCircle,
  Code2,
  TestTube,
  FileCode,
  Terminal,
  Eye,
  EyeOff
} from 'lucide-react';
import { clsx } from 'clsx';

interface TestCase {
  id: string;
  name: string;
  description: string;
  status: 'passing' | 'failing' | 'skipped' | 'running';
  duration?: number;
  error?: string;
}

interface TestSuite {
  name: string;
  file: string;
  tests: TestCase[];
}

const mockTestSuites: TestSuite[] = [
  {
    name: 'Button Component',
    file: 'components/Button.test.tsx',
    tests: [
      {
        id: '1',
        name: 'renders with correct text',
        description: 'Should display the provided children as button text',
        status: 'passing',
        duration: 12
      },
      {
        id: '2',
        name: 'handles click events',
        description: 'Should call onClick handler when clicked',
        status: 'passing',
        duration: 8
      },
      {
        id: '3',
        name: 'applies variant styles',
        description: 'Should apply correct CSS classes for each variant',
        status: 'failing',
        duration: 15,
        error: 'Expected class "btn-primary" but got "btn-default"'
      },
      {
        id: '4',
        name: 'disabled state prevents clicks',
        description: 'Should not trigger onClick when disabled',
        status: 'passing',
        duration: 5
      }
    ]
  },
  {
    name: 'Form Validation',
    file: 'components/Form.test.tsx',
    tests: [
      {
        id: '5',
        name: 'validates required fields',
        description: 'Should show error for empty required fields',
        status: 'passing',
        duration: 18
      },
      {
        id: '6',
        name: 'validates email format',
        description: 'Should reject invalid email addresses',
        status: 'passing',
        duration: 10
      },
      {
        id: '7',
        name: 'submits valid form data',
        description: 'Should call onSubmit with form values',
        status: 'skipped'
      }
    ]
  },
  {
    name: 'API Hooks',
    file: 'hooks/useApi.test.tsx',
    tests: [
      {
        id: '8',
        name: 'fetches data on mount',
        description: 'Should make API call when component mounts',
        status: 'passing',
        duration: 45
      },
      {
        id: '9',
        name: 'handles loading state',
        description: 'Should set loading true during fetch',
        status: 'passing',
        duration: 20
      },
      {
        id: '10',
        name: 'handles errors gracefully',
        description: 'Should catch and display API errors',
        status: 'failing',
        duration: 30,
        error: 'Network error: Unable to fetch'
      }
    ]
  }
];

// Sample component code for display
const sampleComponentCode = `import { Button } from '@/components/Button';
import { render, screen, fireEvent } from '@testing-library/react';

describe('Button Component', () => {
  it('renders with correct text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText('Click me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByText('Click me'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('applies variant styles', () => {
    const { rerender } = render(<Button variant="primary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-primary');
    
    rerender(<Button variant="secondary">Test</Button>);
    expect(screen.getByRole('button')).toHaveClass('btn-secondary');
  });
});`;

export default function ReactPlaygroundPage() {
  const [selectedSuite, setSelectedSuite] = useState<TestSuite>(mockTestSuites[0]);
  const [isRunning, setIsRunning] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [testSuites, setTestSuites] = useState(mockTestSuites);

  // Calculate statistics
  const totalTests = testSuites.reduce((acc, suite) => acc + suite.tests.length, 0);
  const passingTests = testSuites.reduce((acc, suite) => 
    acc + suite.tests.filter(t => t.status === 'passing').length, 0
  );
  const failingTests = testSuites.reduce((acc, suite) => 
    acc + suite.tests.filter(t => t.status === 'failing').length, 0
  );
  const skippedTests = testSuites.reduce((acc, suite) => 
    acc + suite.tests.filter(t => t.status === 'skipped').length, 0
  );

  const runAllTests = () => {
    setIsRunning(true);
    
    // Simulate running tests
    const updatedSuites = testSuites.map(suite => ({
      ...suite,
      tests: suite.tests.map(test => ({
        ...test,
        status: 'running' as const
      }))
    }));
    setTestSuites(updatedSuites);

    // Simulate test completion
    setTimeout(() => {
      const finalSuites = testSuites.map(suite => ({
        ...suite,
        tests: suite.tests.map(test => ({
          ...test,
          status: test.status === 'skipped' 
            ? 'skipped' as const 
            : Math.random() > 0.2 ? 'passing' as const : 'failing' as const,
          duration: Math.floor(Math.random() * 50) + 5
        }))
      }));
      setTestSuites(finalSuites);
      setIsRunning(false);
    }, 3000);
  };

  const runSuiteTests = (suite: TestSuite) => {
    setIsRunning(true);
    
    const updatedSuites = testSuites.map(s => 
      s.name === suite.name 
        ? {
            ...s,
            tests: s.tests.map(test => ({
              ...test,
              status: test.status === 'skipped' ? 'skipped' as const : 'running' as const
            }))
          }
        : s
    );
    setTestSuites(updatedSuites);

    setTimeout(() => {
      const finalSuites = testSuites.map(s => 
        s.name === suite.name
          ? {
              ...s,
              tests: s.tests.map(test => ({
                ...test,
                status: test.status === 'skipped' 
                  ? 'skipped' as const 
                  : Math.random() > 0.3 ? 'passing' as const : 'failing' as const,
                duration: Math.floor(Math.random() * 50) + 5
              }))
            }
          : s
      );
      setTestSuites(finalSuites);
      setIsRunning(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/showcase"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Showcase
              </Link>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                React Testing Playground
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCode(!showCode)}
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                {showCode ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                {showCode ? 'Hide' : 'Show'} Code
              </button>
              <button
                onClick={runAllTests}
                disabled={isRunning}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                  isRunning
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                )}
              >
                {isRunning ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running Tests...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run All Tests
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Test Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <TestTube className="h-5 w-5 text-blue-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{totalTests}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <CheckCircle className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Passing</p>
              <p className="text-xl font-bold text-green-600 dark:text-green-400">{passingTests}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <XCircle className="h-5 w-5 text-red-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Failing</p>
              <p className="text-xl font-bold text-red-600 dark:text-red-400">{failingTests}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <AlertCircle className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Skipped</p>
              <p className="text-xl font-bold text-yellow-600 dark:text-yellow-400">{skippedTests}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Test Suites List */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Test Suites</h2>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-800">
                {testSuites.map((suite) => {
                  const passing = suite.tests.filter(t => t.status === 'passing').length;
                  const total = suite.tests.length;
                  
                  return (
                    <button
                      key={suite.name}
                      onClick={() => setSelectedSuite(suite)}
                      className={clsx(
                        'w-full px-4 py-3 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors',
                        selectedSuite?.name === suite.name && 'bg-blue-50 dark:bg-blue-900/20'
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {suite.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {suite.file}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {passing}/{total}
                          </p>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              runSuiteTests(suite);
                            }}
                            className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400"
                          >
                            Run
                          </button>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Test Results */}
          <div className="lg:col-span-2">
            {showCode ? (
              <div className="rounded-lg border border-gray-200 bg-gray-900 dark:border-gray-800">
                <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileCode className="h-4 w-4 text-gray-400" />
                    <span className="text-sm text-gray-300">{selectedSuite?.file}</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500"></div>
                    <div className="h-3 w-3 rounded-full bg-yellow-500"></div>
                    <div className="h-3 w-3 rounded-full bg-green-500"></div>
                  </div>
                </div>
                <div className="p-4 overflow-x-auto">
                  <pre className="text-sm text-gray-100">
                    <code>{sampleComponentCode}</code>
                  </pre>
                </div>
              </div>
            ) : (
              <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Test Results: {selectedSuite?.name}
                  </h2>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-800">
                  {selectedSuite?.tests.map((test) => (
                    <div key={test.id} className="px-4 py-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <div className="mt-0.5">
                            {test.status === 'passing' && (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            )}
                            {test.status === 'failing' && (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            {test.status === 'skipped' && (
                              <AlertCircle className="h-5 w-5 text-yellow-500" />
                            )}
                            {test.status === 'running' && (
                              <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {test.name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {test.description}
                            </p>
                            {test.error && (
                              <div className="mt-2 rounded bg-red-50 dark:bg-red-900/20 p-2">
                                <p className="text-xs text-red-600 dark:text-red-400 font-mono">
                                  {test.error}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        {test.duration && (
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {test.duration}ms
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Terminal Output */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-gray-900 dark:border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center gap-2">
                <Terminal className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-300">Test Output</span>
              </div>
              <div className="p-4">
                <pre className="text-xs text-gray-100 font-mono">
{`> jest --coverage --watchAll=false

PASS  components/Button.test.tsx
PASS  components/Form.test.tsx
FAIL  hooks/useApi.test.tsx

Test Suites: 2 passed, 1 failed, 3 total
Tests:       ${passingTests} passed, ${failingTests} failed, ${skippedTests} skipped, ${totalTests} total
Snapshots:   0 total
Time:        2.456s
Ran all test suites.

Coverage Summary:
Statements   : 87.5% ( 42/48 )
Branches     : 75% ( 12/16 )
Functions    : 90% ( 18/20 )
Lines        : 86.96% ( 40/46 )`}
                </pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}