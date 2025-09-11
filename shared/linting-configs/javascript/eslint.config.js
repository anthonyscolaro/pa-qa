import js from '@eslint/js';
import globals from 'globals';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import reactPlugin from 'eslint-plugin-react';
import reactHooksPlugin from 'eslint-plugin-react-hooks';
import reactRefreshPlugin from 'eslint-plugin-react-refresh';
import vuePlugin from 'eslint-plugin-vue';
import vueParser from 'vue-eslint-parser';
import jestPlugin from 'eslint-plugin-jest';
import testingLibraryPlugin from 'eslint-plugin-testing-library';
import vitestPlugin from 'eslint-plugin-vitest';
import jsxA11yPlugin from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import unicornPlugin from 'eslint-plugin-unicorn';
import securityPlugin from 'eslint-plugin-security';
import sonarjsPlugin from 'eslint-plugin-sonarjs';
import promisePlugin from 'eslint-plugin-promise';
import nodePlugin from 'eslint-plugin-n';
import prettierConfig from 'eslint-config-prettier';

// Base configuration for all JavaScript files
const baseConfig = {
  languageOptions: {
    ecmaVersion: 2024,
    sourceType: 'module',
    globals: {
      ...globals.browser,
      ...globals.node,
      ...globals.es2024,
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
        impliedStrict: true,
      },
    },
  },
  plugins: {
    import: importPlugin,
    unicorn: unicornPlugin,
    security: securityPlugin,
    sonarjs: sonarjsPlugin,
    promise: promisePlugin,
    node: nodePlugin,
  },
  rules: {
    // ESLint recommended + Airbnb-style rules
    ...js.configs.recommended.rules,
    
    // Import rules
    'import/order': [
      'error',
      {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
          'object',
          'type',
        ],
        'newlines-between': 'always',
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
      },
    ],
    'import/no-unresolved': 'error',
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          '**/*.test.{js,jsx,ts,tsx}',
          '**/*.spec.{js,jsx,ts,tsx}',
          '**/test/**/*',
          '**/tests/**/*',
          '**/__tests__/**/*',
          '**/cypress/**/*',
          '**/playwright/**/*',
          '**/*.config.{js,ts}',
          '**/vite.config.{js,ts}',
          '**/vitest.config.{js,ts}',
          '**/jest.config.{js,ts}',
          '**/webpack.config.{js,ts}',
        ],
      },
    ],
    'import/prefer-default-export': 'off',
    'import/no-default-export': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        js: 'never',
        jsx: 'never',
        ts: 'never',
        tsx: 'never',
        vue: 'never',
      },
    ],

    // General JavaScript rules (Airbnb-inspired)
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-alert': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
    'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    'prefer-const': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'prefer-arrow-callback': 'error',
    'prefer-template': 'error',
    'prefer-destructuring': ['error', { object: true, array: false }],
    'no-nested-ternary': 'error',
    'no-unneeded-ternary': 'error',
    'spaced-comment': ['error', 'always'],
    'eqeqeq': ['error', 'always'],
    'curly': ['error', 'all'],
    'brace-style': ['error', '1tbs'],
    'comma-dangle': ['error', 'always-multiline'],
    'semi': ['error', 'always'],
    'quotes': ['error', 'single', { allowTemplateLiterals: true }],

    // Unicorn rules for modern JS
    'unicorn/better-regex': 'error',
    'unicorn/catch-error-name': 'error',
    'unicorn/consistent-destructuring': 'error',
    'unicorn/consistent-function-scoping': 'error',
    'unicorn/explicit-length-check': 'error',
    'unicorn/filename-case': ['error', { case: 'kebabCase' }],
    'unicorn/new-for-builtins': 'error',
    'unicorn/no-array-instanceof': 'error',
    'unicorn/no-for-loop': 'error',
    'unicorn/no-lonely-if': 'error',
    'unicorn/no-useless-undefined': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-number-properties': 'error',
    'unicorn/prefer-optional-catch-binding': 'error',
    'unicorn/prefer-string-starts-ends-with': 'error',
    'unicorn/prefer-ternary': 'error',
    'unicorn/throw-new-error': 'error',

    // Security rules
    'security/detect-object-injection': 'error',
    'security/detect-non-literal-regexp': 'error',
    'security/detect-unsafe-regex': 'error',
    'security/detect-buffer-noassert': 'error',
    'security/detect-child-process': 'error',
    'security/detect-disable-mustache-escape': 'error',
    'security/detect-eval-with-expression': 'error',
    'security/detect-no-csrf-before-method-override': 'error',
    'security/detect-pseudoRandomBytes': 'error',

    // SonarJS rules for code quality
    'sonarjs/cognitive-complexity': ['error', 15],
    'sonarjs/max-switch-cases': ['error', 30],
    'sonarjs/no-all-duplicated-branches': 'error',
    'sonarjs/no-collapsible-if': 'error',
    'sonarjs/no-collection-size-mischeck': 'error',
    'sonarjs/no-duplicate-string': ['error', 3],
    'sonarjs/no-duplicated-branches': 'error',
    'sonarjs/no-identical-conditions': 'error',
    'sonarjs/no-identical-expressions': 'error',
    'sonarjs/no-redundant-boolean': 'error',
    'sonarjs/no-unused-collection': 'error',
    'sonarjs/prefer-immediate-return': 'error',
    'sonarjs/prefer-single-boolean-return': 'error',

    // Promise rules
    'promise/always-return': 'error',
    'promise/catch-or-return': 'error',
    'promise/no-return-wrap': 'error',
    'promise/param-names': 'error',
    'promise/no-nesting': 'error',
    'promise/no-promise-in-callback': 'error',
    'promise/no-callback-in-promise': 'error',
    'promise/avoid-new': 'warn',
    'promise/prefer-await-to-then': 'error',
    'promise/prefer-await-to-callbacks': 'error',
  },
  settings: {
    'import/resolver': {
      typescript: {
        alwaysTryTypes: true,
        project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      },
      node: {
        extensions: ['.js', '.jsx', '.ts', '.tsx', '.vue'],
      },
    },
  },
};

