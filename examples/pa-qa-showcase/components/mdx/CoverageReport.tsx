'use client';

import React, { useState, useMemo } from 'react';
import { FileText, BarChart3, PieChart, TrendingUp, Filter, Download } from 'lucide-react';

interface FileCoverage {
  path: string;
  lines: {
    total: number;
    covered: number;
    percentage: number;
  };
  functions: {
    total: number;
    covered: number;
    percentage: number;
  };
  branches: {
    total: number;
    covered: number;
    percentage: number;
  };
  statements: {
    total: number;
    covered: number;
    percentage: number;
  };
}

interface CoverageData {
  summary: {
    lines: { total: number; covered: number; percentage: number };
    functions: { total: number; covered: number; percentage: number };
    branches: { total: number; covered: number; percentage: number };
    statements: { total: number; covered: number; percentage: number };
  };
  files: FileCoverage[];
  timestamp: string;
  threshold: {
    lines: number;
    functions: number;
    branches: number;
    statements: number;
  };
}

interface CoverageReportProps {
  data?: CoverageData;
  title?: string;
  description?: string;
  showDetails?: boolean;
  interactive?: boolean;
  className?: string;
}

const defaultData: CoverageData = {
  summary: {
    lines: { total: 1250, covered: 1087, percentage: 86.96 },
    functions: { total: 245, covered: 201, percentage: 82.04 },
    branches: { total: 340, covered: 289, percentage: 85.0 },
    statements: { total: 1180, covered: 1032, percentage: 87.46 },
  },
  files: [
    {
      path: 'src/components/Button.tsx',
      lines: { total: 45, covered: 42, percentage: 93.33 },
      functions: { total: 8, covered: 7, percentage: 87.5 },
      branches: { total: 12, covered: 11, percentage: 91.67 },
      statements: { total: 38, covered: 36, percentage: 94.74 },
    },
    {
      path: 'src/utils/validation.ts',
      lines: { total: 120, covered: 98, percentage: 81.67 },
      functions: { total: 15, covered: 12, percentage: 80.0 },
      branches: { total: 28, covered: 22, percentage: 78.57 },
      statements: { total: 105, covered: 89, percentage: 84.76 },
    },
    {
      path: 'src/hooks/useApi.ts',
      lines: { total: 85, covered: 76, percentage: 89.41 },
      functions: { total: 12, covered: 10, percentage: 83.33 },
      branches: { total: 18, covered: 15, percentage: 83.33 },
      statements: { total: 72, covered: 65, percentage: 90.28 },
    },
    {
      path: 'src/services/api.ts',
      lines: { total: 95, covered: 71, percentage: 74.74 },
      functions: { total: 18, covered: 13, percentage: 72.22 },
      branches: { total: 22, covered: 16, percentage: 72.73 },
      statements: { total: 87, covered: 65, percentage: 74.71 },
    },
  ],
  timestamp: new Date().toISOString(),
  threshold: {
    lines: 80,
    functions: 80,
    branches: 75,
    statements: 80,
  },
};

