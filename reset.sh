#!/bin/bash

# Source the configuration file
source ./.cli.config.sh

echo "🧹 Starting project reset..."

# Function to remove a file or directory if it exists
remove_if_exists() {
    if [ -e "$1" ]; then
        rm -rf "$1"
        echo "✔️ Removed: $1"
    fi
}

# Remove build artifacts
for artifact in "${BUILD_ARTIFACTS[@]}"; do
    remove_if_exists "$artifact"
done

# Remove reset files
for file in "${RESET_FILES[@]}"; do
    remove_if_exists "$file"
done

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

# Clear global cache
echo "🧹 Clearing global cache..."
npm cache verify

echo "✨ Project reset complete!"
echo "🔧 You can now run 'npm install' for a fresh start."