// TypeScript configuration
const typescriptConfig = {
  files: ['**/*.ts', '**/*.tsx'],
  languageOptions: {
    parser: tsParser,
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      project: ['./tsconfig.json', './packages/*/tsconfig.json'],
      tsconfigRootDir: process.cwd(),
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    '@typescript-eslint': tsPlugin,
  },
  rules: {
    // Disable base ESLint rules that are handled by TypeScript
    'no-unused-vars': 'off',
    'no-use-before-define': 'off',
    'no-shadow': 'off',
    'no-undef': 'off', // TypeScript handles this

    // TypeScript-specific rules
    '@typescript-eslint/no-unused-vars': [
      'error',
      { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
    ],
    '@typescript-eslint/no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
    '@typescript-eslint/no-shadow': 'error',
    '@typescript-eslint/explicit-function-return-type': 'off',
    '@typescript-eslint/explicit-module-boundary-types': 'off',
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-inferrable-types': 'error',
    '@typescript-eslint/no-non-null-assertion': 'warn',
    '@typescript-eslint/prefer-nullish-coalescing': 'error',
    '@typescript-eslint/prefer-optional-chain': 'error',
    '@typescript-eslint/prefer-as-const': 'error',
    '@typescript-eslint/no-unnecessary-type-assertion': 'error',
    '@typescript-eslint/no-unnecessary-condition': 'error',
    '@typescript-eslint/strict-boolean-expressions': 'off',
    '@typescript-eslint/prefer-includes': 'error',
    '@typescript-eslint/prefer-string-starts-ends-with': 'error',
    '@typescript-eslint/switch-exhaustiveness-check': 'error',
    '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
    '@typescript-eslint/consistent-type-imports': [
      'error',
      { prefer: 'type-imports', disallowTypeAnnotations: false },
    ],
    '@typescript-eslint/consistent-type-exports': 'error',
    '@typescript-eslint/array-type': ['error', { default: 'array-simple' }],
    '@typescript-eslint/ban-tslint-comment': 'error',
    '@typescript-eslint/class-literal-property-style': ['error', 'fields'],
    '@typescript-eslint/consistent-generic-constructors': ['error', 'constructor'],
    '@typescript-eslint/consistent-indexed-object-style': ['error', 'record'],
    '@typescript-eslint/method-signature-style': ['error', 'property'],
    '@typescript-eslint/no-confusing-void-expression': 'error',
    '@typescript-eslint/no-dynamic-delete': 'error',
    '@typescript-eslint/no-invalid-void-type': 'error',
    '@typescript-eslint/no-meaningless-void-operator': 'error',
    '@typescript-eslint/no-non-null-asserted-nullish-coalescing': 'error',
    '@typescript-eslint/no-redundant-type-constituents': 'error',
    '@typescript-eslint/no-useless-empty-export': 'error',
    '@typescript-eslint/prefer-function-type': 'error',
    '@typescript-eslint/prefer-literal-enum-member': 'error',
    '@typescript-eslint/prefer-return-this-type': 'error',
    '@typescript-eslint/promise-function-async': 'error',
    '@typescript-eslint/require-array-sort-compare': 'error',
    '@typescript-eslint/sort-type-constituents': 'error',
    '@typescript-eslint/unified-signatures': 'error',

    // Import rules for TypeScript
    'import/no-unresolved': 'off', // TypeScript handles this
    'import/named': 'off', // TypeScript handles this
    'import/default': 'off', // TypeScript handles this
    'import/namespace': 'off', // TypeScript handles this
  },
};

// React configuration
const reactConfig = {
  files: ['**/*.jsx', '**/*.tsx'],
  languageOptions: {
    globals: {
      ...globals.browser,
    },
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
  },
  plugins: {
    react: reactPlugin,
    'react-hooks': reactHooksPlugin,
    'react-refresh': reactRefreshPlugin,
    'jsx-a11y': jsxA11yPlugin,
  },
  rules: {
    // React rules
    ...reactPlugin.configs.recommended.rules,
    'react/react-in-jsx-scope': 'off', // Not needed in React 17+
    'react/prop-types': 'off', // Use TypeScript instead
    'react/jsx-props-no-spreading': 'off',
    'react/jsx-filename-extension': ['error', { extensions: ['.jsx', '.tsx'] }],
    'react/function-component-definition': [
      'error',
      {
        namedComponents: 'arrow-function',
        unnamedComponents: 'arrow-function',
      },
    ],
    'react/jsx-no-useless-fragment': 'error',
    'react/jsx-boolean-value': ['error', 'never'],
    'react/jsx-curly-brace-presence': ['error', { props: 'never', children: 'never' }],
    'react/jsx-fragments': ['error', 'syntax'],
    'react/jsx-sort-props': [
      'error',
      {
        callbacksLast: true,
        shorthandFirst: true,
        ignoreCase: true,
        reservedFirst: true,
      },
    ],
    'react/self-closing-comp': 'error',
    'react/jsx-wrap-multilines': [
      'error',
      {
        declaration: 'parens-new-line',
        assignment: 'parens-new-line',
        return: 'parens-new-line',
        arrow: 'parens-new-line',
        condition: 'parens-new-line',
        logical: 'parens-new-line',
      },
    ],

    // React Hooks rules
    ...reactHooksPlugin.configs.recommended.rules,

    // React Refresh rules (for Vite)
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

    // Accessibility rules
    ...jsxA11yPlugin.configs.recommended.rules,
    'jsx-a11y/anchor-is-valid': [
      'error',
      {
        components: ['Link'],
        specialLink: ['hrefLeft', 'hrefRight'],
        aspects: ['invalidHref', 'preferButton'],
      },
    ],
    'jsx-a11y/label-has-associated-control': [
      'error',
      {
        required: {
          some: ['nesting', 'id'],
        },
      },
    ],
  },
  settings: {
    react: {
      version: 'detect',
    },
  },
};

// Vue configuration
const vueConfig = {
  files: ['**/*.vue'],
  languageOptions: {
    parser: vueParser,
    parserOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parser: '@typescript-eslint/parser',
    },
    globals: {
      ...globals.browser,
    },
  },
  plugins: {
    vue: vuePlugin,
  },
  rules: {
    ...vuePlugin.configs['vue3-recommended'].rules,
    'vue/multi-word-component-names': 'off',
    'vue/component-definition-name-casing': ['error', 'PascalCase'],
    'vue/component-name-in-template-casing': ['error', 'PascalCase'],
    'vue/custom-event-name-casing': ['error', 'camelCase'],
    'vue/define-macros-order': [
      'error',
      {
        order: ['defineProps', 'defineEmits'],
      },
    ],
    'vue/html-self-closing': [
      'error',
      {
        html: {
          void: 'always',
          normal: 'always',
          component: 'always',
        },
        svg: 'always',
        math: 'always',
      },
    ],
    'vue/max-attributes-per-line': [
      'error',
      {
        singleline: 3,
        multiline: 1,
      },
    ],
    'vue/no-v-html': 'error',
    'vue/require-default-prop': 'error',
    'vue/require-prop-types': 'error',
    'vue/singleline-html-element-content-newline': 'off',
    'vue/v-slot-style': ['error', 'shorthand'],
    'vue/prefer-separate-static-class': 'error',
    'vue/prefer-true-attribute-shorthand': 'error',
    'vue/component-tags-order': [
      'error',
      {
        order: ['script', 'template', 'style'],
      },
    ],
    'vue/block-tag-newline': 'error',
    'vue/component-api-style': ['error', ['script-setup', 'composition']],
    'vue/component-options-name-casing': ['error', 'PascalCase'],
    'vue/define-emits-declaration': ['error', 'type-based'],
    'vue/define-props-declaration': ['error', 'type-based'],
    'vue/enforce-style-attribute': ['error', { allow: ['module'] }],
    'vue/html-button-has-type': 'error',
    'vue/next-tick-style': ['error', 'promise'],
    'vue/no-boolean-default': 'error',
    'vue/no-empty-component-block': 'error',
    'vue/no-multiple-objects-in-class': 'error',
    'vue/no-potential-component-option-typo': 'error',
    'vue/no-required-prop-with-default': 'error',
    'vue/no-static-inline-styles': 'error',
    'vue/no-template-target-blank': 'error',
    'vue/no-this-in-before-route-enter': 'error',
    'vue/no-undef-components': 'error',
    'vue/no-undef-properties': 'error',
    'vue/no-unused-properties': 'error',
    'vue/no-unused-refs': 'error',
    'vue/no-useless-mustaches': 'error',
    'vue/no-useless-v-bind': 'error',
    'vue/padding-line-between-blocks': 'error',
    'vue/prefer-enum-validator': 'error',
    'vue/require-emit-validator': 'error',
    'vue/require-expose': 'error',
    'vue/require-macro-variable-name': 'error',
    'vue/require-name-property': 'error',
    'vue/v-for-delimiter-style': ['error', 'in'],
    'vue/valid-define-options': 'error',
  },
};

