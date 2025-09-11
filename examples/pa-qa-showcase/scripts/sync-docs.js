#!/usr/bin/env node

/**
 * Documentation Sync Script
 * 
 * This script synchronizes the MDX documentation with the actual PA-QA framework
 * code, ensuring examples and references stay up-to-date.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const CONFIG = {
  contentDir: path.join(__dirname, '..', 'content'),
  frameworkRoot: path.join(__dirname, '..', '..', '..'),
  projectTypesDir: path.join(__dirname, '..', '..', '..', 'project-types'),
  sharedDir: path.join(__dirname, '..', '..', '..', 'shared'),
  docsDir: path.join(__dirname, '..', '..', '..', 'docs'),
  verbose: process.argv.includes('--verbose') || process.argv.includes('-v'),
  dryRun: process.argv.includes('--dry-run') || process.argv.includes('-n'),
  force: process.argv.includes('--force') || process.argv.includes('-f')
};

// Utility functions
function log(message, level = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = {
    info: '📝',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    debug: '🔍'
  }[level] || 'ℹ️';
  
  if (level === 'debug' && !CONFIG.verbose) return;
  
  console.log(`${prefix} [${timestamp}] ${message}`);
}

function writeFile(filePath, content) {
  if (CONFIG.dryRun) {
    log(`[DRY RUN] Would write to ${filePath}`, 'debug');
    return;
  }
  
  fs.writeFileSync(filePath, content, 'utf8');
  log(`Updated ${path.relative(CONFIG.contentDir, filePath)}`, 'success');
}

// Framework scanning functions
function scanProjectTypes() {
  const templates = [];
  
  if (!fs.existsSync(CONFIG.projectTypesDir)) {
    log('Project types directory not found', 'warning');
    return templates;
  }
  
  try {
    const categories = fs.readdirSync(CONFIG.projectTypesDir);
    categories.forEach(category => {
      const categoryPath = path.join(CONFIG.projectTypesDir, category);
      if (fs.statSync(categoryPath).isDirectory()) {
        const frameworks = fs.readdirSync(categoryPath);
        frameworks.forEach(framework => {
          const frameworkPath = path.join(categoryPath, framework);
          if (fs.statSync(frameworkPath).isDirectory()) {
            
            // Scan for additional metadata
            const packageJsonPath = path.join(frameworkPath, 'package.json');
            const requirementsPath = path.join(frameworkPath, 'requirements.txt');
            const composerPath = path.join(frameworkPath, 'composer.json');
            
            let version = 'latest';
            let description = `${framework} project template for ${category}`;
            
            // Extract version and description from package files
            if (fs.existsSync(packageJsonPath)) {
              try {
                const pkg = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
                version = pkg.version || version;
                description = pkg.description || description;
              } catch (e) {
                log(`Failed to parse ${packageJsonPath}: ${e.message}`, 'debug');
              }
            }
            
            templates.push({
              category,
              framework,
              version,
              description,
              path: `project-types/${category}/${framework}`,
              hasTests: fs.existsSync(path.join(frameworkPath, 'tests')),
              hasConfigs: fs.existsSync(path.join(frameworkPath, 'configs')),
              hasDockerfiles: fs.existsSync(path.join(frameworkPath, 'docker')),
              hasCi: fs.existsSync(path.join(frameworkPath, '.github')),
              packageManager: fs.existsSync(packageJsonPath) ? 'npm' : 
                             fs.existsSync(requirementsPath) ? 'pip' :
                             fs.existsSync(composerPath) ? 'composer' : 'unknown'
            });
          }
        });
      }
    });
  } catch (error) {
    log(`Error scanning project types: ${error.message}`, 'error');
  }
  
  log(`Found ${templates.length} project templates`, 'debug');
  return templates;
}

function scanUtilities() {
  const utilities = [];
  const utilitiesDir = path.join(CONFIG.sharedDir, 'testing-utilities');
  
  if (!fs.existsSync(utilitiesDir)) {
    log('Testing utilities directory not found', 'warning');
    return utilities;
  }
  
  try {
    const helpersDir = path.join(utilitiesDir, 'helpers');
    if (fs.existsSync(helpersDir)) {
      const categories = fs.readdirSync(helpersDir);
      categories.forEach(category => {
        const categoryPath = path.join(helpersDir, category);
        if (fs.statSync(categoryPath).isDirectory()) {
          const files = fs.readdirSync(categoryPath);
          const codeFiles = files.filter(f => 
            f.endsWith('.ts') || f.endsWith('.tsx') || 
            f.endsWith('.js') || f.endsWith('.jsx') ||
            f.endsWith('.py') || f.endsWith('.php')
          );
          
          utilities.push({
            category,
            files: codeFiles,
            path: `shared/testing-utilities/helpers/${category}`,
            languages: [...new Set(codeFiles.map(f => {
              if (f.endsWith('.ts') || f.endsWith('.tsx')) return 'typescript';
              if (f.endsWith('.js') || f.endsWith('.jsx')) return 'javascript';
              if (f.endsWith('.py')) return 'python';
              if (f.endsWith('.php')) return 'php';
              return 'unknown';
            }))]
          });
        }
      });
    }
  } catch (error) {
    log(`Error scanning utilities: ${error.message}`, 'error');
  }
  
  log(`Found ${utilities.length} utility categories`, 'debug');
  return utilities;
}

function scanCiCdTemplates() {
  const templates = [];
  const cicdDir = path.join(CONFIG.sharedDir, 'ci-cd-templates');
  
  if (!fs.existsSync(cicdDir)) {
    log('CI/CD templates directory not found', 'warning');
    return templates;
  }
  
  try {
    const platforms = fs.readdirSync(cicdDir);
    platforms.forEach(platform => {
      const platformPath = path.join(cicdDir, platform);
      if (fs.statSync(platformPath).isDirectory()) {
        const files = fs.readdirSync(platformPath);
        const workflowFiles = files.filter(f => 
          f.endsWith('.yml') || f.endsWith('.yaml') || 
          f.endsWith('.json') || f === 'Jenkinsfile'
        );
        
        templates.push({
          platform,
          files: workflowFiles,
          path: `shared/ci-cd-templates/${platform}`,
          count: workflowFiles.length
        });
      }
    });
  } catch (error) {
    log(`Error scanning CI/CD templates: ${error.message}`, 'error');
  }
  
  log(`Found ${templates.length} CI/CD platforms`, 'debug');
  return templates;
}

// Documentation update functions
function updateGettingStarted(templates) {
  const filePath = path.join(CONFIG.contentDir, 'getting-started.mdx');
  
  if (!fs.existsSync(filePath)) {
    log('getting-started.mdx not found', 'warning');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Generate template selector options
  const templateOptions = templates.map(t => ({
    label: `${t.framework.charAt(0).toUpperCase() + t.framework.slice(1)} (${t.category})`,
    value: `${t.category}-${t.framework}`,
    description: t.description
  }));
  
  // Update InteractiveSelector options
  const selectorRegex = /(options=\{)\[[\s\S]*?\](\})/;
  if (selectorRegex.test(content)) {
    const newOptions = JSON.stringify(templateOptions, null, 8).replace(/"/g, '"');
    content = content.replace(selectorRegex, `$1${newOptions}$2`);
    
    // Add update timestamp
    const timestamp = new Date().toISOString();
    const updateComment = `<!-- Auto-updated: ${timestamp} -->`;
    
    if (!content.includes('<!-- Auto-updated:')) {
      content = updateComment + '\n' + content;
    } else {
      content = content.replace(/<!-- Auto-updated:.*? -->/, updateComment);
    }
    
    writeFile(filePath, content);
  } else {
    log('Could not find InteractiveSelector options in getting-started.mdx', 'warning');
  }
}

function updateUtilities(utilities) {
  const filePath = path.join(CONFIG.contentDir, 'utilities.mdx');
  
  if (!fs.existsSync(filePath)) {
    log('utilities.mdx not found', 'warning');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add timestamp comment to track updates
  const timestamp = new Date().toISOString();
  const updateComment = `<!-- Auto-updated: ${timestamp} - Found ${utilities.length} utility categories -->`;
  
  if (!content.includes('<!-- Auto-updated:')) {
    content = updateComment + '\n' + content;
  } else {
    content = content.replace(/<!-- Auto-updated:.*? -->/, updateComment);
  }
  
  writeFile(filePath, content);
}

function updateCiCd(cicdTemplates) {
  const filePath = path.join(CONFIG.contentDir, 'ci-cd.mdx');
  
  if (!fs.existsExists(filePath)) {
    log('ci-cd.mdx not found', 'warning');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add timestamp comment
  const timestamp = new Date().toISOString();
  const updateComment = `<!-- Auto-updated: ${timestamp} - Found ${cicdTemplates.length} CI/CD platforms -->`;
  
  if (!content.includes('<!-- Auto-updated:')) {
    content = updateComment + '\n' + content;
  } else {
    content = content.replace(/<!-- Auto-updated:.*? -->/, updateComment);
  }
  
  writeFile(filePath, content);
}

function updateTestingPatterns(templates) {
  const filePath = path.join(CONFIG.contentDir, 'testing-patterns.mdx');
  
  if (!fs.existsSync(filePath)) {
    log('testing-patterns.mdx not found', 'warning');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add timestamp comment
  const timestamp = new Date().toISOString();
  const updateComment = `<!-- Auto-updated: ${timestamp} - Found ${templates.length} project templates -->`;
  
  if (!content.includes('<!-- Auto-updated:')) {
    content = updateComment + '\n' + content;
  } else {
    content = content.replace(/<!-- Auto-updated:.*? -->/, updateComment);
  }
  
  writeFile(filePath, content);
}

function updateBestPractices() {
  const filePath = path.join(CONFIG.contentDir, 'best-practices.mdx');
  
  if (!fs.existsSync(filePath)) {
    log('best-practices.mdx not found', 'warning');
    return;
  }
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // Add timestamp comment
  const timestamp = new Date().toISOString();
  const updateComment = `<!-- Auto-updated: ${timestamp} -->`;
  
  if (!content.includes('<!-- Auto-updated:')) {
    content = updateComment + '\n' + content;
  } else {
    content = content.replace(/<!-- Auto-updated:.*? -->/, updateComment);
  }
  
  writeFile(filePath, content);
}

// Validation functions
function validateMdxFiles() {
  log('Validating MDX files...', 'info');
  
  try {
    // This would normally run Next.js build to validate MDX
    // For now, we'll do basic validation
    const contentFiles = fs.readdirSync(CONFIG.contentDir)
      .filter(f => f.endsWith('.mdx'));
    
    let hasErrors = false;
    
    contentFiles.forEach(file => {
      const filePath = path.join(CONFIG.contentDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      
      // Basic validation checks
      if (!content.includes('---\n')) {
        log(`${file}: Missing frontmatter`, 'error');
        hasErrors = true;
      }
      
      if (!content.includes('title:')) {
        log(`${file}: Missing title in frontmatter`, 'error');
        hasErrors = true;
      }
      
      // Check for common MDX syntax issues
      const unclosedTags = content.match(/<[^/>]*[^/]>/g);
      if (unclosedTags) {
        const selfClosingTags = ['img', 'br', 'hr', 'input', 'meta', 'link'];
        const problematicTags = unclosedTags.filter(tag => {
          const tagName = tag.match(/<(\w+)/)?.[1]?.toLowerCase();
          return tagName && !selfClosingTags.includes(tagName);
        });
        
        if (problematicTags.length > 0) {
          log(`${file}: Potentially unclosed tags: ${problematicTags.join(', ')}`, 'warning');
        }
      }
    });
    
    if (hasErrors) {
      log('MDX validation completed with errors', 'error');
      process.exit(1);
    } else {
      log('MDX validation passed', 'success');
    }
  } catch (error) {
    log(`MDX validation failed: ${error.message}`, 'error');
    process.exit(1);
  }
}

// Main execution
function main() {
  log('Starting PA-QA documentation sync...', 'info');
  
  if (CONFIG.dryRun) {
    log('Running in dry-run mode - no files will be modified', 'info');
  }
  
  // Scan the framework
  const templates = scanProjectTypes();
  const utilities = scanUtilities();
  const cicdTemplates = scanCiCdTemplates();
  
  // Update documentation
  updateGettingStarted(templates);
  updateUtilities(utilities);
  updateCiCd(cicdTemplates);
  updateTestingPatterns(templates);
  updateBestPractices();
  
  // Validate results
  if (!CONFIG.dryRun) {
    validateMdxFiles();
  }
  
  log('Documentation sync completed successfully!', 'success');
  
  // Summary
  log(`Summary:
  - ${templates.length} project templates
  - ${utilities.length} utility categories  
  - ${cicdTemplates.length} CI/CD platforms
  - ${fs.readdirSync(CONFIG.contentDir).filter(f => f.endsWith('.mdx')).length} MDX files updated`, 'info');
}

// Help text
function showHelp() {
  console.log(`
PA-QA Documentation Sync Tool

Usage: node sync-docs.js [options]

Options:
  --help, -h         Show this help message
  --verbose, -v      Enable verbose logging
  --dry-run, -n      Show what would be changed without making changes
  --force, -f        Force update even if no changes detected

Examples:
  node sync-docs.js                 # Normal sync
  node sync-docs.js --dry-run       # Preview changes
  node sync-docs.js --verbose       # Detailed logging
  
This script synchronizes the MDX documentation with the PA-QA framework
by scanning project templates, utilities, and CI/CD configurations.
`);
}

// CLI handling
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  showHelp();
  process.exit(0);
}

// Error handling
process.on('uncaughtException', (error) => {
  log(`Uncaught exception: ${error.message}`, 'error');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log(`Unhandled rejection at ${promise}: ${reason}`, 'error');
  process.exit(1);
});

// Run the main function
if (require.main === module) {
  main();
}

module.exports = {
  scanProjectTypes,
  scanUtilities,
  scanCiCdTemplates,
  updateGettingStarted,
  updateUtilities,
  updateCiCd,
  validateMdxFiles
};