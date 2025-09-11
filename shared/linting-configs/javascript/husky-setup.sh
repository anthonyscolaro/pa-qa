#!/bin/bash

# PA-QA Husky Setup Script
# Configures Git hooks for pre-commit linting and formatting

set -e

echo "🐺 Setting up Husky Git hooks for PA-QA linting..."

# Check if we're in a Git repository
if ! git rev-parse --git-dir > /dev/null 2>&1; then
    echo "❌ Error: Not in a Git repository. Please run this script from the root of your Git repository."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Error: Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ Error: npm is not installed. Please install npm first."
    exit 1
fi

# Create .husky directory if it doesn't exist
echo "📁 Creating .husky directory..."
mkdir -p .husky

# Initialize Husky
echo "🔧 Initializing Husky..."
npx husky init

# Create pre-commit hook
echo "📝 Setting up pre-commit hook..."
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# PA-QA Pre-commit Hook
echo "🔍 Running pre-commit checks..."

# Run lint-staged for staged files
npm run lint:staged

# Check TypeScript types if tsconfig.json exists
if [ -f "tsconfig.json" ]; then
    echo "🔄 Checking TypeScript types..."
    npm run type-check
fi

echo "✅ Pre-commit checks completed successfully!"
EOF

# Create commit-msg hook for conventional commits
echo "📝 Setting up commit-msg hook..."
cat > .husky/commit-msg << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# PA-QA Commit Message Hook
echo "📝 Validating commit message..."

# Extract commit message
commit_regex='^(feat|fix|docs|style|refactor|perf|test|chore|ci|build|revert)(\(.+\))?: .{1,50}'

if ! grep -qE "$commit_regex" "$1"; then
    echo "❌ Invalid commit message format!"
    echo ""
    echo "Commit message should follow the Conventional Commits format:"
    echo "  type(scope): description"
    echo ""
    echo "Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert"
    echo "Example: feat(auth): add user login functionality"
    echo ""
    echo "Your commit message:"
    cat "$1"
    echo ""
    exit 1
fi

echo "✅ Commit message format is valid!"
EOF

# Create pre-push hook
echo "📝 Setting up pre-push hook..."
cat > .husky/pre-push << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# PA-QA Pre-push Hook
echo "🚀 Running pre-push checks..."

# Check if there are any staged changes that weren't committed
if ! git diff-index --quiet HEAD --; then
    echo "❌ You have uncommitted changes. Please commit or stash them before pushing."
    exit 1
fi

# Run full validation suite
echo "🔄 Running full validation..."
npm run validate

# Run tests if test script exists
if npm run test --silent 2>/dev/null; then
    echo "🧪 Running tests..."
    npm run test
fi

echo "✅ Pre-push checks completed successfully!"
EOF

# Make hooks executable
chmod +x .husky/pre-commit
chmod +x .husky/commit-msg
chmod +x .husky/pre-push

# Create post-checkout hook for dependency updates
echo "📝 Setting up post-checkout hook..."
cat > .husky/post-checkout << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# PA-QA Post-checkout Hook
# Automatically install dependencies when package.json changes

changed_files="$(git diff-tree -r --name-only --no-commit-id HEAD@{1} HEAD)"

check_run() {
    echo "$changed_files" | grep --quiet "$1" && eval "$2"
}

# Check if package.json changed and install dependencies
check_run package.json "echo '📦 package.json changed, installing dependencies...' && npm install"

# Check if package-lock.json was deleted and run npm install
if echo "$changed_files" | grep --quiet "package-lock.json"; then
    if [ ! -f package-lock.json ]; then
        echo "🔄 package-lock.json was deleted, running npm install..."
        npm install
    fi
fi
EOF

chmod +x .husky/post-checkout

# Create post-merge hook
echo "📝 Setting up post-merge hook..."
cat > .husky/post-merge << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# PA-QA Post-merge Hook
echo "🔄 Running post-merge checks..."

# Check if package.json changed and install dependencies
changed_files="$(git diff-tree -r --name-only --no-commit-id HEAD@{1} HEAD)"

if echo "$changed_files" | grep --quiet "package.json"; then
    echo "📦 package.json changed, installing dependencies..."
    npm install
fi

echo "✅ Post-merge checks completed!"
EOF

chmod +x .husky/post-merge

