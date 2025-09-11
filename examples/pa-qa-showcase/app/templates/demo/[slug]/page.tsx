'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft,
  Code2,
  Package,
  FileCode,
  Terminal,
  FolderTree,
  CheckCircle,
  Copy,
  Download,
  Github,
  Play,
  BookOpen
} from 'lucide-react';
import { useState } from 'react';
import { clsx } from 'clsx';

// Template configurations for different demos
const templateDemos: Record<string, any> = {
  'next-app-router': {
    name: 'Next.js App Router Template',
    description: 'Production-ready Next.js template with App Router, TypeScript, and comprehensive testing',
    techStack: ['Next.js 15', 'React 19', 'TypeScript', 'Tailwind CSS', 'Jest', 'Playwright'],
    structure: [
      'app/',
      '  layout.tsx',
      '  page.tsx',
      '  globals.css',
      'components/',
      '  ui/',
      '  shared/',
      'lib/',
      '  utils.ts',
      'tests/',
      '  unit/',
      '  e2e/',
      'cypress/',
      'playwright/'
    ],
    commands: {
      install: 'npx create-next-app@latest my-app --typescript --tailwind --app',
      dev: 'npm run dev',
      test: 'npm run test',
      e2e: 'npm run e2e'
    },
    features: [
      'Server Components & Client Components',
      'API Routes with App Router',
      'Optimized Image & Font Loading',
      'SEO & Metadata Management',
      'TypeScript Strict Mode',
      'Comprehensive Test Coverage'
    ],
    sampleCode: `// app/page.tsx
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

export default function HomePage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-6">
        Welcome to Next.js 15
      </h1>
      <Card className="p-6">
        <p>Your production-ready template is ready!</p>
        <Button className="mt-4">Get Started</Button>
      </Card>
    </main>
  )
}`
  },
  'react-spa': {
    name: 'React SPA Template',
    description: 'Modern single-page application with Vite, React Router, and comprehensive testing',
    techStack: ['React 19', 'Vite', 'React Router', 'TanStack Query', 'Vitest', 'Cypress'],
    structure: [
      'src/',
      '  components/',
      '  pages/',
      '  hooks/',
      '  services/',
      '  utils/',
      'tests/',
      '  unit/',
      '  integration/',
      'cypress/',
      '  e2e/',
      '  fixtures/'
    ],
    commands: {
      install: 'npm create vite@latest my-app -- --template react-ts',
      dev: 'npm run dev',
      test: 'npm run test',
      build: 'npm run build'
    },
    features: [
      'Lightning Fast HMR with Vite',
      'Type-Safe Routing',
      'Data Fetching with TanStack Query',
      'Mock Service Worker for Testing',
      'Component Testing with Vitest',
      'E2E Testing with Cypress'
    ],
    sampleCode: `// src/App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  )
}`
  },
  'fastapi': {
    name: 'FastAPI + SQLAlchemy',
    description: 'Production FastAPI service with async SQLAlchemy, testing, and Docker',
    techStack: ['FastAPI', 'SQLAlchemy', 'PostgreSQL', 'Pytest', 'Docker', 'Alembic'],
    structure: [
      'app/',
      '  api/',
      '    endpoints/',
      '    dependencies.py',
      '  core/',
      '    config.py',
      '    security.py',
      '  db/',
      '    models.py',
      '    session.py',
      '  schemas/',
      '  services/',
      'tests/',
      '  unit/',
      '  integration/',
      '  e2e/',
      'alembic/',
      'docker/'
    ],
    commands: {
      install: 'pip install fastapi sqlalchemy pytest',
      dev: 'uvicorn app.main:app --reload',
      test: 'pytest',
      migrate: 'alembic upgrade head'
    },
    features: [
      'Async/Await Support',
      'Automatic API Documentation',
      'Pydantic Data Validation',
      'JWT Authentication',
      'Database Migrations with Alembic',
      'Comprehensive Test Coverage'
    ],
    sampleCode: `# app/main.py
from fastapi import FastAPI, Depends
from sqlalchemy.orm import Session
from app.db import get_db
from app.api import users, posts

app = FastAPI(title="PA-QA API")

app.include_router(users.router, prefix="/users")
app.include_router(posts.router, prefix="/posts")

@app.get("/health")
async def health_check():
    return {"status": "healthy"}`
  },
  'wordpress-plugin': {
    name: 'WordPress Plugin Template',
    description: 'Modern WordPress plugin with PHPUnit testing and CI/CD',
    techStack: ['WordPress', 'PHP 8', 'PHPUnit', 'WP-CLI', 'GitHub Actions', 'Composer'],
    structure: [
      'plugin-name/',
      '  includes/',
      '    class-plugin.php',
      '  admin/',
      '    js/',
      '    css/',
      '  public/',
      '  tests/',
      '    unit/',
      '    integration/',
      '  languages/',
      'plugin-name.php',
      'composer.json',
      'phpunit.xml'
    ],
    commands: {
      install: 'composer install',
      test: 'vendor/bin/phpunit',
      lint: 'vendor/bin/phpcs',
      build: 'npm run build'
    },
    features: [
      'Object-Oriented Architecture',
      'WordPress Coding Standards',
      'Gutenberg Block Support',
      'REST API Integration',
      'Automated Testing with PHPUnit',
      'Internationalization Ready'
    ],
    sampleCode: `<?php
/**
 * Plugin Name: PA-QA Plugin
 * Description: A modern WordPress plugin template
 * Version: 1.0.0
 */

namespace PAQA\\Plugin;

class Main {
    public function __construct() {
        add_action('init', [$this, 'init']);
    }
    
    public function init() {
        // Plugin initialization
        $this->load_dependencies();
        $this->register_hooks();
    }
}`
  }
};

