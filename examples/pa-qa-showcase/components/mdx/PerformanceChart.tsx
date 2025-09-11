'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  Zap, 
  Database,
  Monitor,
  Download,
  Filter,
  RefreshCw
} from 'lucide-react';

interface PerformanceMetric {
  timestamp: number;
  responseTime: number;
  throughput: number;
  errorRate: number;
  cpuUsage: number;
  memoryUsage: number;
  diskIO: number;
  networkIO: number;
}

interface PerformanceChartProps {
  data?: PerformanceMetric[];
  title?: string;
  description?: string;
  height?: number;
  showLegend?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number;
  className?: string;
}

const generateMockData = (count: number = 50): PerformanceMetric[] => {
  const now = Date.now();
  const data: PerformanceMetric[] = [];
  
  for (let i = 0; i < count; i++) {
    const timestamp = now - (count - i - 1) * 30000; // 30 second intervals
    const baseResponseTime = 200 + Math.sin(i * 0.1) * 50;
    const noise = (Math.random() - 0.5) * 100;
    
    data.push({
      timestamp,
      responseTime: Math.max(50, baseResponseTime + noise),
      throughput: 100 + Math.sin(i * 0.2) * 30 + Math.random() * 20,
      errorRate: Math.max(0, Math.min(10, 1 + Math.sin(i * 0.15) * 2 + Math.random() * 2)),
      cpuUsage: 30 + Math.sin(i * 0.12) * 20 + Math.random() * 15,
      memoryUsage: 45 + Math.sin(i * 0.08) * 15 + Math.random() * 10,
      diskIO: 20 + Math.sin(i * 0.18) * 15 + Math.random() * 10,
      networkIO: 15 + Math.sin(i * 0.22) * 10 + Math.random() * 8,
    });
  }
  
  return data;
};

const defaultData = generateMockData();

type MetricKey = keyof Omit<PerformanceMetric, 'timestamp'>;

interface ChartConfig {
  key: MetricKey;
  label: string;
  color: string;
  unit: string;
  icon: React.ComponentType<{ className?: string }>;
  format: (value: number) => string;
}

const chartConfigs: ChartConfig[] = [
  {
    key: 'responseTime',
    label: 'Response Time',
    color: '#3b82f6',
    unit: 'ms',
    icon: Clock,
    format: (value) => `${Math.round(value)}ms`
  },
  {
    key: 'throughput',
    label: 'Throughput',
    color: '#10b981',
    unit: 'req/s',
    icon: Zap,
    format: (value) => `${Math.round(value)} req/s`
  },
  {
    key: 'errorRate',
    label: 'Error Rate',
    color: '#ef4444',
    unit: '%',
    icon: TrendingDown,
    format: (value) => `${value.toFixed(1)}%`
  },
  {
    key: 'cpuUsage',
    label: 'CPU Usage',
    color: '#f59e0b',
    unit: '%',
    icon: Monitor,
    format: (value) => `${Math.round(value)}%`
  },
  {
    key: 'memoryUsage',
    label: 'Memory Usage',
    color: '#8b5cf6',
    unit: '%',
    icon: Database,
    format: (value) => `${Math.round(value)}%`
  },
];

