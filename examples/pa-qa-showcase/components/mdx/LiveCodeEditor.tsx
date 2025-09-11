'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useTheme } from 'next-themes';
import { Play, Copy, RotateCcw, Download } from 'lucide-react';

// Monaco Editor types (will be dynamically imported)
type Monaco = typeof import('monaco-editor');
type Editor = import('monaco-editor').editor.IStandaloneCodeEditor;

interface LiveCodeEditorProps {
  initialCode?: string;
  language?: string;
  title?: string;
  description?: string;
  height?: number;
  readonly?: boolean;
  showOutput?: boolean;
  allowDownload?: boolean;
  onCodeChange?: (code: string) => void;
  onRun?: (code: string) => Promise<any>;
  className?: string;
}

interface ExecutionResult {
  output?: any;
  error?: string;
  logs?: string[];
  duration?: number;
}

export function LiveCodeEditor({
  initialCode = '',
  language = 'typescript',
  title = 'Live Code Editor',
  description,
  height = 400,
  readonly = false,
  showOutput = true,
  allowDownload = true,
  onCodeChange,
  onRun,
  className = '',
}: LiveCodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const monacoRef = useRef<Monaco | null>(null);
  const editorInstanceRef = useRef<Editor | null>(null);
  const { theme } = useTheme();
  
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(true);
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<ExecutionResult | null>(null);
  const [copied, setCopied] = useState(false);

  // Initialize Monaco Editor
  useEffect(() => {
    let isMounted = true;

    const initMonaco = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const monaco = await import('monaco-editor');
        monacoRef.current = monaco;

        if (!isMounted || !editorRef.current) return;

        // Configure Monaco Editor
        monaco.languages.typescript.typescriptDefaults.setCompilerOptions({
          target: monaco.languages.typescript.ScriptTarget.ES2020,
          allowNonTsExtensions: true,
          moduleResolution: monaco.languages.typescript.ModuleResolutionKind.NodeJs,
          module: monaco.languages.typescript.ModuleKind.CommonJS,
          noEmit: true,
          esModuleInterop: true,
          jsx: monaco.languages.typescript.JsxEmit.React,
          reactNamespace: 'React',
          allowJs: true,
          typeRoots: ['node_modules/@types'],
        });

        // Add React types
        monaco.languages.typescript.typescriptDefaults.addExtraLib(
          `declare module 'react' {
            export = React;
            export as namespace React;
            namespace React {
              interface Component<P = {}, S = {}> {}
              interface ComponentType<P = {}> {}
              interface ReactElement<P = any> {}
              interface FC<P = {}> {}
              function useState<T>(initialState: T | (() => T)): [T, (value: T | ((prev: T) => T)) => void];
              function useEffect(effect: () => void | (() => void), deps?: any[]): void;
              function useCallback<T extends (...args: any[]) => any>(callback: T, deps: any[]): T;
              function useMemo<T>(factory: () => T, deps: any[]): T;
            }
          }`,
          'file:///node_modules/@types/react/index.d.ts'
        );

        // Create editor instance
        const editor = monaco.editor.create(editorRef.current, {
          value: code,
          language,
          theme: theme === 'dark' ? 'vs-dark' : 'vs',
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          fontSize: 14,
          lineNumbers: 'on',
          folding: true,
          automaticLayout: true,
          wordWrap: 'on',
          readOnly: readonly,
          tabSize: 2,
          insertSpaces: true,
          formatOnPaste: true,
          formatOnType: true,
        });

        editorInstanceRef.current = editor;

        // Listen for content changes
        editor.onDidChangeModelContent(() => {
          const value = editor.getValue();
          setCode(value);
          onCodeChange?.(value);
        });

        // Add keyboard shortcuts
        editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
          handleRun();
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Failed to initialize Monaco Editor:', error);
        setIsLoading(false);
      }
    };

    initMonaco();

    return () => {
      isMounted = false;
      if (editorInstanceRef.current) {
        editorInstanceRef.current.dispose();
      }
    };
  }, []);

  // Update theme
  useEffect(() => {
    if (monacoRef.current && editorInstanceRef.current) {
      monacoRef.current.editor.setTheme(theme === 'dark' ? 'vs-dark' : 'vs');
    }
  }, [theme]);

  // Update code when initialCode changes
  useEffect(() => {
    if (editorInstanceRef.current && initialCode !== code) {
      editorInstanceRef.current.setValue(initialCode);
      setCode(initialCode);
    }
  }, [initialCode]);

  const handleRun = useCallback(async () => {
    if (!onRun || isRunning) return;

    setIsRunning(true);
    setResult(null);

    try {
      const startTime = Date.now();
      const output = await onRun(code);
      const duration = Date.now() - startTime;

      setResult({
        output,
        duration,
        logs: []
      });
    } catch (error) {
      setResult({
        error: error instanceof Error ? error.message : String(error),
        logs: []
      });
    } finally {
      setIsRunning(false);
    }
  }, [code, onRun, isRunning]);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  }, [code]);

  const handleReset = useCallback(() => {
    if (editorInstanceRef.current) {
      editorInstanceRef.current.setValue(initialCode);
      setCode(initialCode);
      setResult(null);
    }
  }, [initialCode]);

  const handleDownload = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code.${language === 'typescript' ? 'ts' : language}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [code, language]);

  const formatOutput = (output: any): string => {
    if (output === null) return 'null';
    if (output === undefined) return 'undefined';
    if (typeof output === 'object') {
      try {
        return JSON.stringify(output, null, 2);
      } catch {
        return String(output);
      }
    }
    return String(output);
  };

  return (
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-white dark:bg-gray-900 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {title}
          </h3>
          {description && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onRun && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-green-400 rounded transition-colors"
              title="Run code (Ctrl/Cmd + Enter)"
            >
              <Play className="w-3 h-3" />
              {isRunning ? 'Running...' : 'Run'}
            </button>
          )}
          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Copy code"
          >
            <Copy className="w-3 h-3" />
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={handleReset}
            className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
            title="Reset to initial code"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
          {allowDownload && (
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Download code"
            >
              <Download className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Editor */}
      <div className="relative">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-gray-800 z-10">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Loading editor...
            </div>
          </div>
        )}
        <div
          ref={editorRef}
          style={{ height: `${height}px` }}
          className="w-full"
        />
      </div>

      {/* Output */}
      {showOutput && result && (
        <div className="border-t border-gray-200 dark:border-gray-700">
          <div className="px-4 py-2 bg-gray-50 dark:bg-gray-800">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                Output
              </h4>
              {result.duration && (
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {result.duration}ms
                </span>
              )}
            </div>
          </div>
          <div className="px-4 py-3 max-h-48 overflow-auto">
            {result.error ? (
              <div className="text-sm text-red-600 dark:text-red-400 font-mono whitespace-pre-wrap">
                Error: {result.error}
              </div>
            ) : (
              <div className="text-sm text-gray-900 dark:text-gray-100 font-mono whitespace-pre-wrap">
                {formatOutput(result.output)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default LiveCodeEditor;