export function CoverageReport({
  data = defaultData,
  title = 'Code Coverage Report',
  description = 'Test coverage analysis and metrics',
  showDetails = true,
  interactive = true,
  className = '',
}: CoverageReportProps) {
  const [selectedMetric, setSelectedMetric] = useState<'lines' | 'functions' | 'branches' | 'statements'>('lines');
  const [sortBy, setSortBy] = useState<'path' | 'coverage'>('coverage');
  const [filterBelow, setFilterBelow] = useState<number | null>(null);

  const sortedFiles = useMemo(() => {
    let filtered = [...data.files];

    if (filterBelow !== null) {
      filtered = filtered.filter(file => file[selectedMetric].percentage < filterBelow);
    }

    return filtered.sort((a, b) => {
      if (sortBy === 'path') {
        return a.path.localeCompare(b.path);
      }
      return b[selectedMetric].percentage - a[selectedMetric].percentage;
    });
  }, [data.files, selectedMetric, sortBy, filterBelow]);

  const getPercentageColor = (percentage: number, threshold: number) => {
    if (percentage >= threshold) return 'text-green-600 dark:text-green-400';
    if (percentage >= threshold - 10) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getBarColor = (percentage: number, threshold: number) => {
    if (percentage >= threshold) return 'bg-green-500';
    if (percentage >= threshold - 10) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const downloadReport = () => {
    const reportData = {
      ...data,
      generated: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coverage-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
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
            {new Date(data.timestamp).toLocaleDateString()}
          </span>
          <button
            onClick={downloadReport}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Download report"
          >
            <Download className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
        {(['lines', 'functions', 'branches', 'statements'] as const).map((metric) => {
          const summary = data.summary[metric];
          const threshold = data.threshold[metric];
          const isSelected = selectedMetric === metric;
          
          return (
            <button
              key={metric}
              onClick={() => interactive && setSelectedMetric(metric)}
              className={`p-3 rounded-lg text-left transition-all ${
                isSelected
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-700'
                  : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700'
              } ${interactive ? 'cursor-pointer' : 'cursor-default'}`}
            >
              <div className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                {metric}
              </div>
              <div className={`text-lg font-bold mt-1 ${getPercentageColor(summary.percentage, threshold)}`}>
                {summary.percentage.toFixed(1)}%
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {summary.covered} / {summary.total}
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full transition-all ${getBarColor(summary.percentage, threshold)}`}
                  style={{ width: `${Math.min(summary.percentage, 100)}%` }}
                />
              </div>
            </button>
          );
        })}
      </div>

      {/* Controls */}
      {interactive && showDetails && (
        <div className="flex flex-wrap items-center gap-4 px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'path' | 'coverage')}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="coverage">Sort by Coverage</option>
              <option value="path">Sort by Path</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-600 dark:text-gray-400">Filter below:</span>
            <select
              value={filterBelow || ''}
              onChange={(e) => setFilterBelow(e.target.value ? Number(e.target.value) : null)}
              className="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
            >
              <option value="">All files</option>
              <option value="90">Below 90%</option>
              <option value="80">Below 80%</option>
              <option value="70">Below 70%</option>
              <option value="50">Below 50%</option>
            </select>
          </div>

          <div className="text-xs text-gray-500 dark:text-gray-400">
            {sortedFiles.length} file{sortedFiles.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* File Details */}
      {showDetails && (
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-800 sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  File
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {selectedMetric}
                </th>
                <th className="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Coverage
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
              {sortedFiles.map((file, index) => {
                const metric = file[selectedMetric];
                const threshold = data.threshold[selectedMetric];
                
                return (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-gray-400" />
                        <span className="text-gray-900 dark:text-gray-100 font-mono text-xs">
                          {file.path}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-xs text-gray-600 dark:text-gray-400">
                        {metric.covered} / {metric.total}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <span className={`text-sm font-medium ${getPercentageColor(metric.percentage, threshold)}`}>
                          {metric.percentage.toFixed(1)}%
                        </span>
                        <div className="w-16 bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all ${getBarColor(metric.percentage, threshold)}`}
                            style={{ width: `${Math.min(metric.percentage, 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Thresholds */}
      <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs">
          <span className="text-gray-600 dark:text-gray-400">
            Coverage Thresholds:
          </span>
          <div className="flex items-center gap-4">
            <span className="text-gray-600 dark:text-gray-400">
              Lines: {data.threshold.lines}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Functions: {data.threshold.functions}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Branches: {data.threshold.branches}%
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Statements: {data.threshold.statements}%
            </span>
          </div>
        </div>
      </div>

      {/* Overall Status */}
      <div className="px-4 py-2 text-center">
        {Object.entries(data.summary).every(([key, value]) => 
          value.percentage >= data.threshold[key as keyof typeof data.threshold]
        ) ? (
          <div className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <TrendingUp className="w-4 h-4" />
            <span className="text-sm font-medium">All thresholds met!</span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-yellow-600 dark:text-yellow-400">
            <PieChart className="w-4 h-4" />
            <span className="text-sm font-medium">Some thresholds below target</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default CoverageReport;