export function PerformanceChart({
  data = defaultData,
  title = 'Performance Metrics',
  description = 'Real-time application performance monitoring',
  height = 400,
  showLegend = true,
  autoRefresh = false,
  refreshInterval = 30000,
  className = '',
}: PerformanceChartProps) {
  const [selectedMetrics, setSelectedMetrics] = useState<MetricKey[]>(['responseTime', 'throughput', 'errorRate']);
  const [timeRange, setTimeRange] = useState<'1h' | '6h' | '24h' | 'all'>('1h');
  const [isLive, setIsLive] = useState(autoRefresh);
  const svgRef = useRef<SVGSVGElement>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Filter data based on time range
  const filteredData = useMemo(() => {
    if (timeRange === 'all') return data;
    
    const now = Date.now();
    const ranges = {
      '1h': 60 * 60 * 1000,
      '6h': 6 * 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
    };
    
    const cutoff = now - ranges[timeRange];
    return data.filter(d => d.timestamp >= cutoff);
  }, [data, timeRange]);

  // Calculate chart dimensions and scales
  const chartData = useMemo(() => {
    if (filteredData.length === 0) return null;

    const margin = { top: 20, right: 20, bottom: 40, left: 60 };
    const width = 800;
    const chartHeight = height - margin.top - margin.bottom;
    const chartWidth = width - margin.left - margin.right;

    const timeExtent = [
      Math.min(...filteredData.map(d => d.timestamp)),
      Math.max(...filteredData.map(d => d.timestamp))
    ];

    const scales = selectedMetrics.reduce((acc, metric) => {
      const values = filteredData.map(d => d[metric]);
      acc[metric] = {
        min: Math.min(...values),
        max: Math.max(...values),
        range: Math.max(...values) - Math.min(...values)
      };
      return acc;
    }, {} as Record<MetricKey, { min: number; max: number; range: number }>);

    const timeScale = (timestamp: number) => 
      ((timestamp - timeExtent[0]) / (timeExtent[1] - timeExtent[0])) * chartWidth;

    const valueScale = (value: number, metric: MetricKey) => {
      const scale = scales[metric];
      const padding = scale.range * 0.1;
      const min = scale.min - padding;
      const max = scale.max + padding;
      return chartHeight - ((value - min) / (max - min)) * chartHeight;
    };

    return {
      margin,
      width,
      chartHeight,
      chartWidth,
      timeExtent,
      scales,
      timeScale,
      valueScale,
    };
  }, [filteredData, selectedMetrics, height]);

  // Auto-refresh functionality
  useEffect(() => {
    if (isLive && refreshInterval > 0) {
      refreshIntervalRef.current = setInterval(() => {
        // In a real app, this would fetch new data
        console.log('Refreshing performance data...');
      }, refreshInterval);
    } else {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isLive, refreshInterval]);

  const toggleMetric = (metric: MetricKey) => {
    setSelectedMetrics(prev => 
      prev.includes(metric) 
        ? prev.filter(m => m !== metric)
        : [...prev, metric]
    );
  };

  const exportData = () => {
    const exportData = {
      metrics: filteredData,
      timeRange,
      selectedMetrics,
      timestamp: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLatestValue = (metric: MetricKey) => {
    if (filteredData.length === 0) return 0;
    return filteredData[filteredData.length - 1][metric];
  };

  const getTrend = (metric: MetricKey) => {
    if (filteredData.length < 2) return 0;
    const latest = filteredData[filteredData.length - 1][metric];
    const previous = filteredData[filteredData.length - 2][metric];
    return latest - previous;
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <Activity className="w-4 h-4" />
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsLive(!isLive)}
            className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded transition-colors ${
              isLive 
                ? 'text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20' 
                : 'text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
            title={isLive ? 'Stop auto-refresh' : 'Start auto-refresh'}
          >
            <RefreshCw className={`w-3 h-3 ${isLive ? 'animate-spin' : ''}`} />
            {isLive ? 'Live' : 'Paused'}
          </button>
          <button
            onClick={exportData}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Export data"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as any)}
            className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          >
            <option value="1h">Last 1 hour</option>
            <option value="6h">Last 6 hours</option>
            <option value="24h">Last 24 hours</option>
            <option value="all">All time</option>
          </select>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {chartConfigs.map((config) => {
            const isSelected = selectedMetrics.includes(config.key);
            const IconComponent = config.icon;
            
            return (
              <button
                key={config.key}
                onClick={() => toggleMetric(config.key)}
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded transition-colors ${
                  isSelected
                    ? 'text-white'
                    : 'text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
                style={isSelected ? { backgroundColor: config.color } : {}}
              >
                <IconComponent className="w-3 h-3" />
                {config.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Metrics Summary */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {chartConfigs.map((config) => {
          const latest = getLatestValue(config.key);
          const trend = getTrend(config.key);
          const IconComponent = config.icon;
          
          return (
            <div key={config.key} className="text-center">
              <div className="flex items-center justify-center gap-1 mb-1">
                <IconComponent className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                  {config.label}
                </span>
              </div>
              <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {config.format(latest)}
              </div>
              <div className={`flex items-center justify-center gap-1 text-xs ${
                trend > 0 ? 'text-red-600 dark:text-red-400' : 
                trend < 0 ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'
              }`}>
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : 
                 trend < 0 ? <TrendingDown className="w-3 h-3" /> : null}
                {trend !== 0 && Math.abs(trend).toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart */}
      <div className="p-4">
        {chartData ? (
          <svg
            ref={svgRef}
            width={chartData.width}
            height={height}
            className="w-full h-auto border border-gray-200 dark:border-gray-700 rounded"
          >
            {/* Grid lines */}
            <g>
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1={chartData.margin.left}
                  y1={chartData.margin.top + ratio * chartData.chartHeight}
                  x2={chartData.margin.left + chartData.chartWidth}
                  y2={chartData.margin.top + ratio * chartData.chartHeight}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  className="text-gray-400"
                />
              ))}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <line
                  key={ratio}
                  x1={chartData.margin.left + ratio * chartData.chartWidth}
                  y1={chartData.margin.top}
                  x2={chartData.margin.left + ratio * chartData.chartWidth}
                  y2={chartData.margin.top + chartData.chartHeight}
                  stroke="currentColor"
                  strokeOpacity="0.1"
                  className="text-gray-400"
                />
              ))}
            </g>

            {/* Lines */}
            {selectedMetrics.map((metric) => {
              const config = chartConfigs.find(c => c.key === metric);
              if (!config) return null;

              const pathData = filteredData.map((d, i) => {
                const x = chartData.margin.left + chartData.timeScale(d.timestamp);
                const y = chartData.margin.top + chartData.valueScale(d[metric], metric);
                return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
              }).join(' ');

              return (
                <path
                  key={metric}
                  d={pathData}
                  fill="none"
                  stroke={config.color}
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              );
            })}

            {/* Data points */}
            {selectedMetrics.map((metric) => {
              const config = chartConfigs.find(c => c.key === metric);
              if (!config) return null;

              return filteredData.map((d, i) => {
                const x = chartData.margin.left + chartData.timeScale(d.timestamp);
                const y = chartData.margin.top + chartData.valueScale(d[metric], metric);

                return (
                  <circle
                    key={`${metric}-${i}`}
                    cx={x}
                    cy={y}
                    r="3"
                    fill={config.color}
                    className="opacity-70 hover:opacity-100"
                  >
                    <title>
                      {config.label}: {config.format(d[metric])} at {new Date(d.timestamp).toLocaleTimeString()}
                    </title>
                  </circle>
                );
              });
            })}

            {/* Axes */}
            <line
              x1={chartData.margin.left}
              y1={chartData.margin.top + chartData.chartHeight}
              x2={chartData.margin.left + chartData.chartWidth}
              y2={chartData.margin.top + chartData.chartHeight}
              stroke="currentColor"
              className="text-gray-400"
            />
            <line
              x1={chartData.margin.left}
              y1={chartData.margin.top}
              x2={chartData.margin.left}
              y2={chartData.margin.top + chartData.chartHeight}
              stroke="currentColor"
              className="text-gray-400"
            />
          </svg>
        ) : (
          <div className="flex items-center justify-center h-32 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No data to display</p>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {showLegend && selectedMetrics.length > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap gap-4">
            {selectedMetrics.map((metric) => {
              const config = chartConfigs.find(c => c.key === metric);
              if (!config) return null;
              
              return (
                <div key={metric} className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <span className="text-xs text-gray-600 dark:text-gray-400">
                    {config.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default PerformanceChart;