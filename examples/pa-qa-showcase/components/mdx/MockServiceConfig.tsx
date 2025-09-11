'use client';

import React, { useState, useCallback, useRef } from 'react';
import { 
  Globe, 
  Play, 
  Pause, 
  RotateCcw, 
  Plus, 
  Trash2, 
  Copy, 
  Download,
  Eye,
  EyeOff,
  Clock,
  CheckCircle
} from 'lucide-react';

interface MockEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  statusCode: number;
  delay: number;
  response: any;
  enabled: boolean;
  description?: string;
}

interface MockRequest {
  id: string;
  timestamp: number;
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;
}

interface MockServiceConfigProps {
  title?: string;
  description?: string;
  baseUrl?: string;
  initialEndpoints?: MockEndpoint[];
  onConfigChange?: (endpoints: MockEndpoint[]) => void;
  className?: string;
}

const defaultEndpoints: MockEndpoint[] = [
  {
    id: '1',
    method: 'GET',
    path: '/api/users',
    statusCode: 200,
    delay: 500,
    response: [
      { id: 1, name: 'John Doe', email: 'john@example.com' },
      { id: 2, name: 'Jane Smith', email: 'jane@example.com' }
    ],
    enabled: true,
    description: 'Get all users'
  },
  {
    id: '2',
    method: 'POST',
    path: '/api/users',
    statusCode: 201,
    delay: 800,
    response: { id: 3, name: 'New User', email: 'new@example.com' },
    enabled: true,
    description: 'Create new user'
  },
  {
    id: '3',
    method: 'GET',
    path: '/api/users/:id',
    statusCode: 200,
    delay: 300,
    response: { id: 1, name: 'John Doe', email: 'john@example.com', profile: { bio: 'Software developer' } },
    enabled: true,
    description: 'Get user by ID'
  },
  {
    id: '4',
    method: 'DELETE',
    path: '/api/users/:id',
    statusCode: 204,
    delay: 400,
    response: null,
    enabled: false,
    description: 'Delete user'
  }
];

