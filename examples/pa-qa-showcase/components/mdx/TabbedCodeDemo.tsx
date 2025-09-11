"use client"

import React, { useState } from 'react'
import { CodeDemo } from './CodeDemo'

interface CodeTab {
  label: string
  language: string
  code: string
  runnable?: boolean
  editable?: boolean
  dependencies?: string[]
}

interface TabbedCodeDemoProps {
  title: string
  tabs: CodeTab[]
  defaultTab?: number
  className?: string
  onRun?: (code: string, language: string) => Promise<any>
}

export function TabbedCodeDemo({
  title,
  tabs,
  defaultTab = 0,
  className = '',
  onRun
}: TabbedCodeDemoProps) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  
  const currentTab = tabs[activeTab]
  
  const getTabIcon = (language: string): string => {
    const icons: Record<string, string> = {
      typescript: '🟦',
      javascript: '🟨',
      python: '🐍',
      php: '🐘',
      yaml: '📝',
      json: '📋',
      bash: '🖥️',
      sql: '🗄️',
      css: '🎨',
      html: '🌐'
    }
    return icons[language] || '📄'
  }

  const handleTabRun = async (code: string) => {
    if (onRun) {
      return await onRun(code, currentTab.language)
    }
    return null
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Tab Headers */}
      <div className="flex items-center bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="px-4 py-3">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        </div>
        
        <div className="flex-1 flex items-center justify-end">
          <div className="flex" role="tablist">
            {tabs.map((tab, index) => (
              <button
                key={index}
                role="tab"
                aria-selected={activeTab === index}
                onClick={() => setActiveTab(index)}
                className={`
                  relative px-4 py-2 text-sm font-medium border-b-2 transition-colors
                  ${activeTab === index
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400 bg-white dark:bg-gray-900'
                    : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{getTabIcon(tab.language)}</span>
                  <span>{tab.label}</span>
                  
                  {tab.runnable && (
                    <span className="w-2 h-2 bg-green-500 rounded-full" title="Runnable code" />
                  )}
                  
                  {tab.editable && (
                    <span className="text-xs">✏️</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div role="tabpanel">
        <CodeDemo
          title={`${title} - ${currentTab.label}`}
          language={currentTab.language}
          code={currentTab.code}
          runnable={currentTab.runnable}
          editable={currentTab.editable}
          dependencies={currentTab.dependencies}
          onRun={currentTab.runnable ? handleTabRun : undefined}
          className="border-none rounded-none"
        />
      </div>

      {/* Tab Info */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>
            {activeTab + 1} of {tabs.length} - {currentTab.language.toUpperCase()}
          </span>
          
          <div className="flex items-center gap-4">
            {currentTab.dependencies && currentTab.dependencies.length > 0 && (
              <span>
                Dependencies: {currentTab.dependencies.join(', ')}
              </span>
            )}
            
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 bg-blue-500 rounded-full" />
              Active
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}