# Update package.json to include prepare script if it doesn't exist
echo "📝 Updating package.json with prepare script..."
if ! grep -q '"prepare"' package.json; then
    # Add prepare script using npm pkg command if available, otherwise use sed
    if command -v npm &> /dev/null && npm pkg --help | grep -q "set"; then
        npm pkg set scripts.prepare="husky"
    else
        # Fallback to sed for older npm versions
        sed -i.bak 's/"scripts": {/"scripts": {\n    "prepare": "husky",/' package.json && rm package.json.bak
    fi
    echo "✅ Added 'prepare' script to package.json"
else
    echo "✅ 'prepare' script already exists in package.json"
fi

# Create configuration file for Husky
echo "📝 Creating Husky configuration..."
cat > .husky/.gitignore << 'EOF'
*
!/.gitignore
!/pre-commit
!/commit-msg
!/pre-push
!/post-checkout
!/post-merge
!/_/husky.sh
EOF

# Create helper functions
echo "📝 Creating Husky helper functions..."
mkdir -p .husky/_
cat > .husky/_/husky.sh << 'EOF'
#!/usr/bin/env sh
if [ -z "$husky_skip_init" ]; then
  debug () {
    if [ "$HUSKY_DEBUG" = "1" ]; then
      echo "husky (debug) - $1"
    fi
  }

  readonly hook_name="$(basename -- "$0")"
  debug "starting $hook_name..."

  if [ "$HUSKY" = "0" ]; then
    debug "HUSKY env variable is set to 0, skipping hook"
    exit 0
  fi

  if [ -f ~/.huskyrc ]; then
    debug "sourcing ~/.huskyrc"
    . ~/.huskyrc
  fi

  readonly husky_skip_init=1
  export husky_skip_init
  sh -e "$0" "$@"
  exitCode="$?"

  if [ $exitCode != 0 ]; then
    echo "husky - $hook_name hook exited with code $exitCode (error)"
  fi

  if [ $exitCode = 127 ]; then
    echo "husky - command not found in PATH=$PATH"
  fi

  exit $exitCode
fi
EOF

chmod +x .husky/_/husky.sh

# Create documentation
echo "📄 Creating Husky documentation..."
cat > .husky/README.md << 'EOF'
# PA-QA Git Hooks (Husky)

This directory contains Git hooks configured by Husky for the PA-QA framework.

## Hooks

### pre-commit
- Runs `lint-staged` to lint and format only staged files
- Performs TypeScript type checking if `tsconfig.json` exists
- Ensures code quality before commits

### commit-msg
- Validates commit messages against Conventional Commits format
- Enforces consistent commit message structure
- Types: feat, fix, docs, style, refactor, perf, test, chore, ci, build, revert

### pre-push
- Runs full validation suite (lint, format, type-check)
- Runs tests if test script exists
- Prevents pushing broken code

### post-checkout
- Automatically installs dependencies when `package.json` changes
- Runs after switching branches or checking out commits

### post-merge
- Installs dependencies after merging if `package.json` changed
- Keeps dependencies in sync after merges

## Configuration

### Skipping Hooks
To skip hooks temporarily:
```bash
# Skip all hooks
HUSKY=0 git commit -m "message"

# Skip specific hook
git commit -m "message" --no-verify
```

### Environment Variables
- `HUSKY=0`: Disable all hooks
- `HUSKY_DEBUG=1`: Enable debug output

### Customization
Edit hook files directly or modify the setup script for project-specific needs.
EOF

echo ""
echo "🎉 Husky setup completed successfully!"
echo ""
echo "📋 Summary of configured hooks:"
echo "  ✅ pre-commit: Lint and format staged files"
echo "  ✅ commit-msg: Validate commit message format"
echo "  ✅ pre-push: Run full validation and tests"
echo "  ✅ post-checkout: Auto-install dependencies"
echo "  ✅ post-merge: Auto-install dependencies"
echo ""
echo "🔧 Next steps:"
echo "  1. Make sure lint-staged.config.js is configured"
echo "  2. Commit your changes to activate the hooks"
echo "  3. Try making a commit to test the setup"
echo ""
echo "💡 To skip hooks temporarily: git commit --no-verify"
echo "💡 To disable all hooks: HUSKY=0 git commit"
echo ""
echo "Happy coding! 🚀"