export function MockServiceConfig({
  title = 'Mock API Service',
  description = 'Configure and test API endpoints',
  baseUrl = 'http://localhost:3000',
  initialEndpoints = defaultEndpoints,
  onConfigChange,
  className = '',
}: MockServiceConfigProps) {
  const [endpoints, setEndpoints] = useState<MockEndpoint[]>(initialEndpoints);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedEndpoint, setSelectedEndpoint] = useState<string | null>(null);
  const [requests, setRequests] = useState<MockRequest[]>([]);
  const [showResponse, setShowResponse] = useState<{ [key: string]: boolean }>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const updateEndpoint = useCallback((id: string, updates: Partial<MockEndpoint>) => {
    setEndpoints(prev => {
      const updated = prev.map(endpoint => 
        endpoint.id === id ? { ...endpoint, ...updates } : endpoint
      );
      onConfigChange?.(updated);
      return updated;
    });
  }, [onConfigChange]);

  const addEndpoint = useCallback(() => {
    const newEndpoint: MockEndpoint = {
      id: Date.now().toString(),
      method: 'GET',
      path: '/api/new-endpoint',
      statusCode: 200,
      delay: 500,
      response: { message: 'Success' },
      enabled: true,
      description: 'New endpoint'
    };
    
    setEndpoints(prev => {
      const updated = [...prev, newEndpoint];
      onConfigChange?.(updated);
      return updated;
    });
    setSelectedEndpoint(newEndpoint.id);
  }, [onConfigChange]);

  const removeEndpoint = useCallback((id: string) => {
    setEndpoints(prev => {
      const updated = prev.filter(endpoint => endpoint.id !== id);
      onConfigChange?.(updated);
      return updated;
    });
    if (selectedEndpoint === id) {
      setSelectedEndpoint(null);
    }
  }, [selectedEndpoint, onConfigChange]);

  const startMockService = useCallback(() => {
    setIsRunning(true);
    
    // Simulate random requests to enabled endpoints
    intervalRef.current = setInterval(() => {
      const enabledEndpoints = endpoints.filter(e => e.enabled);
      if (enabledEndpoints.length === 0) return;
      
      const randomEndpoint = enabledEndpoints[Math.floor(Math.random() * enabledEndpoints.length)];
      if (!randomEndpoint) return; // TypeScript safety check
      
      const request: MockRequest = {
        id: Date.now().toString(),
        timestamp: Date.now(),
        method: randomEndpoint.method,
        path: randomEndpoint.path,
        statusCode: randomEndpoint.statusCode,
        responseTime: randomEndpoint.delay + Math.floor(Math.random() * 200)
      };
      
      setRequests(prev => [request, ...prev.slice(0, 19)]); // Keep last 20 requests
    }, 2000 + Math.random() * 3000);
  }, [endpoints]);

  const stopMockService = useCallback(() => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const clearRequests = useCallback(() => {
    setRequests([]);
  }, []);

  const exportConfig = useCallback(() => {
    const config = {
      baseUrl,
      endpoints,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'mock-api-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [baseUrl, endpoints]);

  const copyConfig = useCallback(async () => {
    const config = { baseUrl, endpoints };
    try {
      await navigator.clipboard.writeText(JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to copy config:', error);
    }
  }, [baseUrl, endpoints]);

  const toggleResponse = useCallback((id: string) => {
    setShowResponse(prev => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const getMethodColor = (method: string) => {
    switch (method) {
      case 'GET': return 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20';
      case 'POST': return 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20';
      case 'PUT': return 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20';
      case 'DELETE': return 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20';
      case 'PATCH': return 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20';
      default: return 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20';
    }
  };

  const getStatusColor = (statusCode: number) => {
    if (statusCode >= 200 && statusCode < 300) return 'text-green-600 dark:text-green-400';
    if (statusCode >= 400 && statusCode < 500) return 'text-yellow-600 dark:text-yellow-400';
    if (statusCode >= 500) return 'text-red-600 dark:text-red-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const selectedEndpointData = selectedEndpoint ? endpoints.find(e => e.id === selectedEndpoint) : null;

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Globe className="w-4 h-4" />
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
            <span className="text-xs text-gray-600 dark:text-gray-400">
              {isRunning ? 'Running' : 'Stopped'}
            </span>
          </div>
          {isRunning ? (
            <button
              onClick={stopMockService}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              <Pause className="w-3 h-3" />
              Stop
            </button>
          ) : (
            <button
              onClick={startMockService}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
            >
              <Play className="w-3 h-3" />
              Start
            </button>
          )}
          <button
            onClick={exportConfig}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Export config"
          >
            <Download className="w-3 h-3" />
          </button>
          <button
            onClick={copyConfig}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Copy config"
          >
            <Copy className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex h-96">
        {/* Endpoints List */}
        <div className="w-1/2 border-r border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Endpoints ({endpoints.length})
            </span>
            <button
              onClick={addEndpoint}
              className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30 rounded transition-colors"
            >
              <Plus className="w-3 h-3" />
              Add
            </button>
          </div>
          
          <div className="overflow-auto h-full max-h-80">
            {endpoints.map((endpoint) => (
              <div
                key={endpoint.id}
                className={`p-3 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  selectedEndpoint === endpoint.id ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500' : ''
                }`}
                onClick={() => setSelectedEndpoint(endpoint.id)}
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={endpoint.enabled}
                        onChange={(e) => updateEndpoint(endpoint.id, { enabled: e.target.checked })}
                        onClick={(e) => e.stopPropagation()}
                        className="mr-1 w-3 h-3"
                      />
                      <span className="sr-only">Enable endpoint</span>
                    </label>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      removeEndpoint(endpoint.id);
                    }}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    title="Delete endpoint"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                  {endpoint.path}
                </div>
                {endpoint.description && (
                  <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    {endpoint.description}
                  </div>
                )}
                <div className="flex items-center gap-2 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span className={getStatusColor(endpoint.statusCode)}>
                    {endpoint.statusCode}
                  </span>
                  <span>•</span>
                  <span>{endpoint.delay}ms</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Endpoint Details / Requests */}
        <div className="w-1/2">
          {selectedEndpointData ? (
            <div className="h-full flex flex-col">
              <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Endpoint Configuration
                </span>
              </div>
              
              <div className="flex-1 overflow-auto p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Method
                    </label>
                    <select
                      value={selectedEndpointData.method}
                      onChange={(e) => updateEndpoint(selectedEndpointData.id, { method: e.target.value as any })}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    >
                      <option value="GET">GET</option>
                      <option value="POST">POST</option>
                      <option value="PUT">PUT</option>
                      <option value="DELETE">DELETE</option>
                      <option value="PATCH">PATCH</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Status Code
                    </label>
                    <input
                      type="number"
                      value={selectedEndpointData.statusCode}
                      onChange={(e) => updateEndpoint(selectedEndpointData.id, { statusCode: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Path
                  </label>
                  <input
                    type="text"
                    value={selectedEndpointData.path}
                    onChange={(e) => updateEndpoint(selectedEndpointData.id, { path: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delay (ms)
                    </label>
                    <input
                      type="number"
                      value={selectedEndpointData.delay}
                      onChange={(e) => updateEndpoint(selectedEndpointData.id, { delay: Number(e.target.value) })}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <label className="flex items-center text-xs text-gray-700 dark:text-gray-300">
                      <input
                        type="checkbox"
                        checked={selectedEndpointData.enabled}
                        onChange={(e) => updateEndpoint(selectedEndpointData.id, { enabled: e.target.checked })}
                        className="mr-2"
                      />
                      Enabled
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Description
                  </label>
                  <input
                    type="text"
                    value={selectedEndpointData.description || ''}
                    onChange={(e) => updateEndpoint(selectedEndpointData.id, { description: e.target.value })}
                    className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                    placeholder="Optional description"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-gray-700 dark:text-gray-300">
                      Response
                    </label>
                    <button
                      onClick={() => toggleResponse(selectedEndpointData.id)}
                      className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      {showResponse[selectedEndpointData.id] ? (
                        <EyeOff className="w-3 h-3" />
                      ) : (
                        <Eye className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                  {showResponse[selectedEndpointData.id] ? (
                    <textarea
                      value={JSON.stringify(selectedEndpointData.response, null, 2)}
                      onChange={(e) => {
                        try {
                          const response = JSON.parse(e.target.value);
                          updateEndpoint(selectedEndpointData.id, { response });
                        } catch {
                          // Invalid JSON, don't update
                        }
                      }}
                      className="w-full text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 font-mono"
                      rows={6}
                    />
                  ) : (
                    <div className="text-xs text-gray-500 dark:text-gray-400 italic">
                      Click the eye icon to view/edit response
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <div className="flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  Recent Requests ({requests.length})
                </span>
                {requests.length > 0 && (
                  <button
                    onClick={clearRequests}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
              
              <div className="overflow-auto h-full max-h-80">
                {requests.length === 0 ? (
                  <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
                    <div className="text-center">
                      <Clock className="w-6 h-6 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No requests yet</p>
                      <p className="text-xs">Start the service to see requests</p>
                    </div>
                  </div>
                ) : (
                  requests.map((request) => (
                    <div
                      key={request.id}
                      className="p-3 border-b border-gray-200 dark:border-gray-700"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded ${getMethodColor(request.method)}`}>
                            {request.method}
                          </span>
                          <CheckCircle className="w-3 h-3 text-green-500" />
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(request.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      <div className="text-sm font-mono text-gray-900 dark:text-gray-100">
                        {request.path}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                        <span className={getStatusColor(request.statusCode)}>
                          {request.statusCode}
                        </span>
                        <span>•</span>
                        <span>{request.responseTime}ms</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default MockServiceConfig;