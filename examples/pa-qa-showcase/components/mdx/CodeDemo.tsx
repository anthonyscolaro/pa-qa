"use client"

import React, { useState, useRef, useEffect } from 'react'
import { Play, Copy, Check, RefreshCw, Download, ExternalLink } from 'lucide-react'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { materialDark, materialLight } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { useTheme } from 'next-themes'

interface CodeDemoProps {
  title: string
  language: string
  code: string
  runnable?: boolean
  editable?: boolean
  showLineNumbers?: boolean
  highlightLines?: number[]
  dependencies?: string[]
  onRun?: (code: string) => Promise<any>
  className?: string
}

interface ExecutionResult {
  output?: string
  error?: string
  duration?: number
  coverage?: number
}

export function CodeDemo({
  title,
  language,
  code: initialCode,
  runnable = false,
  editable = false,
  showLineNumbers = true,
  highlightLines = [],
  dependencies = [],
  onRun,
  className = ''
}: CodeDemoProps) {
  const [code, setCode] = useState(initialCode)
  const [copied, setCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [result, setResult] = useState<ExecutionResult | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const { theme } = useTheme()
  
  const isDark = theme === 'dark'
  const syntaxTheme = isDark ? materialDark : materialLight

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current && isEditing) {
      const textarea = textareaRef.current
      textarea.style.height = 'auto'
      textarea.style.height = textarea.scrollHeight + 'px'
    }
  }, [code, isEditing])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy code:', err)
    }
  }

  const handleRun = async () => {
    if (!runnable || !onRun) return
    
    setIsRunning(true)
    setResult(null)
    
    try {
      const startTime = performance.now()
      const output = await onRun(code)
      const endTime = performance.now()
      
      setResult({
        output: typeof output === 'string' ? output : JSON.stringify(output, null, 2),
        duration: endTime - startTime
      })
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : String(error)
      })
    } finally {
      setIsRunning(false)
    }
  }

  const handleReset = () => {
    setCode(initialCode)
    setResult(null)
    setIsEditing(false)
  }

  const handleDownload = () => {
    const extension = getFileExtension(language)
    const filename = `${title.toLowerCase().replace(/\s+/g, '-')}.${extension}`
    const blob = new Blob([code], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      php: 'php',
      yaml: 'yml',
      json: 'json',
      bash: 'sh',
      sql: 'sql',
      css: 'css',
      html: 'html',
      markdown: 'md'
    }
    return extensions[lang] || 'txt'
  }

  const getLanguageIcon = (lang: string): string => {
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
    return icons[lang] || '📄'
  }

  return (
    <div className={`bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span className="text-lg">{getLanguageIcon(language)}</span>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
          <span className="px-2 py-1 text-xs font-medium bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
            {language}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          {dependencies.length > 0 && (
            <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
              <span>Deps:</span>
              {dependencies.map((dep) => (
                <span key={dep} className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded">
                  {dep}
                </span>
              ))}
            </div>
          )}
          
          {editable && (
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
              title="Toggle edit mode"
            >
              ✏️
            </button>
          )}
          
          <button
            onClick={handleCopy}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
            title="Copy code"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
          
          <button
            onClick={handleDownload}
            className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
            title="Download file"
          >
            <Download className="w-4 h-4" />
          </button>
          
          {code !== initialCode && (
            <button
              onClick={handleReset}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded"
              title="Reset to original"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
          
          {runnable && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded text-sm font-medium"
              title="Run code"
            >
              {isRunning ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Play className="w-4 h-4" />
              )}
              {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
        </div>
      </div>

      {/* Code Content */}
      <div className="relative overflow-hidden">
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            className="w-full p-4 font-mono text-sm bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 border-none resize-none focus:outline-none"
            style={{ minHeight: '200px' }}
            spellCheck={false}
          />
        ) : (
          <SyntaxHighlighter
            language={language}
            style={syntaxTheme}
            showLineNumbers={showLineNumbers}
            wrapLines={true}
            customStyle={{
              margin: 0,
              padding: '1rem',
              fontSize: '14px',
              lineHeight: '1.5',
              borderRadius: '0'
            }}
            lineProps={(lineNumber) => ({
              style: {
                backgroundColor: highlightLines.includes(lineNumber) 
                  ? isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.05)'
                  : 'transparent'
              }
            })}
          >
            {code}
          </SyntaxHighlighter>
        )}
      </div>

      {/* Results Panel */}
      {result && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Output
            </span>
            {result.duration && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {result.duration.toFixed(2)}ms
              </span>
            )}
          </div>
          
          <div className="p-4">
            {result.error ? (
              <div className="text-red-600 dark:text-red-400 text-sm font-mono whitespace-pre-wrap">
                ❌ {result.error}
              </div>
            ) : (
              <div className="text-green-600 dark:text-green-400 text-sm font-mono whitespace-pre-wrap">
                ✅ {result.output}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer Info */}
      {(highlightLines.length > 0 || dependencies.length > 0) && (
        <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
          {highlightLines.length > 0 && (
            <span>Highlighted lines: {highlightLines.join(', ')}</span>
          )}
          {runnable && (
            <span className="ml-4 flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              Interactive code - click Run to execute
            </span>
          )}
        </div>
      )}
    </div>
  )
}