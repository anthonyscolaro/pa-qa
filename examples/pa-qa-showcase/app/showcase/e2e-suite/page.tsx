'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Play,
  Pause,
  Square,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Globe,
  Zap,
  AlertTriangle,
  FileText,
  Camera,
  Download
} from 'lucide-react';
import { clsx } from 'clsx';

interface E2ETest {
  id: string;
  name: string;
  scenario: string;
  browser: 'chrome' | 'firefox' | 'safari' | 'edge';
  device: 'desktop' | 'mobile' | 'tablet';
  status: 'idle' | 'running' | 'passed' | 'failed' | 'paused';
  progress: number;
  duration?: number;
  screenshots: number;
  steps: TestStep[];
}

interface TestStep {
  name: string;
  action: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  duration?: number;
  screenshot?: boolean;
}

const mockE2ETests: E2ETest[] = [
  {
    id: '1',
    name: 'User Registration Flow',
    scenario: 'New user completes full registration process',
    browser: 'chrome',
    device: 'desktop',
    status: 'idle',
    progress: 0,
    screenshots: 0,
    steps: [
      { name: 'Navigate to signup page', action: 'goto("/signup")', status: 'pending' },
      { name: 'Fill registration form', action: 'fill("#email", "test@example.com")', status: 'pending' },
      { name: 'Accept terms', action: 'check("#terms")', status: 'pending' },
      { name: 'Submit form', action: 'click("button[type=submit]")', status: 'pending' },
      { name: 'Verify confirmation', action: 'waitForSelector(".success-message")', status: 'pending', screenshot: true }
    ]
  },
  {
    id: '2',
    name: 'Product Purchase',
    scenario: 'User browses catalog and completes purchase',
    browser: 'firefox',
    device: 'mobile',
    status: 'idle',
    progress: 0,
    screenshots: 0,
    steps: [
      { name: 'Search for product', action: 'fill("#search", "laptop")', status: 'pending' },
      { name: 'Select first result', action: 'click(".product-card:first-child")', status: 'pending' },
      { name: 'Add to cart', action: 'click("#add-to-cart")', status: 'pending', screenshot: true },
      { name: 'Proceed to checkout', action: 'click("#checkout")', status: 'pending' },
      { name: 'Complete payment', action: 'fill payment details', status: 'pending' },
      { name: 'Verify order', action: 'waitForSelector(".order-confirmation")', status: 'pending', screenshot: true }
    ]
  },
  {
    id: '3',
    name: 'Admin Dashboard',
    scenario: 'Admin user manages content and settings',
    browser: 'safari',
    device: 'tablet',
    status: 'idle',
    progress: 0,
    screenshots: 0,
    steps: [
      { name: 'Login as admin', action: 'authenticate(admin)', status: 'pending' },
      { name: 'Navigate to dashboard', action: 'goto("/admin")', status: 'pending' },
      { name: 'Create new post', action: 'click("#new-post")', status: 'pending' },
      { name: 'Fill content', action: 'fill content fields', status: 'pending' },
      { name: 'Publish post', action: 'click("#publish")', status: 'pending', screenshot: true },
      { name: 'Verify publication', action: 'check post is live', status: 'pending' }
    ]
  }
];

const browserIcons = {
  chrome: <Chrome className="h-4 w-4" />,
  firefox: <Globe className="h-4 w-4" />,
  safari: <Globe className="h-4 w-4" />,
  edge: <Globe className="h-4 w-4" />
};

const deviceIcons = {
  desktop: <Monitor className="h-4 w-4" />,
  mobile: <Smartphone className="h-4 w-4" />,
  tablet: <Tablet className="h-4 w-4" />
};

