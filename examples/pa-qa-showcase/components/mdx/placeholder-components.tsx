"use client"

import React from 'react'
import { AlertCircle, ExternalLink, ArrowRight, CheckCircle, Clock } from 'lucide-react'

// Placeholder components for MDX content until full implementation

export function TestingPyramid({ levels }: { levels: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">Testing Pyramid</h3>
      <div className="space-y-4">
        {levels.map((level, index) => (
          <div key={index} className="p-4 rounded-lg" style={{ backgroundColor: level.color + '20' }}>
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{level.name}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{level.description}</p>
            <div className="flex gap-2 mt-2">
              {level.tools.map((tool: string, i: number) => (
                <span key={i} className="px-2 py-1 bg-gray-100 dark:bg-gray-800 rounded text-xs">
                  {tool}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function PrincipleCard({ title, principles }: { title: string, principles: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-4">
        {principles.map((principle, index) => (
          <div key={index} className="border-b border-gray-200 dark:border-gray-700 last:border-b-0 pb-4 last:pb-0">
            <h4 className="font-medium text-gray-900 dark:text-gray-100">{principle.title}</h4>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{principle.description}</p>
            {principle.example && (
              <p className="text-xs text-gray-500 dark:text-gray-500 mt-2 italic">
                Example: {principle.example}
              </p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

export function CoverageChart({ title, data }: { title: string, data: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-4">
        {data.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <span className="text-sm text-gray-900 dark:text-gray-100">{item.category}</span>
            <div className="flex items-center gap-3">
              <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className="h-2 rounded-full" 
                  style={{ 
                    width: `${(item.current / item.target) * 100}%`,
                    backgroundColor: item.color 
                  }}
                />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                {item.current}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function FileTree({ title, structure }: { title: string, structure: any }) {
  const renderTree = (obj: any, depth = 0) => {
    return Object.entries(obj).map(([key, value]) => (
      <div key={key} style={{ marginLeft: `${depth * 20}px` }} className="py-1">
        {typeof value === 'object' && value !== null ? (
          <>
            <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
              <span>📁</span>
              <span className="font-medium">{key}</span>
            </div>
            {renderTree(value, depth + 1)}
          </>
        ) : (
          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
            <span>📄</span>
            <span>{key}</span>
          </div>
        )}
      </div>
    ))
  }

  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="font-mono text-sm">
        {renderTree(structure)}
      </div>
    </div>
  )
}

export function CallToAction({ title, description, primaryAction, secondaryAction }: any) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-700 p-6 text-center">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400 mb-4">{description}</p>
      <div className="flex justify-center gap-3">
        {primaryAction && (
          <a
            href={primaryAction.href}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
          >
            {primaryAction.label}
            <ArrowRight className="w-4 h-4" />
          </a>
        )}
        {secondaryAction && (
          <a
            href={secondaryAction.href}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-md transition-colors"
          >
            {secondaryAction.label}
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </div>
  )
}

export function StepByStep({ title, steps }: { title: string, steps: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-6 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-medium">
              {index + 1}
            </div>
            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{step.title}</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{step.description}</p>
              {step.code && (
                <pre className="bg-gray-100 dark:bg-gray-800 p-3 rounded text-sm overflow-x-auto">
                  <code>{step.code}</code>
                </pre>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ChecklistCard({ title, items }: { title: string, items: any[] }) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-3">
            {item.checked ? (
              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
            ) : (
              <div className="w-5 h-5 border-2 border-gray-300 dark:border-gray-600 rounded flex-shrink-0" />
            )}
            <span className={`text-sm ${item.checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-400'}`}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// Add more placeholder components as needed
export function ProcessFlow({ title, steps, cyclic }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">{title}</h3>
      <div className="flex items-center justify-center">
        <div className="flex items-center space-x-4">
          {steps.map((step: any, index: number) => (
            <React.Fragment key={index}>
              <div className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold"
                  style={{ backgroundColor: step.color }}
                >
                  {index + 1}
                </div>
                <div className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{step.name}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">{step.duration}</div>
              </div>
              {index < steps.length - 1 && (
                <ArrowRight className="w-6 h-6 text-gray-400" />
              )}
            </React.Fragment>
          ))}
          {cyclic && (
            <>
              <ArrowRight className="w-6 h-6 text-gray-400" />
              <div className="text-sm text-gray-600 dark:text-gray-400">Repeat</div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function DecisionTree({ title, question, branches }: any) {
  return (
    <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{question}</p>
      <div className="space-y-3">
        {branches.map((branch: any, index: number) => (
          <div key={index} className="p-3 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="font-medium text-gray-900 dark:text-gray-100 mb-1">{branch.condition}</div>
            <div 
              className="text-sm px-2 py-1 rounded inline-block"
              style={{ backgroundColor: branch.color + '20', color: branch.color }}
            >
              {branch.result}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// All components are exported individually above