// Test files configuration
const testConfig = {
  files: [
    '**/*.test.{js,jsx,ts,tsx}',
    '**/*.spec.{js,jsx,ts,tsx}',
    '**/test/**/*',
    '**/tests/**/*',
    '**/__tests__/**/*',
  ],
  languageOptions: {
    globals: {
      ...globals.jest,
      ...globals.browser,
    },
  },
  plugins: {
    jest: jestPlugin,
    'testing-library': testingLibraryPlugin,
    vitest: vitestPlugin,
  },
  rules: {
    // Jest rules
    ...jestPlugin.configs.recommended.rules,
    'jest/expect-expect': 'error',
    'jest/no-disabled-tests': 'warn',
    'jest/no-focused-tests': 'error',
    'jest/no-identical-title': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/valid-expect': 'error',
    'jest/consistent-test-it': ['error', { fn: 'test' }],
    'jest/prefer-strict-equal': 'error',
    'jest/prefer-to-be': 'error',
    'jest/prefer-to-contain': 'error',
    'jest/prefer-to-have-length': 'error',
    'jest/require-top-level-describe': 'error',

    // Testing Library rules
    'testing-library/await-async-query': 'error',
    'testing-library/no-await-sync-query': 'error',
    'testing-library/no-debugging-utils': 'warn',
    'testing-library/no-dom-import': 'error',
    'testing-library/prefer-find-by': 'error',
    'testing-library/prefer-presence-queries': 'error',
    'testing-library/prefer-screen-queries': 'error',
    'testing-library/prefer-wait-for': 'error',

    // Vitest rules
    'vitest/consistent-test-it': ['error', { fn: 'test' }],
    'vitest/expect-expect': 'error',
    'vitest/no-disabled-tests': 'warn',
    'vitest/no-focused-tests': 'error',
    'vitest/no-identical-title': 'error',
    'vitest/prefer-to-have-length': 'error',
    'vitest/valid-expect': 'error',

    // Allow console in tests
    'no-console': 'off',
    
    // Allow any in test files for mocking
    '@typescript-eslint/no-explicit-any': 'off',
    
    // Allow non-null assertions in tests
    '@typescript-eslint/no-non-null-assertion': 'off',
  },
};