export default function E2ESuitePage() {
  const [tests, setTests] = useState(mockE2ETests);
  const [selectedTest, setSelectedTest] = useState<E2ETest | null>(null);
  const [isRunningAll, setIsRunningAll] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  // Add log message
  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  // Run single test
  const runTest = (test: E2ETest) => {
    addLog(`Starting test: ${test.name}`);
    
    // Set test to running
    setTests(prev => prev.map(t => 
      t.id === test.id ? { ...t, status: 'running' as const, progress: 0 } : t
    ));

    // Simulate test execution
    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < test.steps.length) {
        const step = test.steps[currentStep];
        
        // Update step status
        setTests(prev => prev.map(t => 
          t.id === test.id 
            ? {
                ...t,
                progress: ((currentStep + 1) / test.steps.length) * 100,
                screenshots: t.screenshots + (step.screenshot ? 1 : 0),
                steps: t.steps.map((s, i) => 
                  i === currentStep 
                    ? { ...s, status: 'passed' as const, duration: Math.floor(Math.random() * 1000) + 100 }
                    : i < currentStep 
                      ? { ...s, status: 'passed' as const }
                      : s
                )
              }
            : t
        ));
        
        addLog(`  ✓ ${step.name}`);
        currentStep++;
      } else {
        clearInterval(interval);
        
        // Complete test
        const finalStatus = Math.random() > 0.2 ? 'passed' : 'failed';
        setTests(prev => prev.map(t => 
          t.id === test.id 
            ? { 
                ...t, 
                status: finalStatus as 'passed' | 'failed',
                duration: Math.floor(Math.random() * 10000) + 5000
              }
            : t
        ));
        
        addLog(`Test ${finalStatus}: ${test.name}`);
      }
    }, 1000);
  };

  // Run all tests
  const runAllTests = () => {
    setIsRunningAll(true);
    addLog('Starting E2E test suite...');
    
    tests.forEach((test, index) => {
      setTimeout(() => runTest(test), index * 2000);
    });
    
    setTimeout(() => {
      setIsRunningAll(false);
      addLog('E2E test suite completed');
    }, tests.length * 2000 + 5000);
  };

  // Stop test
  const stopTest = (test: E2ETest) => {
    setTests(prev => prev.map(t => 
      t.id === test.id 
        ? { ...t, status: 'paused' as const }
        : t
    ));
    addLog(`Stopped test: ${test.name}`);
  };

  // Calculate statistics
  const stats = {
    total: tests.length,
    passed: tests.filter(t => t.status === 'passed').length,
    failed: tests.filter(t => t.status === 'failed').length,
    running: tests.filter(t => t.status === 'running').length
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
                E2E Test Suite Runner
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <FileText className="h-4 w-4" />
                Reports
              </button>
              <button
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Download className="h-4 w-4" />
                Export
              </button>
              <button
                onClick={runAllTests}
                disabled={isRunningAll}
                className={clsx(
                  "inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-semibold transition-colors",
                  isRunningAll
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600"
                    : "bg-blue-600 text-white hover:bg-blue-500 dark:bg-blue-500 dark:hover:bg-blue-400"
                )}
              >
                {isRunningAll ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Running Suite...
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
        {/* Statistics */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 mb-8">
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Scenarios</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              </div>
              <Zap className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passed</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.passed}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failed</p>
                <p className="text-2xl font-bold text-red-600 dark:text-red-400">{stats.failed}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>
          
          <div className="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Running</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.running}</p>
              </div>
              <RefreshCw className="h-8 w-8 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Test List */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {tests.map((test) => (
                <div
                  key={test.id}
                  className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {test.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {test.scenario}
                      </p>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          {browserIcons[test.browser]}
                          <span className="capitalize">{test.browser}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          {deviceIcons[test.device]}
                          <span className="capitalize">{test.device}</span>
                        </div>
                        {test.screenshots > 0 && (
                          <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Camera className="h-3 w-3" />
                            <span>{test.screenshots} screenshots</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {test.status === 'idle' && (
                        <button
                          onClick={() => runTest(test)}
                          className="p-2 rounded-md bg-blue-100 text-blue-600 hover:bg-blue-200 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30"
                        >
                          <Play className="h-4 w-4" />
                        </button>
                      )}
                      {test.status === 'running' && (
                        <>
                          <button
                            onClick={() => stopTest(test)}
                            className="p-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                          >
                            <Square className="h-4 w-4" />
                          </button>
                          <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />
                        </>
                      )}
                      {test.status === 'passed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                      {test.status === 'failed' && (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                      {test.status === 'paused' && (
                        <Pause className="h-5 w-5 text-yellow-500" />
                      )}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {test.status !== 'idle' && (
                    <div className="mb-4">
                      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{Math.round(test.progress)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                        <div
                          className={clsx(
                            'h-2 rounded-full transition-all duration-500',
                            test.status === 'passed' ? 'bg-green-500' :
                            test.status === 'failed' ? 'bg-red-500' :
                            'bg-blue-500'
                          )}
                          style={{ width: `${test.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Test Steps */}
                  <div className="space-y-2">
                    {test.steps.map((step, index) => (
                      <div
                        key={index}
                        className={clsx(
                          'flex items-center gap-2 text-sm',
                          step.status === 'passed' ? 'text-green-600 dark:text-green-400' :
                          step.status === 'failed' ? 'text-red-600 dark:text-red-400' :
                          step.status === 'running' ? 'text-blue-600 dark:text-blue-400' :
                          'text-gray-400 dark:text-gray-600'
                        )}
                      >
                        {step.status === 'passed' && <CheckCircle className="h-4 w-4" />}
                        {step.status === 'failed' && <XCircle className="h-4 w-4" />}
                        {step.status === 'running' && <RefreshCw className="h-4 w-4 animate-spin" />}
                        {step.status === 'pending' && <Clock className="h-4 w-4" />}
                        <span className={step.status !== 'pending' ? 'font-medium' : ''}>
                          {step.name}
                        </span>
                        {step.duration && (
                          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
                            {step.duration}ms
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {test.duration && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-800">
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total duration: {(test.duration / 1000).toFixed(2)}s
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Console Logs */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-gray-900 dark:border-gray-800 sticky top-4">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <span className="text-sm text-gray-300">Console Output</span>
                <button
                  onClick={() => setLogs([])}
                  className="text-xs text-gray-500 hover:text-gray-400"
                >
                  Clear
                </button>
              </div>
              <div className="p-4 h-96 overflow-y-auto">
                {logs.length === 0 ? (
                  <p className="text-xs text-gray-500">Waiting for test execution...</p>
                ) : (
                  <pre className="text-xs text-gray-100 font-mono">
                    {logs.map((log, i) => (
                      <div key={i} className="mb-1">{log}</div>
                    ))}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}