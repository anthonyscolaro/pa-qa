'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft,
  Activity,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Play,
  BarChart3,
  Zap,
  AlertTriangle,
  TrendingUp,
  Server
} from 'lucide-react';
import { clsx } from 'clsx';

interface ApiEndpoint {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  status: 'passing' | 'failing' | 'pending' | 'running';
  responseTime: number;
  lastRun: string;
  assertions: number;
  coverage: number;
}

const mockEndpoints: ApiEndpoint[] = [
  {
    name: 'Get User Profile',
    method: 'GET',
    path: '/api/users/:id',
    status: 'passing',
    responseTime: 45,
    lastRun: '2 minutes ago',
    assertions: 8,
    coverage: 100
  },
  {
    name: 'Create Post',
    method: 'POST',
    path: '/api/posts',
    status: 'passing',
    responseTime: 123,
    lastRun: '5 minutes ago',
    assertions: 12,
    coverage: 95
  },
  {
    name: 'Update Settings',
    method: 'PUT',
    path: '/api/settings',
    status: 'failing',
    responseTime: 89,
    lastRun: '10 minutes ago',
    assertions: 6,
    coverage: 78
  },
  {
    name: 'Delete Comment',
    method: 'DELETE',
    path: '/api/comments/:id',
    status: 'passing',
    responseTime: 34,
    lastRun: '15 minutes ago',
    assertions: 4,
    coverage: 100
  },
  {
    name: 'Search Products',
    method: 'GET',
    path: '/api/products/search',
    status: 'running',
    responseTime: 156,
    lastRun: 'Running now...',
    assertions: 15,
    coverage: 88
  },
  {
    name: 'Upload File',
    method: 'POST',
    path: '/api/files/upload',
    status: 'pending',
    responseTime: 0,
    lastRun: 'Never',
    assertions: 10,
    coverage: 0
  }
];

const methodColors = {
  GET: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400',
  POST: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
  PUT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400',
  DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400',
  PATCH: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
};

const statusIcons = {
  passing: <CheckCircle className="h-5 w-5 text-green-500" />,
  failing: <XCircle className="h-5 w-5 text-red-500" />,
  pending: <Clock className="h-5 w-5 text-gray-400" />,
  running: <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />
};

export default function ApiDashboardPage() {
  const [endpoints, setEndpoints] = useState(mockEndpoints);
  const [selectedEndpoint, setSelectedEndpoint] = useState<ApiEndpoint | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  // Calculate statistics
  const stats = {
    total: endpoints.length,
    passing: endpoints.filter(e => e.status === 'passing').length,
    failing: endpoints.filter(e => e.status === 'failing').length,
    coverage: Math.round(endpoints.reduce((acc, e) => acc + e.coverage, 0) / endpoints.length),
    avgResponseTime: Math.round(endpoints.reduce((acc, e) => acc + e.responseTime, 0) / endpoints.length)
  };

  const runAllTests = () => {
    setIsRunning(true);
    // Simulate running tests
    setEndpoints(endpoints.map(e => ({ ...e, status: 'running' as const })));
    
    // Simulate test completion
    setTimeout(() => {
      setEndpoints(endpoints.map(e => ({
        ...e,
        status: Math.random() > 0.2 ? 'passing' as const : 'failing' as const,
        lastRun: 'Just now',
        responseTime: Math.floor(Math.random() * 200) + 20
      })));
      setIsRunning(false);
    }, 3000);
  };

  const runSingleTest = (endpoint: ApiEndpoint) => {
    setEndpoints(endpoints.map(e => 
      e.path === endpoint.path ? { ...e, status: 'running' as const } : e
    ));
    
    setTimeout(() => {
      setEndpoints(endpoints.map(e => 
        e.path === endpoint.path 
          ? {
              ...e,
              status: Math.random() > 0.3 ? 'passing' as const : 'failing' as const,
              lastRun: 'Just now',
              responseTime: Math.floor(Math.random() * 200) + 20
            }
          : e
      ));
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
                API Testing Dashboard
              </h1>
            </div>
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
      </header>

      {/* Statistics Cards */}
      <div className="mx-auto max-w-7xl px-6 py-8">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-5">
          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Tests</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.total}
                </p>
              </div>
              <Activity className="h-8 w-8 text-blue-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passing</p>
                <p className="mt-1 text-2xl font-bold text-green-600 dark:text-green-400">
                  {stats.passing}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Failing</p>
                <p className="mt-1 text-2xl font-bold text-red-600 dark:text-red-400">
                  {stats.failing}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Coverage</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.coverage}%
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-500" />
            </div>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Avg Response</p>
                <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                  {stats.avgResponseTime}ms
                </p>
              </div>
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
        </div>

        {/* Endpoints Table */}
        <div className="mt-8 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              API Endpoints
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Endpoint
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Response Time
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Coverage
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Last Run
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                {endpoints.map((endpoint) => (
                  <tr
                    key={endpoint.path}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                    onClick={() => setSelectedEndpoint(endpoint)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      {statusIcons[endpoint.status]}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={clsx(
                        'inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-medium',
                        methodColors[endpoint.method]
                      )}>
                        {endpoint.method}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {endpoint.name}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {endpoint.path}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {endpoint.responseTime > 100 && (
                          <AlertTriangle className="h-4 w-4 text-yellow-500" />
                        )}
                        <span className={clsx(
                          'text-sm',
                          endpoint.responseTime > 100 
                            ? 'text-yellow-600 dark:text-yellow-400 font-medium' 
                            : 'text-gray-900 dark:text-gray-100'
                        )}>
                          {endpoint.responseTime}ms
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                          <div 
                            className={clsx(
                              'h-2 rounded-full',
                              endpoint.coverage >= 80 ? 'bg-green-500' : endpoint.coverage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                            )}
                            style={{ width: `${endpoint.coverage}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {endpoint.coverage}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {endpoint.lastRun}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          runSingleTest(endpoint);
                        }}
                        className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                      >
                        <Play className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Endpoint Details */}
        {selectedEndpoint && (
          <div className="mt-8 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Test Details: {selectedEndpoint.name}
              </h3>
              <button
                onClick={() => setSelectedEndpoint(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>
            
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Request Details
                </h4>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <pre className="text-sm text-gray-600 dark:text-gray-400">
{`${selectedEndpoint.method} ${selectedEndpoint.path}
Content-Type: application/json
Authorization: Bearer [token]

{
  "assertions": ${selectedEndpoint.assertions},
  "coverage": ${selectedEndpoint.coverage}%
}`}
                  </pre>
                </div>
              </div>
              
              <div>
                <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Response Metrics
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Status Code</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedEndpoint.status === 'passing' ? '200 OK' : '500 Error'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Response Time</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedEndpoint.responseTime}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600 dark:text-gray-400">Test Assertions</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {selectedEndpoint.assertions} passed
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}