// Configuration files
const configFilesConfig = {
  files: [
    '**/*.config.{js,ts}',
    '**/vite.config.{js,ts}',
    '**/vitest.config.{js,ts}',
    '**/jest.config.{js,ts}',
    '**/webpack.config.{js,ts}',
    '**/rollup.config.{js,ts}',
    '**/playwright.config.{js,ts}',
    '**/cypress.config.{js,ts}',
    '**/tailwind.config.{js,ts}',
    '**/next.config.{js,ts}',
    '**/nuxt.config.{js,ts}',
    '**/.eslintrc.{js,ts}',
    '**/eslint.config.{js,ts}',
  ],
  rules: {
    'import/no-extraneous-dependencies': 'off',
    'no-console': 'off',
    '@typescript-eslint/no-var-requires': 'off',
    'unicorn/prefer-module': 'off',
  },
};

// Node.js specific files
const nodeConfig = {
  files: [
    '**/server/**/*',
    '**/api/**/*',
    '**/backend/**/*',
    '**/*.server.{js,ts}',
    '**/scripts/**/*',
    '**/cli/**/*',
  ],
  languageOptions: {
    globals: {
      ...globals.node,
    },
  },
  rules: {
    'no-console': 'off', // Console is OK in Node.js
    'import/no-extraneous-dependencies': 'off',
    'unicorn/prefer-top-level-await': 'off',
  },
};

export default [
  // Ignore patterns
  {
    ignores: [
      'node_modules/**',
      'dist/**',
      'build/**',
      '.next/**',
      '.nuxt/**',
      'coverage/**',
      '.nyc_output/**',
      'public/**',
      'static/**',
      '*.min.js',
      '*.bundle.js',
      '.cache/**',
      '.temp/**',
      '.tmp/**',
      '*.d.ts',
      'generated/**',
      '.storybook/public/**',
      'storybook-static/**',
      '.docusaurus/**',
      'docs/.vitepress/dist/**',
    ],
  },

  // Base configuration for all files
  baseConfig,

  // TypeScript files
  typescriptConfig,

  // React files
  reactConfig,

  // Vue files
  vueConfig,

  // Test files
  testConfig,

  // Configuration files
  configFilesConfig,

  // Node.js files
  nodeConfig,

  // Prettier integration (must be last)
  prettierConfig,
];