# --- Configuration File for .cli.sh ---
# This file allows you to customize the behavior of the .cli.sh script.

# --- Log File ---
# The location of the log file.
LOG_FILE="c:\Users\johnw\portfolio\.cli.log"

# --- Required Versions ---
# The required versions of Node.js and npm.
REQUIRED_NODE_VERSION="16.0.0"
REQUIRED_NPM_VERSION="9.0.0"

# --- Build Artifacts ---
# The build artifacts to clean.
BUILD_ARTIFACTS=(".next" ".vercel" "node_modules" "coverage" ".nyc_output" "storybook-static" "dist" "out" ".cache" ".npm" ".yarn")

# --- Reset Files ---
# Files to be removed during reset
RESET_FILES=("package-lock.json" "yarn.lock" "pnpm-lock.yaml" ".pnpm-store" ".env.local" ".env.development.local" ".env.test.local" ".env.production.local")

# --- Log Patterns ---
# The log patterns to clean.
LOG_PATTERNS=("*.cli.log" "*.tmp" "*.temp" "*.bak" "*.cache")

# --- Required Project Files ---
# The required project files.
REQUIRED_PROJECT_FILES=("package.json" "tsconfig.json" "next.config.js")

# --- Tracker File ---
# The location of the project tracker file.
TRACKER_FILE="c:\Users\johnw\portfolio\.cli_project_tracker.log"