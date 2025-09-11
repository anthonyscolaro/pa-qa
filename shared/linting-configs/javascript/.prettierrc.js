/**
 * Prettier Configuration for PA-QA Framework
 * 
 * This configuration ensures consistent code formatting across all JavaScript/TypeScript
 * projects while being optimized for performance and compatibility with ESLint.
 */

export default {
  // Basic formatting
  printWidth: 100,
  tabWidth: 2,
  useTabs: false,
  semi: true,
  singleQuote: true,
  quoteProps: 'as-needed',
  
  // JavaScript/TypeScript specific
  jsxSingleQuote: true,
  trailingComma: 'all',
  bracketSpacing: true,
  bracketSameLine: false,
  arrowParens: 'avoid',
  
  // Vue specific
  vueIndentScriptAndStyle: false,
  
  // HTML/XML formatting
  htmlWhitespaceSensitivity: 'css',
  
  // Line endings (consistent across platforms)
  endOfLine: 'lf',
  
  // Embedded language formatting
  embeddedLanguageFormatting: 'auto',
  
  // Performance optimizations
  rangeStart: 0,
  rangeEnd: Infinity,
  
  // File-specific overrides
  overrides: [
    {
      files: '*.json',
      options: {
        printWidth: 120,
        tabWidth: 2,
      },
    },
    {
      files: '*.md',
      options: {
        printWidth: 80,
        proseWrap: 'always',
        tabWidth: 2,
      },
    },
    {
      files: '*.yml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.yaml',
      options: {
        tabWidth: 2,
        singleQuote: false,
      },
    },
    {
      files: '*.css',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.scss',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.less',
      options: {
        printWidth: 120,
      },
    },
    {
      files: '*.vue',
      options: {
        printWidth: 100,
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      files: '*.svg',
      options: {
        parser: 'html',
        htmlWhitespaceSensitivity: 'ignore',
      },
    },
    {
      files: ['*.test.js', '*.test.ts', '*.test.jsx', '*.test.tsx'],
      options: {
        printWidth: 120, // Allow longer lines in tests for readability
      },
    },
    {
      files: ['*.spec.js', '*.spec.ts', '*.spec.jsx', '*.spec.tsx'],
      options: {
        printWidth: 120, // Allow longer lines in specs for readability
      },
    },
    {
      files: ['*.config.js', '*.config.ts'],
      options: {
        printWidth: 120, // Allow longer lines in config files
        trailingComma: 'es5', // Be more conservative in config files
      },
    },
    {
      files: 'package.json',
      options: {
        tabWidth: 2,
        printWidth: 80,
      },
    },
  ],
  
  // Plugin-specific options
  plugins: [
    // Prettier plugins for additional language support
    '@prettier/plugin-xml',
    'prettier-plugin-organize-imports',
    'prettier-plugin-packagejson',
  ],
};