/**
 * Lint-staged Configuration for PA-QA Framework
 * 
 * This configuration defines what tools to run on staged files before commit.
 * It's optimized for performance and ensures consistent code quality.
 */

export default {
  // JavaScript and TypeScript files
  '*.{js,jsx,ts,tsx}': [
    // ESLint with auto-fix
    'eslint --fix --cache --cache-location node_modules/.cache/eslint/',
    // Prettier formatting
    'prettier --write',
    // Type checking for TypeScript files (if tsconfig.json exists)
    () => {
      const fs = require('fs');
      if (fs.existsSync('tsconfig.json')) {
        return 'tsc --noEmit --skipLibCheck';
      }
      return [];
    },
  ],

  // Vue files
  '*.vue': [
    'eslint --fix --cache --cache-location node_modules/.cache/eslint/',
    'prettier --write',
  ],

  // CSS, SCSS, Less files
  '*.{css,scss,sass,less}': [
    'prettier --write',
    // Add stylelint if configured
    () => {
      const fs = require('fs');
      if (fs.existsSync('.stylelintrc.json') || fs.existsSync('.stylelintrc.js') || fs.existsSync('stylelint.config.js')) {
        return 'stylelint --fix --cache --cache-location node_modules/.cache/stylelint/';
      }
      return [];
    },
  ],

  // JSON files
  '*.json': [
    'prettier --write',
    // Validate JSON syntax
    'node -e "const fs = require(\'fs\'); const path = process.argv[1]; try { JSON.parse(fs.readFileSync(path, \'utf8\')); console.log(\'✅ Valid JSON:\', path); } catch (e) { console.error(\'❌ Invalid JSON:\', path, e.message); process.exit(1); }"',
  ],

  // Package.json specific (with sorting)
  'package.json': [
    'prettier --write',
    // Sort package.json using a custom script or plugin
    () => {
      try {
        require('prettier-plugin-packagejson');
        return 'prettier --write --plugin=prettier-plugin-packagejson';
      } catch {
        return 'prettier --write';
      }
    },
  ],

  // YAML files
  '*.{yml,yaml}': [
    'prettier --write',
    // Basic YAML validation
    'node -e "const yaml = require(\'js-yaml\'); const fs = require(\'fs\'); const path = process.argv[1]; try { yaml.load(fs.readFileSync(path, \'utf8\')); console.log(\'✅ Valid YAML:\', path); } catch (e) { console.error(\'❌ Invalid YAML:\', path, e.message); process.exit(1); }"',
  ],

  // Markdown files
  '*.{md,mdx}': [
    'prettier --write',
    // Optional: markdownlint if configured
    () => {
      const fs = require('fs');
      if (fs.existsSync('.markdownlint.json') || fs.existsSync('.markdownlint.yaml')) {
        return 'markdownlint --fix';
      }
      return [];
    },
  ],

  // HTML files
  '*.html': [
    'prettier --write',
  ],

  // XML and SVG files
  '*.{xml,svg}': [
    'prettier --write --plugin=@prettier/plugin-xml',
  ],

  // Shell scripts
  '*.{sh,bash}': [
    // Check shell script syntax
    'bash -n',
    // Format shell scripts if shfmt is available
    () => {
      const { execSync } = require('child_process');
      try {
        execSync('which shfmt', { stdio: 'ignore' });
        return 'shfmt -w -i 2 -ci';
      } catch {
        return [];
      }
    },
  ],

  // Docker files
  '{Dockerfile,Dockerfile.*}': [
    // Dockerfile linting if hadolint is available
    () => {
      const { execSync } = require('child_process');
      try {
        execSync('which hadolint', { stdio: 'ignore' });
        return 'hadolint';
      } catch {
        return [];
      }
    },
  ],

  // Test files (additional checks)
  '*.{test,spec}.{js,jsx,ts,tsx}': [
    'eslint --fix --cache --cache-location node_modules/.cache/eslint/',
    'prettier --write',
    // Run specific test file if jest/vitest is configured
    () => {
      const fs = require('fs');
      const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.test) {
        // Check if it's a Jest or Vitest project
        if (packageJson.dependencies?.jest || packageJson.devDependencies?.jest) {
          return 'jest --findRelatedTests --passWithNoTests';
        }
        if (packageJson.dependencies?.vitest || packageJson.devDependencies?.vitest) {
          return 'vitest run --reporter=verbose';
        }
      }
      return [];
    },
  ],

  // Configuration files
  '*.config.{js,ts}': [
    'eslint --fix --cache --cache-location node_modules/.cache/eslint/',
    'prettier --write',
  ],

  // Environment files
  '.env*': [
    // Basic validation for .env files
    'node -e "const fs = require(\'fs\'); const path = process.argv[1]; const content = fs.readFileSync(path, \'utf8\'); const lines = content.split(\'\\n\').filter(line => line.trim() && !line.startsWith(\'#\')); const invalidLines = lines.filter(line => !/^[A-Z_][A-Z0-9_]*=/.test(line)); if (invalidLines.length > 0) { console.error(\'❌ Invalid .env format:\', invalidLines); process.exit(1); } console.log(\'✅ Valid .env file:\', path);"',
  ],

  // Lock files (just validate, don't modify)
  '{package-lock.json,yarn.lock,pnpm-lock.yaml}': [
    // Validate lock file integrity
    () => {
      const fs = require('fs');
      if (fs.existsSync('package-lock.json')) {
        return 'npm audit --audit-level=high';
      }
      if (fs.existsSync('yarn.lock')) {
        return 'yarn check --integrity';
      }
      if (fs.existsSync('pnpm-lock.yaml')) {
        return 'pnpm audit --audit-level=high';
      }
      return [];
    },
  ],

  // All files: Check for common issues
  '*': [
    // Remove trailing whitespace and ensure final newline
    'node -e "const fs = require(\'fs\'); const path = process.argv[1]; let content = fs.readFileSync(path, \'utf8\'); const original = content; content = content.replace(/[ \\t]+$/gm, \'\'); if (!content.endsWith(\'\\n\') && content.length > 0) { content += \'\\n\'; } if (content !== original) { fs.writeFileSync(path, content); console.log(\'✅ Fixed whitespace:\', path); }"',
    
    // Check for secrets (basic patterns)
    'node -e "const fs = require(\'fs\'); const path = process.argv[1]; const content = fs.readFileSync(path, \'utf8\'); const secretPatterns = [/[Aa]pi[_-]?[Kk]ey[\\s]*[:=][\\s]*[\'\\\"\\`]?[A-Za-z0-9]{20,}/, /[Aa]ccess[_-]?[Tt]oken[\\s]*[:=][\\s]*[\'\\\"\\`]?[A-Za-z0-9]{20,}/, /[Ss]ecret[_-]?[Kk]ey[\\s]*[:=][\\s]*[\'\\\"\\`]?[A-Za-z0-9]{20,}/, /password[\\s]*[:=][\\s]*[\'\\\"\\`]?[^\\s\\\'\\\"\\`]{8,}/i]; const found = secretPatterns.some(pattern => pattern.test(content)); if (found) { console.error(\'❌ Potential secret detected in:\', path); console.error(\'Please review and remove any hardcoded secrets.\'); process.exit(1); } console.log(\'✅ No secrets detected:\', path);"',
  ],
};