// Get demo from URL or default
function getTemplateDemo(slug: string) {
  // Map slugs to demo keys
  const slugMap: Record<string, string> = {
    'next-app-router': 'next-app-router',
    'react-spa-template': 'react-spa',
    'fastapi-sqlalchemy': 'fastapi',
    'wordpress-plugin': 'wordpress-plugin',
    // Add more mappings as needed
  };
  
  return templateDemos[slugMap[slug] || 'next-app-router'];
}

export default function TemplateDemoPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const demo = getTemplateDemo(slug);
  const [copiedCommand, setCopiedCommand] = useState<string | null>(null);

  const copyToClipboard = (text: string, command: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCommand(command);
    setTimeout(() => setCopiedCommand(null), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/templates"
                className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Templates
              </Link>
              <div className="h-4 w-px bg-gray-300 dark:bg-gray-700" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                Template Demo
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href={`https://github.com/pa-qa/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                <Github className="h-4 w-4" />
                View on GitHub
              </Link>
              <button className="inline-flex items-center gap-2 rounded-md bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">
                <Download className="h-4 w-4" />
                Use Template
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-8">
        {/* Template Overview */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
            {demo.name}
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300">
            {demo.description}
          </p>
        </div>

        {/* Tech Stack */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
            Tech Stack
          </h3>
          <div className="flex flex-wrap gap-2">
            {demo.techStack.map((tech: string) => (
              <span
                key={tech}
                className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400 text-sm font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Project Structure */}
          <div className="lg:col-span-1">
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <FolderTree className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Project Structure
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <pre className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {demo.structure.join('\n')}
                </pre>
              </div>
            </div>

            {/* Features */}
            <div className="mt-6 rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Key Features
                  </h3>
                </div>
              </div>
              <div className="p-4">
                <ul className="space-y-2">
                  {demo.features.map((feature: string) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* Right Column - Code & Commands */}
          <div className="lg:col-span-2 space-y-6">
            {/* Sample Code */}
            <div className="rounded-lg border border-gray-200 bg-gray-900 dark:border-gray-800">
              <div className="px-4 py-3 border-b border-gray-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-gray-400" />
                  <span className="text-sm text-gray-300">Sample Code</span>
                </div>
                <button
                  onClick={() => copyToClipboard(demo.sampleCode, 'code')}
                  className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
                >
                  <Copy className="h-3 w-3" />
                  {copiedCommand === 'code' ? 'Copied!' : 'Copy'}
                </button>
              </div>
              <div className="p-4 overflow-x-auto">
                <pre className="text-sm text-gray-100">
                  <code>{demo.sampleCode}</code>
                </pre>
              </div>
            </div>

            {/* Quick Start Commands */}
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Terminal className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Quick Start Commands
                  </h3>
                </div>
              </div>
              <div className="p-4 space-y-3">
                {Object.entries(demo.commands).map(([key, command]) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 capitalize mb-1">
                        {key.replace('_', ' ')}
                      </p>
                      <code className="text-sm text-gray-900 dark:text-gray-100 font-mono">
                        {command as string}
                      </code>
                    </div>
                    <button
                      onClick={() => copyToClipboard(command as string, key)}
                      className={clsx(
                        "p-2 rounded-md transition-colors",
                        copiedCommand === key
                          ? "bg-green-100 text-green-600 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400 dark:hover:bg-gray-600"
                      )}
                    >
                      {copiedCommand === key ? (
                        <CheckCircle className="h-4 w-4" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Preview Section */}
            <div className="rounded-lg border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-800">
                <div className="flex items-center gap-2">
                  <Play className="h-4 w-4 text-gray-500" />
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                    Live Preview
                  </h3>
                </div>
              </div>
              <div className="p-8 text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                  <Code2 className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Interactive Demo Coming Soon
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  We're working on an interactive demo for this template. In the meantime, you can:
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Link
                    href={`https://github.com/pa-qa/${slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    <Github className="h-4 w-4" />
                    View Source Code
                  </Link>
                  <span className="text-gray-300 dark:text-gray-700">|</span>
                  <Link
                    href="/getting-started"
                    className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400"
                  >
                    <BookOpen className="h-4 w-4" />
                    Read Documentation
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}