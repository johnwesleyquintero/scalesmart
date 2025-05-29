#!/usr/bin/env bash

# --- Function to load configuration from file ---
load_config() {
  local config_file=".cli.config.sh"
  if [ -f "$config_file" ]; then
    while IFS='=' read -r key value; do
      # Remove leading/trailing whitespace from key and value
      key=$(echo "$key" | tr -d '[:space:]')
      value=$(echo "$value" | tr -d '"') # Remove quotes
      value=$(echo "$value" | sed 's/#.*//') # Remove comments

      # Only set variables that are not empty and are valid
      if [ -n "$key" ] && [ -n "$value" ] && [[ "$key" =~ ^[A-Za-z_]+$ ]]; then
        export "$key"="$value"
      fi
    done < "$config_file"
  fi
}

# Load configuration
load_config

# --- Script Configuration ---
# Load configuration
load_config
OS="$(uname -s)"
VERSION="1.2.0"
LOG_FILE="${LOG_FILE:-c:\Users\johnw\portfolio\.cli.log}"
REQUIRED_NODE_VERSION="${REQUIRED_NODE_VERSION:-16.0.0}"
REQUIRED_NPM_VERSION="${REQUIRED_NPM_VERSION:-9.0.0}"
BUILD_ARTIFACTS=(${BUILD_ARTIFACTS:-(".next" ".vercel" "node_modules" "coverage" ".nyc_output" "storybook-static" "dist" "out")})
LOG_PATTERNS=(${LOG_PATTERNS:-("*.cli.log" "*.tmp" "*.temp" "*.bak" "*.cache")})
REQUIRED_PROJECT_FILES=(${REQUIRED_PROJECT_FILES:-("package.json" "tsconfig.json" "next.config.js")})
GENERATED_COMMIT_MESSAGE="" # For sharing commit message between functions
CONFIG_FILE=""
TRACKER_FILE="${TRACKER_FILE:-c:\Users\johnw\portfolio\.cli_project_tracker.log}"

# --- ANSI Colors ---
ANSI_Reset='\e[0m'
ANSI_Bold='\e[1m'
ANSI_Red='\e[31m'
ANSI_Green='\e[32m'
ANSI_Yellow='\e[33m'
ANSI_Blue='\e[34m'
ANSI_Magenta='\e[35m'
ANSI_Cyan='\e[36m'

# --- Spinner Utilities ---
spinner_chars=("⠋" "⠙" "⠹" "⠸" "⠼" "⠴" "⠦" "⠧" "⠇" "⠏")
spinner_pid=""

cleanup() {
    stop_spinner
    echo -e "\n${ANSI_Yellow}[INFO]${ANSI_Reset} Cleaning up and exiting..."
    exit 0
}

# Set up trap for cleanup
trap cleanup SIGINT SIGTERM

start_spinner() {
    local message="$1"
    echo -ne "${ANSI_Cyan}${message}${ANSI_Reset} "

    # Hide cursor
    echo -ne "\e[?25l"

    # Start spinner in background
    while :; do
        for char in "${spinner_chars[@]}"; do
            echo -ne "\b${char}"
            sleep 0.1
        done
    done &

    spinner_pid=$!
    disown
}

stop_spinner() {
    if [ -n "$spinner_pid" ]; then
        kill $spinner_pid >/dev/null 2>&1
        wait $spinner_pid 2>/dev/null
        spinner_pid=""
    fi

    # Clear spinner and show cursor
    echo -ne "\b \b\e[?25h"
}

# --- Core Functions ---
# Maximum log file size in bytes (5MB)
MAX_LOG_SIZE=5242880

rotate_log() {
    local log_file=$1
    if [[ -f "$log_file" ]] && [[ $(stat -f%z "$log_file" 2>/dev/null || stat -c%s "$log_file" 2>/dev/null) -gt $MAX_LOG_SIZE ]]; then
        local timestamp=$(date +"%Y%m%d_%H%M%S")
        mv "$log_file" "${log_file}.${timestamp}.bak"
        log_info "Rotated log file: ${log_file} -> ${log_file}.${timestamp}.bak"
    fi
}

log() {
    local level=$1
    local message=$2
    local timestamp=$(date +'%Y-%m-%d %T')

    # Rotate logs if needed
    rotate_log "$LOG_FILE"

    # Ensure log directory exists
    local log_dir=$(dirname "$LOG_FILE")
    [[ ! -d "$log_dir" ]] && mkdir -p "$log_dir"

    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
}

log_info() {
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $1"
    log "INFO" "$1"
}

# --- UI Helper Functions ---
CONTENT_WIDTH=68 # Define a consistent width for menu content

strip_ansi() {
    # Strips ANSI escape codes (specifically SGR sequences like color, bold, etc.)
    # and also common cursor movement/clearing sequences if they were to appear.
    # Using printf %s to handle potential % in the input string safely with sed.
    printf "%s" "$1" | sed -E 's/\x1b\[[0-9;]*[mGKHJ]//g'
}

print_bordered_line() {
    local text_with_color="$1"
    local text_no_color
    text_no_color=$(strip_ansi "$text_with_color")

    local visible_len=${#text_no_color}
    local padding_len=$((CONTENT_WIDTH - visible_len))

    if ((padding_len < 0)); then
        padding_len=0 # Safety net: if content is too long, don't attempt negative padding
    fi

    local padding_str
    # Create a string of $padding_len spaces
    padding_str=$(printf "%*s" "$padding_len" "")

    echo -e "║${text_with_color}${padding_str}║"
}

log_warn() {
    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} $1"
    log "WARN" "$1"
}

log_error() {
    local message="$1"
    local command_executed="${2:-N/A}"
    local exit_code="${3:-N/A}"
    local timestamp=$(date +'%Y-%m-%d %T')
    local file=""
    local line=""
    local error_message=""

    # Attempt to parse file, line, and error message from the message
    if [[ "$message" =~ ^([^:]+):([0-9]+):(.*)$ ]]; then
        file="${BASH_REMATCH[1]}"
        line="${BASH_REMATCH[2]}"
        error_message="${BASH_REMATCH[3]}"
    else
        local caller_file="${BASH_SOURCE[1]##*/}"
        local caller_line="${BASH_LINENO[0]}"

        if [[ -n "${BASH_SOURCE[1]}" ]]; then
            file="$(realpath "${BASH_SOURCE[1]}" 2>/dev/null || echo "${BASH_SOURCE[1]}")"
        fi
        line="${caller_line}"
        error_message="${message}"
        log_warn "Failed to parse error message: $message"
    fi

    if [[ -n "$file" ]]; then
        file="$(realpath "$file" 2>/dev/null || echo "$file")"
    fi

    local formatted_message="${ANSI_Red}[ERROR]${ANSI_Reset} ${timestamp} - ${file}:${line} - ${error_message}"
    echo -e "$formatted_message"
    log "ERROR" "$formatted_message"

    rotate_log "$LOG_FILE"

    local code_snippet=""
    local context_lines=3
    if [[ -f "$file" && -r "$file" ]]; then
        local start_line=$((line > context_lines ? line - context_lines : 1))
        local end_line=$((line + context_lines))

        local total_lines
        total_lines=$(wc -l < "$file" 2>/dev/null)
        if [[ -z "$total_lines" ]]; then
            log_warn "Could not determine total lines for file: $file"
            total_lines=0
        fi

        end_line=$((end_line > total_lines ? total_lines : end_line))

        if [[ "$total_lines" -gt 0 ]]; then
            code_snippet=$(sed -n "${start_line},${end_line}p" "$file" 2>/dev/null | awk -v start="$start_line" '{printf "    %4d: %s\n", NR+start-1, $0}')
        else
            log_warn "File is empty or has no lines: $file"
            code_snippet="    (File is empty or has no lines)"
        fi

        echo -e "${timestamp} [ERROR] [File: ${file}:${line}] ${error_message}\n  Command: ${command_executed}\n  Context:\n${code_snippet}" >> "$LOG_FILE"
    else
        echo -e "${timestamp} [ERROR] [${file}:${line}] ${error_message} - Command: ${command_executed}" >> "$LOG_FILE"
    fi

    return 1
}


generate_commit_message() {
    local commit_type_input
    local commit_scope
    local commit_description
    local commit_type
    GENERATED_COMMIT_MESSAGE="" # Clear previous message
    local suggested_description=""

    local common_types=("feat" "fix" "chore" "docs" "style" "refactor" "test" "ci" "build" "perf" "revert")

    echo -e "${ANSI_Bold}${ANSI_Yellow}Select Commit Type or enter a custom one:${ANSI_Reset}"
    for i in "${!common_types[@]}"; do
        echo -e "  ${ANSI_Green}$((i+1))) ${common_types[$i]}${ANSI_Reset}"
    done
    echo -e "  ${ANSI_Green}c) Custom type${ANSI_Reset}"
    echo -e "${ANSI_Bold}${ANSI_Yellow}Your choice (number or custom type): ${ANSI_Reset}\c"
    read -r commit_type_input

    if [[ "$commit_type_input" =~ ^[0-9]+$ ]] && [ "$commit_type_input" -ge 1 ] && [ "$commit_type_input" -le "${#common_types[@]}" ]; then
        commit_type="${common_types[$((commit_type_input-1))]}"
    elif [[ "$commit_type_input" == "c" ]]; then
        echo -e "${ANSI_Bold}${ANSI_Yellow}Enter Custom Commit Type: ${ANSI_Reset}\c"
        read -r commit_type
        commit_type=$(echo "$commit_type" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
        if [ -z "$commit_type" ]; then
            log_error "Custom commit type cannot be empty." "generate_commit_message"
            echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Custom commit type cannot be empty."
            return 1
        fi
    else
        commit_type=$(echo "$commit_type_input" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
        if [ -z "$commit_type" ]; then
            log_warn "No valid selection or custom type entered, defaulting to 'chore'."
            commit_type="chore" # Default to 'chore' or handle as an error
        fi
    fi

    # Generate suggested description based on commit type
    case "$commit_type" in
        "feat") suggested_description="Implement new feature: " ;;
        "fix") suggested_description="Resolve issue: " ;;
        "chore") suggested_description="Perform maintenance task: " ;;
        "docs") suggested_description="Update documentation for: " ;;
        "style") suggested_description="Format/refactor code style for: " ;;
        "refactor") suggested_description="Refactor code related to: " ;;
        "test") suggested_description="Add/update tests for: " ;;
        "ci") suggested_description="Update CI/CD configuration for: " ;;
        "build") suggested_description="Update build system for: " ;;
        "perf") suggested_description="Improve performance of: " ;;
        "revert") suggested_description="Revert changes related to: " ;;
        *) suggested_description="Describe the change: " ;; # Default for custom or unlisted types
    esac

    echo -e "${ANSI_Bold}${ANSI_Yellow}Commit Scope (optional, e.g., component name): ${ANSI_Reset}\c"
    read -r commit_scope

    # Prompt for description with the suggestion, allowing editing
    local description_prompt="${ANSI_Bold}${ANSI_Yellow}Commit Description: ${ANSI_Reset}"
    read -e -i "$suggested_description" -p "$description_prompt" -r commit_description

    local commit_message="$commit_type"
    if [ -n "$commit_scope" ]; then
        commit_message="$commit_message($commit_scope)"
    fi
    commit_message="$commit_message: $commit_description"

    GENERATED_COMMIT_MESSAGE="$commit_message" # Store for other functions

    echo -e "${ANSI_Bold}${ANSI_Green}Generated Commit Message:${ANSI_Reset} $commit_message"
    echo "$commit_message" | clip  # Copy to clipboard (requires 'clip' on Windows, 'xclip' or 'xsel' on Linux)
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Commit message copied to clipboard!"
    return 0 # Explicitly return success
}

# Default command timeout in seconds
COMMAND_TIMEOUT=300

run_with_timeout() {
    local cmd="$1"
    local timeout=${2:-$COMMAND_TIMEOUT}
    local description="$3"

    # Start the command in background
    eval "$cmd" & local cmd_pid=$!

    # Wait for command to finish or timeout
    local count=0
    while kill -0 $cmd_pid 2>/dev/null; do
        if [ $count -ge $timeout ]; then
            kill -9 $cmd_pid 2>/dev/null
            log_error "${description:-Command} timed out after ${timeout} seconds" "run_with_timeout"
            return 1
        fi
        sleep 1
        ((count++))
    done

    wait $cmd_pid
    return $?
}

validate_environment() {
    local check_cmd

    # Check Node.js installation
    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        check_cmd="where node 2>/dev/null"
    else
        check_cmd="command -v node 2>/dev/null"
    fi
    eval $check_cmd || log_error "Node.js not installed" "validate_environment"
216 |
    # Check npm installation
    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        check_cmd="where npm 2>/dev/null"
    else
        check_cmd="command -v npm 2>/dev/null"
    fi
    eval $check_cmd || log_error "npm not installed" "validate_environment"
224 |
    # Get versions with timeout protection
    local node_version
    if ! node_version=$(run_with_timeout "node -v | cut -d'v' -f2" 10 "Node.js version check"); then
        log_error "Failed to get Node.js version" "validate_environment"
    fi

    local npm_version
    if ! npm_version=$(run_with_timeout "npm -v" 10 "npm version check"); then
        log_error "Failed to get npm version" "validate_environment"
    fi

    # Compare versions using semver rules
    if ! printf '%s\n%s' "$REQUIRED_NODE_VERSION" "$node_version" | sort -V -C; then
        log_error "Node.js version $node_version < required $REQUIRED_NODE_VERSION" "validate_environment"
    fi

    if ! printf '%s\n%s' "$REQUIRED_NPM_VERSION" "$npm_version" | sort -V -C; then
        log_error "npm version $npm_version < required $REQUIRED_NPM_VERSION" "validate_environment"
    fi

    log_info "Environment validation passed"
}

clean_artifacts() {
    log_info "Cleaning build artifacts"
    for artifact in "${BUILD_ARTIFACTS[@]}"; do
        if [[ -e "$artifact" ]]; then
            rm -rf "$artifact"
        fi
    done
}

# --- Interactive Menu ---
show_menu() {
    local i
    clear

    # Box drawing characters
    local border_top="╔$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╗"
    local border_middle="╠$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╣"
    local border_thin_sep="╟$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '─')╢"
    local border_bottom="╚$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╝"

    # Header
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_top}${ANSI_Reset}"
    local title_core="Wescore Project CLI v${VERSION}"
    local title_len=${#title_core}
    local total_padding=$((CONTENT_WIDTH - title_len))
    local pad_left=$((total_padding / 2))
    local pad_right=$((total_padding - pad_left))
    local title_line
    title_line=$(printf "%*s%s%s%s%*s" "$pad_left" "" "${ANSI_Bold}${ANSI_Yellow}" "$title_core" "${ANSI_Cyan}" "$pad_right" "")
    echo -e "║${title_line}${ANSI_Reset}║"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"

    # Helper for section titles
    print_section_title() {
        local core_title="$1"
        local color="${2:-${ANSI_Blue}}"
        local title_text_len=${#core_title}
        local total_sec_padding=$((CONTENT_WIDTH - title_text_len))
        local pad_sec_left=$((total_sec_padding / 2))
        local pad_sec_right=$((total_sec_padding - pad_sec_left))
        local section_line_content
        section_line_content=$(printf "%*s%s%s%s%*s" "$pad_sec_left" "" "${ANSI_Bold}${color}" "$core_title" "${ANSI_Reset}" "$pad_sec_right" "")
        echo -e "║${section_line_content}║"
    }

    # Development Section
    print_section_title "Development"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[e]${ANSI_Reset} Setup Environment       - Check/setup dev environment"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[i]${ANSI_Reset} Install Dependencies    - Setup project packages"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[d]${ANSI_Reset} Dev Server              - Manage development server"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[b]${ANSI_Reset} Database                - Manage local database"

    # Testing & Quality Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Testing & Quality"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[t]${ANSI_Reset} Run Tests               - Execute test suite"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[c]${ANSI_Reset} Run Code Checks         - Lint and analyze code"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[a]${ANSI_Reset} Security Audit          - Check dependencies"

    # Build & Maintenance Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Build & Maintenance"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[w]${ANSI_Reset} Build Project           - Create production build"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[x]${ANSI_Reset} Clean Artifacts         - Remove build files"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[r]${ANSI_Reset} Reset Project           - Clean slate reset"

    # Monitoring Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Monitoring"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[s]${ANSI_Reset} Project Status          - View dependencies"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[u]${ANSI_Reset} Project Tracker         - View & Add to Tracker Log"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[l]${ANSI_Reset} View Logs               - Check system logs"

    # Git Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Git"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[g]${ANSI_Reset} Generate Commit         - Interactive commit message"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[p]${ANSI_Reset} Smart Commit & Push     - Quick/Template/AI commit"

    # Deployment Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Deployment"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[v]${ANSI_Reset} Deploy to Vercel        - Deploy to production"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[m]${ANSI_Reset} Manage Env Variables    - Sync with Vercel"
    
    # Security Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Security"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[k]${ANSI_Reset} Generate Secret Key     - Generate a secure key"

    # Exit Option
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Exit" "${ANSI_Red}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Red}[q]${ANSI_Reset} Exit                    - Quit application"

    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_bottom}${ANSI_Reset}"
    echo -e "${ANSI_Yellow}  Use number or shortcut key in [brackets]${ANSI_Reset}"
}

generate_secret_key() {
    local secret_key=$(openssl rand -hex 32)
    echo -e "${ANSI_Bold}${ANSI_Green}Generated Secret Key:${ANSI_Reset} $secret_key"
    echo "$secret_key" | clip
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Secret key copied to clipboard!"
}

# --- Smart Commit Templates ---
COMMIT_TEMPLATES=(
    "feat(component): add new component for"
    "fix(bug): resolve issue with"
    "docs(readme): update documentation for"
    "style(ui): improve styling of"
    "refactor(core): restructure code in"
    "test(unit): add tests for"
    "chore(deps): update dependencies for"
    "perf(optimize): improve performance of"
)

QUICK_COMMITS=(
    "quick: minor changes"
    "quick: bug fix"
    "quick: update docs"
    "quick: cleanup code"
    "quick: fix typo"
)

# --- Smart Commit Functions ---
smart_commit_message() {
    local commit_message=""
    local template_choice
    
    echo -e "\n${ANSI_Bold}${ANSI_Yellow}Select Commit Type:${ANSI_Reset}"
    echo -e "${ANSI_Green}1) ${ANSI_Reset}Detailed Commit (Interactive)"
    echo -e "${ANSI_Green}2) ${ANSI_Reset}Quick Commit"
    echo -e "${ANSI_Green}3) ${ANSI_Reset}Use Template"
    echo -e "${ANSI_Green}4) ${ANSI_Reset}AI-Suggested Commit"
    echo -e "${ANSI_Bold}${ANSI_Yellow}Your choice (1-4): ${ANSI_Reset}\c"
    read -r template_choice

    case $template_choice in
        1) generate_commit_message ;;
        2) quick_commit ;;
        3) template_commit ;;
        4) ai_suggest_commit ;;
        *) log_error "Invalid choice" "smart_commit_message" ;;
    esac
}

quick_commit() {
    echo -e "\n${ANSI_Bold}${ANSI_Yellow}Select Quick Commit:${ANSI_Reset}"
    for i in "${!QUICK_COMMITS[@]}"; do
        echo -e "${ANSI_Green}$((i+1))) ${ANSI_Reset}${QUICK_COMMITS[$i]}"
    done
    
    echo -e "${ANSI_Bold}${ANSI_Yellow}Your choice (1-${#QUICK_COMMITS[@]}): ${ANSI_Reset}\c"
    read -r choice
    
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#QUICK_COMMITS[@]}" ]; then
        GENERATED_COMMIT_MESSAGE="${QUICK_COMMITS[$((choice-1))]}"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Selected quick commit: $GENERATED_COMMIT_MESSAGE"
        return 0
    else
        log_error "Invalid quick commit selection" "quick_commit"
        return 1
    fi
}

template_commit() {
    echo -e "\n${ANSI_Bold}${ANSI_Yellow}Select Template:${ANSI_Reset}"
    for i in "${!COMMIT_TEMPLATES[@]}"; do
        echo -e "${ANSI_Green}$((i+1))) ${ANSI_Reset}${COMMIT_TEMPLATES[$i]}"
    done
    
    echo -e "${ANSI_Bold}${ANSI_Yellow}Your choice (1-${#COMMIT_TEMPLATES[@]}): ${ANSI_Reset}\c"
    read -r choice
    
    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#COMMIT_TEMPLATES[@]}" ]; then
        local template="${COMMIT_TEMPLATES[$((choice-1))]}"
        echo -e "${ANSI_Bold}${ANSI_Yellow}Enter details to complete the commit message: ${ANSI_Reset}\c"
        read -r details
        GENERATED_COMMIT_MESSAGE="$template $details"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Generated commit message: $GENERATED_COMMIT_MESSAGE"
        return 0
    else
        log_error "Invalid template selection" "template_commit"
        return 1
    fi
}

ai_suggest_commit() {
    echo -e "\n${ANSI_Yellow}[INFO]${ANSI_Reset} Analyzing changes for AI suggestion..."
    
    # Get the git status and diff
    local changes=$(git diff --cached --name-only)
    if [ -z "$changes" ]; then
        changes=$(git diff --name-only)
    fi
    
    # Get the types of files changed
    local file_types=$(echo "$changes" | grep -o '\.[^./]*$' | sort | uniq)
    
    # Generate smart suggestion based on changes and project context
    local suggestion=""
    if echo "$changes" | grep -q "package.json\|yarn.lock\|pnpm-lock.yaml"; then
        suggestion="chore(deps): update project dependencies"
    elif echo "$changes" | grep -q "supabase/"; then
        suggestion="db: update database schema or config"
    elif echo "$changes" | grep -q "src/app/"; then
        suggestion="feat(app): update app routes or pages"
    elif echo "$changes" | grep -q "src/components/"; then
        suggestion="feat(ui): update components"
    elif echo "$changes" | grep -q "docs/.*\.md\|\.mdx$"; then
        suggestion="docs: update project documentation"
    elif echo "$changes" | grep -q "src/api/\|src/actions/"; then
        suggestion="feat(api): update API endpoints"
    elif echo "$changes" | grep -q "src/hooks/"; then
        suggestion="feat(hooks): update custom hooks"
    elif echo "$changes" | grep -q "\.test\.|test/|spec/|jest\.config"; then
        suggestion="test: update test cases"
    elif echo "$changes" | grep -q "\.css$\|\.scss$\|tailwind\.config"; then
        suggestion="style: update styling and theme"
    elif echo "$changes" | grep -q "src/context/"; then
        suggestion="feat(context): update global state"
    elif echo "$changes" | grep -q "public/"; then
        suggestion="asset: update static assets"
    elif echo "$changes" | grep -q "src/lib/\|src/utils/"; then
        suggestion="refactor(utils): update utility functions"
    elif echo "$changes" | grep -q "\.config\.|\.env\.|vercel\.yml\|netlify\.toml"; then
        suggestion="config: update project configuration"
    elif echo "$changes" | grep -q "src/middleware"; then
        suggestion="feat(middleware): update request handling"
    elif echo "$changes" | grep -q "src/types/"; then
        suggestion="types: update TypeScript definitions"
    else
        suggestion="chore: update project files"
    fi
    
    echo -e "${ANSI_Bold}${ANSI_Yellow}AI Suggested Commit Message:${ANSI_Reset} $suggestion"
    echo -e "${ANSI_Bold}${ANSI_Yellow}Use this suggestion? (Y/n): ${ANSI_Reset}\c"
    read -r use_suggestion
    
    if [[ "$use_suggestion" =~ ^[Yy]?$ ]]; then
        GENERATED_COMMIT_MESSAGE="$suggestion"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Using AI suggestion: $GENERATED_COMMIT_MESSAGE"
        return 0
    else
        echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} AI suggestion declined, falling back to manual commit..."
        generate_commit_message
        return $?
    fi
}

# --- Update commit_and_push function ---
commit_and_push() {
    log_info "Starting commit and push process..."
    echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} Preparing to commit and push changes."

    # Check if inside a Git repository
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        log_error "Not inside a Git repository." "commit_and_push"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} This is not a Git repository. Aborting."
        return 1
    fi

    # Stage all changes
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Staging all changes (git add .)..."
    if git add .; then
        log_info "Successfully staged all changes."
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} All changes staged."
    else
        log_error "Failed to stage changes." "commit_and_push (git add .)"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Failed to stage changes. Aborting."
        return 1
    fi

    # Use smart commit message system
    if ! smart_commit_message; then
        log_warn "Commit message generation was cancelled or failed." "commit_and_push"
        echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Commit message generation aborted. Nothing committed."
        return 1
    fi

    if [ -z "$GENERATED_COMMIT_MESSAGE" ]; then # Double check, though generate_commit_message should set it
        log_error "Generated commit message is empty after successful call to generate_commit_message." "commit_and_push"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Commit message is empty. Aborting."
        return 1
    fi

    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Committing with message: ${ANSI_Cyan}'$GENERATED_COMMIT_MESSAGE'${ANSI_Reset}"
    if git commit -m "$GENERATED_COMMIT_MESSAGE"; then
        log_info "Successfully committed changes with message: '$GENERATED_COMMIT_MESSAGE'"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Changes committed."
        # Log the commit message to the project tracker
        echo "$(date +'%Y-%m-%d %H:%M:%S') - Commit: $GENERATED_COMMIT_MESSAGE" >> "$TRACKER_FILE" 2>/dev/null || log_warn "Failed to log commit message to tracker."

        # Rotate logs if needed
        rotate_log "$TRACKER_FILE"
    else
        log_error "Failed to commit changes." "commit_and_push (git commit -m \"$GENERATED_COMMIT_MESSAGE\")"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Failed to commit. Check Git output above."
        return 1
    fi

    # Push changes
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Pushing changes to remote..."
    if git push; then
        log_info "Successfully pushed changes."
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Changes pushed to remote."
    else
        log_error "Failed to push changes." "commit_and_push (git push)"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Failed to push changes. Check Git output above."
        return 1
    fi

    log_info "Commit and push process completed successfully."
    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} All changes committed and pushed successfully!"
    return 0
}

# --- Project Reset Function ---
reset_project() {
    log_info "Starting project reset..."
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Preparing to reset project..."

    # Function to remove a file or directory if it exists
    remove_if_exists() {
        if [[ -e "$1" ]]; then
            rm -rf "$1"
            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Removed: $1"
        fi
    }

    # Remove build artifacts
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Removing build artifacts..."
    for artifact in "${BUILD_ARTIFACTS[@]}"; do
        remove_if_exists "$artifact"
    done

    # Remove lock files
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Removing lock files..."
    remove_if_exists "package-lock.json"
    remove_if_exists "yarn.lock"
    remove_if_exists "pnpm-lock.yaml"
    remove_if_exists ".pnpm-store"

    # Remove environment files
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Removing local environment files..."
    remove_if_exists ".env.local"
    remove_if_exists ".env.development.local"
    remove_if_exists ".env.test.local"
    remove_if_exists ".env.production.local"

    # Clear npm cache
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Clearing npm cache..."
    if npm cache clean --force; then
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} npm cache cleared"
    else
        log_error "Failed to clear npm cache" "reset_project (npm cache clean)"
    fi

    # Verify npm cache
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Verifying npm cache..."
    if npm cache verify; then
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} npm cache verified"
    else
        log_error "Failed to verify npm cache" "reset_project (npm cache verify)"
    fi

    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Project reset complete!"
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Run 'npm install' to reinstall dependencies."
}

# --- Development Environment Setup ---
setup_dev_environment() {
    log_info "Checking development environment..."
    
    # Check for required tools
    local required_tools=("node" "npm" "git")
    local missing_tools=()
    
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
        fi
    done
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}" "setup_dev_environment"
        echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Please install the following tools:"
        for tool in "${missing_tools[@]}"; do
            echo -e "  - $tool"
        done
        return 1
    fi

    # Check configuration files
    local required_configs=("next.config.js" "tsconfig.json" "package.json")
    local missing_configs=()
    
    for config in "${required_configs[@]}"; do
        if [ ! -f "$config" ]; then
            missing_configs+=("$config")
        fi
    done
    
    if [ ${#missing_configs[@]} -ne 0 ]; then
        log_error "Missing configuration files: ${missing_configs[*]}" "setup_dev_environment"
        return 1
    fi

    # Verify Supabase setup if needed
    if [ -d "supabase" ]; then
        if ! command -v supabase &> /dev/null; then
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Supabase CLI not found. Installing..."
            npm install -g supabase
        fi
    fi

    # Check for environment variables
    if [ ! -f ".env.local" ] && [ ! -f ".env" ]; then
        echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} No environment file found. Creating .env.local..."
        cp .env.example .env.local 2>/dev/null || touch .env.local
    fi

    # Install dependencies if needed
    if [ ! -d "node_modules" ]; then
        echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Installing dependencies..."
        npm install
    fi

    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Development environment is ready!"
    return 0
}

# --- Project Information Display ---
show_project_info() {
    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Project Information ===${ANSI_Reset}"
    
    # Package.json info
    local name version description
    name=$(node -p "require('./package.json').name" 2>/dev/null || echo "N/A")
    version=$(node -p "require('./package.json').version" 2>/dev/null || echo "N/A")
    description=$(node -p "require('./package.json').description" 2>/dev/null || echo "N/A")
    
    echo -e "${ANSI_Yellow}Project:${ANSI_Reset}     $name"
    echo -e "${ANSI_Yellow}Version:${ANSI_Reset}     $version"
    echo -e "${ANSI_Yellow}Description:${ANSI_Reset} $description"
    
    # Git info
    local branch status
    branch=$(git branch --show-current 2>/dev/null || echo "N/A")
    status=$(git status --porcelain 2>/dev/null)
    
    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Git Status ===${ANSI_Reset}"
    echo -e "${ANSI_Yellow}Branch:${ANSI_Reset}      $branch"
    if [ -n "$status" ]; then
        echo -e "${ANSI_Yellow}Status:${ANSI_Reset}      Uncommitted changes"
        echo "$status" | while read -r line; do
            echo "  $line"
        done
    else
        echo -e "${ANSI_Yellow}Status:${ANSI_Reset}      Clean"
    fi
    
    # Environment
    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Environment ===${ANSI_Reset}"
    echo -e "${ANSI_Yellow}Node:${ANSI_Reset}        $(node -v 2>/dev/null || echo 'N/A')"
    echo -e "${ANSI_Yellow}NPM:${ANSI_Reset}         $(npm -v 2>/dev/null || echo 'N/A')"
    
    # Project structure
    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Project Structure ===${ANSI_Reset}"
    tree -L 2 -I 'node_modules|.git|.next|out' 2>/dev/null || ls -R | grep ":$" | sed -e 's/:$//' -e 's/[^-][^\/]*\//  /g' -e 's/^/  /' -e 's/-/|/'
}

# --- Development Server Management ---
manage_dev_server() {
    local action=$1
    local dev_pid_file=".dev-server.pid"
    
    case $action in
        "start")
            if [ -f "$dev_pid_file" ]; then
                local pid=$(cat "$dev_pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Development server is already running (PID: $pid)"
                    return 1
                fi
            fi
            
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Starting development server..."
            npm run dev & echo $! > "$dev_pid_file"
            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Development server started!"
            ;;
            
        "stop")
            if [ -f "$dev_pid_file" ]; then
                local pid=$(cat "$dev_pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    kill "$pid"
                    rm "$dev_pid_file"
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Development server stopped"
                else
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} No running development server found"
                fi
            else
                echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} No development server PID file found"
            fi
            ;;
            
        "status")
            if [ -f "$dev_pid_file" ]; then
                local pid=$(cat "$dev_pid_file")
                if kill -0 "$pid" 2>/dev/null; then
                    echo -e "${ANSI_Green}[STATUS]${ANSI_Reset} Development server is running (PID: $pid)"
                else
                    echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} Development server is not running"
                    rm "$dev_pid_file"
                fi
            else
                echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} No development server PID file found"
            fi
            ;;
    esac
}

# --- Database Management ---
manage_database() {
    if [ ! -d "supabase" ]; then
        log_error "Supabase directory not found" "manage_database"
        return 1
    fi

    local action=$1
    
    case $action in
        "start")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Starting Supabase local development..."
            supabase start
            ;;
            
        "stop")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Stopping Supabase local development..."
            supabase stop
            ;;
            
        "status")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Checking Supabase status..."
            supabase status
            ;;
            
        "reset")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Resetting Supabase database..."
            supabase db reset
            ;;
    esac
}

# --- Vercel Deployment Management ---
manage_vercel() {
    # Check if Vercel CLI is installed
    if ! command -v vercel &> /dev/null; then
        echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Installing Vercel CLI..."
        npm install -g vercel
    fi

    local action=$1
    
    case $action in
        "deploy")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Deploying to Vercel..."
            vercel deploy --prod
            ;;
            
        "env-pull")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Pulling environment variables from Vercel..."
            
            # Backup existing .env.local if it exists
            if [ -f ".env.local" ]; then
                local timestamp=$(date +"%Y%m%d_%H%M%S")
                cp .env.local ".env.local.backup.$timestamp"
                echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Backed up existing .env.local to .env.local.backup.$timestamp"
            fi

            # Pull environment variables from Vercel
            vercel env pull .env.local
            
            # Verify if env pull was successful
            if [ $? -eq 0 ]; then
                echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Environment variables pulled successfully!"
            else
                echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Failed to pull environment variables"
                
                # Restore backup if it exists
                if [ -f ".env.local.backup.$timestamp" ]; then
                    mv ".env.local.backup.$timestamp" .env.local
                    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Restored previous .env.local from backup"
                else
                    # Create default .env.local if no backup exists
                    create_default_env
                fi
            fi
            ;;
            
        "env-push")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Pushing environment variables to Vercel..."
            if [ -f ".env.local" ]; then
                while IFS='=' read -r key value; do
                    # Skip comments and empty lines
                    [[ $key =~ ^#.*$ ]] || [ -z "$key" ] && continue
                    # Remove any leading/trailing whitespace
                    key=$(echo "$key" | xargs)
                    value=$(echo "$value" | xargs)
                    if [ -n "$key" ] && [ -n "$value" ]; then
                        echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Adding $key..."
                        vercel env add "$key" production
                    fi
                done < .env.local
                echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Environment variables pushed to Vercel"
            else
                log_error "No .env.local file found" "vercel-env-push"
            fi
            ;;
            
        "login")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Logging into Vercel..."
            vercel login
            ;;
            
        "logout")
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Logging out of Vercel..."
            vercel logout
            ;;
    esac
}

# --- Environment File Management ---
create_default_env() {
    local env_file=".env.local"
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Creating default $env_file..."
    
    cat > "$env_file" << EOL
# GitHub Integration
GITHUB_ID=Ov23liaheaCWBdU37uGQ
GITHUB_SECRET=0e273ee0dea9e61e64ab00c8a1db1e014e464f9b

# AI Integration
GEMINI_API_KEY=AIzaSyAw1JM42mUEHXrw8RJEzluIafL35w4E0K8

# NextAuth Configuration
NEXTAUTH_SECRET=6cdb7852e327a7b606b1a9dd8f31b1479c018ac5b54374b6378d90e7d15fc0b6
NEXTAUTH_URL=http://localhost:3000

# Environment Mode
NEXT_PUBLIC_VERCEL_ENV=development
NEXT_PUBLIC_API_URL=http://localhost:3000

# Supabase Configuration
POSTGRES_URL="postgres://postgres.aybridyinsrebhibkgkh:95KkaULxLgM9XBzE@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
POSTGRES_PRISMA_URL="postgres://postgres.aybridyinsrebhibkgkh:95KkaULxLgM9XBzE@aws-0-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x"
SUPABASE_URL="https://aybridyinsrebhibkgkh.supabase.co"
NEXT_PUBLIC_SUPABASE_URL="https://aybridyinsrebhibkgkh.supabase.co"
POSTGRES_URL_NON_POOLING="postgres://postgres.aybridyinsrebhibkgkh:95KkaULxLgM9XBzE@aws-0-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
SUPABASE_JWT_SECRET="kCXz5qE6VrQPt+Uw6o387xSFXaqbNhFCGOKWchArheIQ/oG1B150Pg7IEyE+ZJliG8jqtlI7L3BAGde40PhduA=="
POSTGRES_USER="postgres"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5YnJpZHlpbnNyZWJoaWJrZ2toIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzcyNTQ3MDUsImV4cCI6MjA1MjgzMDcwNX0.sPGXhW_5PyZUrrmrJ36q1iCejppHkQrEfgcO2mSnQOE"
POSTGRES_DATABASE="postgres"
SUPABASE_SERVICE_ROLE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF5YnJpZHlpbnNyZWJoaWJrZ2toIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNzI1NDcwNSwiZXhwIjoyMDUyODMwNzA1fQ.vL_wcpzc6wWnBnkc4BjiH1FAmpDsfwoS3gYLpuuhXFM"
POSTGRES_HOST="db.aybridyinsrebhibkgkh.supabase.co"

# Add other variables as needed...
EOL

    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Created default $env_file"
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Remember to update the values in $env_file"
}

# --- Main Execution ---
main() {
    validate_environment


    while true; do
        show_menu
        echo -e "${ANSI_Bold}${ANSI_Yellow}› ${ANSI_Reset}\c"
        read -r choice
        choice=$(echo "$choice" | tr '[:upper:]' '[:lower:]')

        case $choice in
            "e") {
                log_info "Setting up development environment..."
                setup_dev_environment
            } ;;
            "i") {
                log_info "Starting dependency installation..."
                echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} Installing dependencies (this may take a while)..."

                # Show progress spinner during installation
                start_spinner "Installing dependencies..."
                if npm install --legacy-peer-deps --progress=true > .cli.log 2>&1; then
                    stop_spinner
                    log_info "Dependencies installed successfully"
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Dependencies installed successfully"
                    # Check if the install log contains any warnings or errors
                    if grep -q -i "warn" .cli.log; then
                        log_warn "npm install completed with warnings. Check .cli.log for details."
                        echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} npm install completed with warnings. Check .cli.log for details."
                    fi
                    if grep -q -i "error" .cli.log; then
                        log_error "npm install completed with errors. Check .cli.log for details." "npm install"
                        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} npm install completed with errors. Check .cli.log for details."
                    fi

                    # Verify installation with progress
                    if [ -d "node_modules" ]; then
                        start_spinner "Verifying packages..."
                        log_info "Running npm ls --depth=0"
                        if npm ls --depth=0 > .cli.log 2>&1; then
                            local npm_ls_exit_code=$?
                            log_info "npm ls --depth=0 completed with exit code: $npm_ls_exit_code"
                            stop_spinner
                            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Package verification completed"
                            log_info "Package verification successful"
                        else
                            local npm_ls_exit_code=$?
                            log_error "npm ls --depth=0 failed" "npm ls --depth=0" "$npm_ls_exit_code"
                            stop_spinner
                            log_error "Dependency verification failed"  "npm ls --depth=0" "$npm_ls_exit_code"
                            echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Package verification failed - check .cli.log for details"
                        fi
                    else
                        stop_spinner
                        log_error "node_modules directory not found after installation" "npm install" "N/A"
                        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Installation failed - node_modules not found"
                        exit 1
                    fi
                else
                    stop_spinner
                    log_error "Dependency installation failed" "npm install" "N/A"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Installation failed - check .cli.log for details"
                    exit 1
                fi
            } ;;
            "d") {
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Dev Server Management${ANSI_Reset}"
                echo -e "1) Start server"
                echo -e "2) Stop server"
                echo -e "3) Check status"
                echo -e "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}\c"
                read -r server_choice
                case $server_choice in
                    1) manage_dev_server "start" ;;
                    2) manage_dev_server "stop" ;;
                    3) manage_dev_server "status" ;;
                    *) log_error "Invalid choice" "dev_server" ;;
                esac
            } ;;
            "b") {
                if [ ! -d "supabase" ]; then
                    log_error "Supabase not configured in this project" "database"
                    break
                fi
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Database Management${ANSI_Reset}"
                echo -e "1) Start local database"
                echo -e "2) Stop local database"
                echo -e "3) Check status"
                echo -e "4) Reset database"
                echo -e "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}\c"
                read -r db_choice
                case $db_choice in
                    1) manage_database "start" ;;
                    2) manage_database "stop" ;;
                    3) manage_database "status" ;;
                    4) manage_database "reset" ;;
                    *) log_error "Invalid choice" "database" ;;
                esac
            } ;;
            "t") {
                log_info "Running tests..."
                local test_command="npm test"
                log_info "Running npm test"
                echo "$(date +'%Y-%m-%d %H:%M:%S') - Running command: $test_command" > .cli.log
                if $test_command  2>&1 | tee -a .cli.log; then
                    local npm_test_exit_code=$?
                    log_info "npm test completed with exit code: $npm_test_exit_code"
                    log_info "Tests completed successfully."
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Tests completed successfully."
                else
                    local npm_test_exit_code=$?
                    log_error "npm test failed" "$test_command" "$npm_test_exit_code"
                    log_error "Tests failed. Check .cli.log for details." "$test_command" "$npm_test_exit_code"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Tests failed. Check .cli.log for details."
                    exit 1
                fi
                if grep -q -i "warn" .cli.log; then
                    log_warn "npm test completed with warnings. Check .cli.log for details."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} npm test completed with warnings. Check .cli.log for details."
                fi
                if grep -q -i "error" .cli.log; then
                    log_error "npm test completed with errors. Check .cli.log for details." "$test_command"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} npm test completed with errors. Check .cli.log for details."
                fi
                log_info "Tests completed. Check .cli.log for details."
            } ;;
            "c") {
                log_info "Running code checks..."
                timestamp=$(date +'%Y-%m-%d %T')
                local check_command="npm run check"
                log_info "Running npm run check"
                echo "[${timestamp}] Running: $check_command" >> "$LOG_FILE"
                local check_command_log="npm run check"
                echo "$(date +'%Y-%m-%d %H:%M:%S') - Running command: $check_command_log" > .cli.log
                if $check_command  2>&1 | tee -a .cli.log; then
                    local npm_check_exit_code=$?
                    log_info "npm run check completed with exit code: $npm_check_exit_code"
                    log_info "Code checks completed successfully."
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Code checks completed successfully."
                else
                    local npm_check_exit_code=$?
                    log_error "npm run check failed" "$check_command" "$npm_check_exit_code"
                    log_error "Code checks failed. Check .cli.log for details." "$check_command" "$npm_check_exit_code"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Code checks failed. Check .cli.log for details."
                    exit 1
                fi
                if grep -q -i "warn" .cli.log; then
                    log_warn "npm run check completed with warnings. Check .cli.log for details."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} npm run check completed with warnings. Check .cli.log for details."
                fi
                if grep -q -i "error" .cli.log; then
                    log_error "npm run check completed with errors. Check .cli.log for details." "$check_command"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} npm run check completed with errors. Check .cli.log for details."
                fi
                log_info "Code checks completed. Check .cli.log for details."
            } ;;
            "a") { npm audit ;} ;;
            "w") {
                log_info "Building project..."
                local build_command="npm run build"
                log_info "Running npm run build"
                echo "$(date +'%Y-%m-%d %H:%M:%S') - Running command: $build_command" > .cli.log
                if $build_command 2>&1 | tee -a .cli.log; then
                    local npm_build_exit_code=$?
                    log_info "npm run build completed with exit code: $npm_build_exit_code"
                    log_info "Project built successfully."
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Project built successfully."
                else
                    local npm_build_exit_code=$?
                    log_error "npm run build failed" "$build_command" "$npm_build_exit_code"
                    log_error "Project build failed. Check .cli.log for details." "$build_command" "$npm_build_exit_code"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Project build failed. Check .cli.log for details."
                    exit 1
                fi
                if grep -q -i "warn" .cli.log; then
                    log_warn "npm run build completed with warnings. Check .cli.log for details."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} npm run build completed with warnings. Check .cli.log for details."
                fi
                if grep -q -i "error" .cli.log; then
                    log_error "npm run build completed with errors. Check .cli.log for details." "$build_command"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} npm build completed with errors. Check .cli.log for details."
                fi
                log_info "Project build completed. Check .cli.log for details."
            } ;;
            "x") {
                log_info "Cleaning artifacts..."
                clean_artifacts
            } ;;
            "r") {
                log_info "Starting project reset..."
                reset_project
            } ;;
            "s") {
                log_info "Displaying project information..."
                show_project_info
            } ;;
            "u") { # Project Tracker
                log_info "Accessing Project Tracker..."
                echo -e "\n${ANSI_Bold}${ANSI_Magenta}--- Project Tracker ---${ANSI_Reset}"

                if [[ -f "$TRACKER_FILE" && -s "$TRACKER_FILE" ]]; then
                    echo -e "${ANSI_Yellow}Recent Entries (last 15):${ANSI_Reset}"
                    tail -n 15 "$TRACKER_FILE"
                    echo "" # Extra newline for spacing
                else
                    echo -e "${ANSI_Cyan}Tracker is currently empty.${ANSI_Reset}"
                fi

                local add_choice
                echo -e "${ANSI_Bold}${ANSI_Yellow}Add a new entry to the tracker? (y/N): ${ANSI_Reset}\c"
                read -r add_choice
                add_choice=$(echo "$add_choice" | tr '[:upper:]' '[:lower:]')

                if [[ "$add_choice" == "y" ]]; then
                    local tracker_note
                    echo -e "${ANSI_Bold}${ANSI_Yellow}Enter tracker note: ${ANSI_Reset}\c"
                    read -r tracker_note
                    if [ -n "$tracker_note" ]; then
                        local timestamp
                        timestamp=$(date +"%Y-%m-%d %H:%M:%S")
                        echo "$timestamp - $tracker_note" >> "$TRACKER_FILE"
                        log_info "New entry added to tracker: $tracker_note"
                        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Entry added to tracker."
                    else
                        log_warn "No tracker note entered. Nothing added."
                        echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} No note entered. Nothing added."
                    fi
                else
                    log_info "User chose not to add a new tracker entry."
                    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} No new entry added."
                fi
            } ;;
            "l") cat "$LOG_FILE" ;;
            "g") {
                log_info "Generating commit message..."
                generate_commit_message
            } ;;
            "p") { # New: Commit & Push
                log_info "Starting Commit & Push All..."
                commit_and_push
            } ;;
            "v") {
                log_info "Managing Vercel deployment..."
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Vercel Deployment${ANSI_Reset}"
                echo -e "1) Deploy to production"
                echo -e "2) Login to Vercel"
                echo -e "3) Logout from Vercel"
                echo -e "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}\c"
                read -r deploy_choice
                case $deploy_choice in
                    1) manage_vercel "deploy" ;;
                    2) manage_vercel "login" ;;
                    3) manage_vercel "logout" ;;
                    *) log_error "Invalid choice" "vercel-deployment" ;;
                esac
            } ;;
            "m") {
                log_info "Managing environment variables..."
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Environment Variable Management${ANSI_Reset}"
                echo -e "1) Pull from Vercel"
                echo -e "2) Push to Vercel"
                echo -e "3) Create default .env.local"
                echo -e "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}\c"
                read -r env_choice
                case $env_choice in
                    1) manage_vercel "env-pull" ;;
                    2) manage_vercel "env-push" ;;
                    3) create_default_env ;;
                    *) log_error "Invalid choice" "env-management" ;;
                esac
            } ;;
            "k") {
                log_info "Generating secret key..."
                generate_secret_key
            } ;;
            "q") exit 0 ;;
            *) log_error "Invalid selection" "main" ;;
        esac

        read -p "Press Enter to continue..."
    done
}

# Properly separate Bash and PowerShell sections
if [[ "$0" == "${BASH_SOURCE[0]}" ]]; then
    main "$@"
    exit 0
fi

# --- PowerShell Section ---
# --- Global Variables ---
$script:LOG_FILE = $env:LOG_FILE # Attempt to get from environment if set by Bash
if (-not $script:LOG_FILE) { $script:LOG_FILE = "c:\Users\johnw\portfolio\.cli.ps.log" } # Default PS log
$script:REQUIRED_NODE_VERSION = $env:REQUIRED_NODE_VERSION # Attempt to get from env
if (-not $script:REQUIRED_NODE_VERSION) { $script:REQUIRED_NODE_VERSION = "16.0.0" }
# ... (initialize other PowerShell script variables similarly, potentially from env vars if Bash exports them)
$script:REQUIRED_NPM_VERSION="9.0.0"
$script:BUILD_ARTIFACTS=(".next", ".vercel", "node_modules", "coverage", ".nyc_output", "storybook-static", "dist", "out")
$script:LOG_PATTERNS=("*.cli.log", "*.tmp", "*.temp", "*.bak", "*.cache")
$script:REQUIRED_PROJECT_FILES=("package.json", "tsconfig.json", "next.config.js")

$script:ANSI = @{
    Reset   = "`e[0m"
    Bold    = "`e[1m"
    Red     = "`e[31m"
    Yellow  = "`e[33m"
    Green   = "`e[32m"
    Cyan    = "`e[36m"
    Gray    = "`e[90m" # Using bright black for gray
    # ... add other colors as needed by PowerShell part
}

$script:CurrentNodeVersion = $null
$script:CurrentNpmVersion = $null

# --- PowerShell Functions ---

function Get-OrElse {
    [CmdletBinding()]
    param (
        [Parameter(Mandatory=$true, ValueFromPipeline=$true)]
        $InputObject,
        [Parameter(Mandatory=$true)]
        $DefaultValue
    )
    if ($null -ne $InputObject -and $InputObject -isnot [System.Management.Automation.Language.NullString]) {
        return $InputObject
    } else {
        return $DefaultValue
    }
}

function Write-Log {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true, Position = 0, ValueFromPipeline = $true)]
        [ValidateNotNullOrEmpty()]
        [string]$Message,

        [Parameter(Mandatory = $false, Position = 1)]
        [ValidateSet("INFO", "ERROR", "WARN", "SUCCESS", "DEBUG")]
        [string]$Level = "INFO",

        [Parameter(Mandatory = $false)]
        [string]$LogPath = $script:LOG_FILE # Use script-scoped variable
    )

    process {
        try {
            $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
            $logMessage = "$timestamp - [$Level] $Message"

            # Ensure log directory exists
            $logDir = Split-Path -Parent -Path $LogPath -Resolve
            if ($logDir -and (-not (Test-Path -Path $logDir -PathType Container))) {
                New-Item -ItemType Directory -Path $logDir -Force | Out-Null
                Write-Host "Created log directory: $logDir" -ForegroundColor Gray
            }

            # Write to log file
            Add-Content -Path $LogPath -Value $logMessage

            # Console output with color
            switch ($Level) {
                "ERROR"   { Write-Host "$($script:ANSI.Red)$Message$($script:ANSI.Reset)" }
                "WARN"    { Write-Host "$($script:ANSI.Yellow)$Message$($script:ANSI.Reset)" }
                "SUCCESS" { Write-Host "$($script:ANSI.Green)$Message$($script:ANSI.Reset)" }
                "DEBUG"   { Write-Host "$($script:ANSI.Gray)$Message$($script:ANSI.Reset)" } # Make DEBUG visible but gray
                default   { Write-Host $Message }
            }
        }
        catch {
            # Avoid recursive logging if Write-Log itself fails
            $errorMessage = "FATAL: Failed to write log to '$LogPath'. Error: $($_.Exception.Message)"
            Write-Error $errorMessage
            Write-Host $errorMessage -ForegroundColor Red
            # Consider exiting or alternative logging here if file logging is critical
        }
    }
}

function Get-Configuration {
    param (
        [string]$ConfigFile
    )

    if ($ConfigFile -and (Test-Path $ConfigFile -PathType Leaf)) {
        try {
            Write-Log "Loading configuration from $ConfigFile" "INFO"
            $config = Get-Content $ConfigFile -Raw | ConvertFrom-Json -ErrorAction Stop

            # Update script parameters if present in the config file
            if ($config.PSObject.Properties.Name -contains 'LOG_FILE') { $script:LOG_FILE = $config.cli.log_FILE }
            if ($config.PSObject.Properties.Name -contains 'REQUIRED_NODE_VERSION') { $script:REQUIRED_NODE_VERSION = $config.REQUIRED_NODE_VERSION }
            if ($config.PSObject.Properties.Name -contains 'REQUIRED_NPM_VERSION') { $script:REQUIRED_NPM_VERSION = $config.REQUIRED_NPM_VERSION }
            if ($config.PSObject.Properties.Name -contains 'BUILD_ARTIFACTS') { $script:BUILD_ARTIFACTS = $config.BUILD_ARTIFACTS }
            if ($config.PSObject.Properties.Name -contains 'LOG_PATTERNS') { $script:LOG_PATTERNS = $config.cli.log_PATTERNS }
            if ($config.PSObject.Properties.Name -contains 'REQUIRED_PROJECT_FILES') { $script:REQUIRED_PROJECT_FILES = $config.REQUIRED_PROJECT_FILES }

            Write-Log "Configuration loaded successfully from $ConfigFile" "SUCCESS"
        }
        catch {
            Write-Log "Failed to load or parse configuration from '$($ConfigFile)': $($_.Exception.Message)" "ERROR"
            # Decide if this should be a fatal error
            # exit 1
        }
    }
    else {
        Write-Log "No valid configuration file specified or found. Using default parameters." "DEBUG"
    }
}

function Test-NodeVersion {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$RequiredVersion
    )

    try {
        Write-Log "Checking Node.js version..." "DEBUG"
        $nodeOutput = node --version 2>&1
        if ($LASTEXITCODE -ne 0) {
            throw "Failed to execute 'node --version'. Is Node.js installed and in PATH? Error: $nodeOutput"
        }

        $script:CurrentNodeVersion = $nodeOutput.TrimStart('v').Trim()

        if (-not ($script:CurrentNodeVersion -match '^\d+\.\d+\.\d+')) {
            throw "Could not parse Node.js version format: $($script:CurrentNodeVersion)"
        }

        if ([version]$script:CurrentNodeVersion -lt [version]$RequiredVersion) {
            Write-Log "Node.js version $RequiredVersion or higher is required. Current version: $($script:CurrentNodeVersion)" "ERROR"
            return $false
        }

        Write-Log "Node.js version check passed: $($script:CurrentNodeVersion) (Required: >= $RequiredVersion)" "DEBUG"
        return $true
    }
    catch {
        Write-Log "Failed to check Node.js version: $($_.Exception.Message)" "ERROR"
        $script:CurrentNodeVersion = "Error"
        return $false
    }
}

function Test-NpmVersion {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $true)]
        [string]$RequiredVersion
    )

    try {
        Write-Log "Checking npm version..." "DEBUG"
        $npmOutput = npm --version 2>&1
         if ($LASTEXITCODE -ne 0) {
            throw "Failed to execute 'npm --version'. Is npm installed and in PATH? Error: $npmOutput"
        }

        $script:CurrentNpmVersion = $npmOutput.Trim()

        if (-not ($script:CurrentNpmVersion -match '^\d+\.\d+\.\d+')) {
            throw "Could not parse npm version format: $($script:CurrentNpmVersion)"
        }

        if ([version]$script:CurrentNpmVersion -lt [version]$RequiredVersion) {
            Write-Log "npm version $RequiredVersion or higher is required. Current version: $($script:CurrentNpmVersion)" "ERROR"
            return $false
        }

        Write-Log "npm version check passed: $($script:CurrentNpmVersion) (Required: >= $RequiredVersion)" "DEBUG"
        return $true
    }
    catch {
        Write-Log "Failed to check npm version: $($_.Exception.Message)" "ERROR"
        $script:CurrentNpmVersion = "Error"
        return $false
    }
}

function Test-ProjectStructure {
    [CmdletBinding()]
    param(
        # Use the script-scoped variable as the default
        [Parameter(Mandatory = $false)]
        [string[]]$RequiredFiles = $script:REQUIRED_PROJECT_FILES
    )

    try {
        Write-Log "Validating project structure..." "INFO"
        $missingFiles = @()
        $projectRoot = $PSScriptRoot # Assume script is in project root or adjust as needed

        foreach ($file in $RequiredFiles) {
            if ([string]::IsNullOrWhiteSpace($file)) {
                Write-Log "Skipping invalid (empty) required file entry." "WARN"
                continue
            }

            $filePath = Join-Path -Path $projectRoot -ChildPath $file
            if (-not (Test-Path $filePath -PathType Leaf)) {
                $missingFiles += $file
            } else {
                 Write-Log "Found required file: $file" "DEBUG"
            }
        }

        if ($missingFiles.Count -gt 0) {
            Write-Log "Missing required project files: $($missingFiles -join ', ')" "ERROR"
            return $false
        }

        Write-Log "Project structure validation passed" "SUCCESS"
        return $true
    }
    catch {
        Write-Log "Project structure validation failed: $($_.Exception.Message)" "ERROR"
        return $false
    }
}

function Test-Environment {
    # Uses script-scoped variables $REQUIRED_NODE_VERSION and $REQUIRED_NPM_VERSION
    Write-Log "Testing development environment..." "INFO"
    $allTestsPassed = $true

    if (-not (Test-NodeVersion -RequiredVersion $script:REQUIRED_NODE_VERSION)) {
        $allTestsPassed = $false
    }

    if (-not (Test-NpmVersion -RequiredVersion $script:REQUIRED_NPM_VERSION)) {
        $allTestsPassed = $false
    }

    if (-not (Test-ProjectStructure)) { # Uses default $script:REQUIRED_PROJECT_FILES
        $allTestsPassed = $false
    }

    if ($allTestsPassed) {
        Write-Log "Development environment tests passed" "SUCCESS"
    } else {
        Write-Log "One or more development environment tests failed." "ERROR"
        return $false
    }
}

function Get-ProjectInfo {
    [CmdletBinding()]
    param(
        [Parameter(Mandatory = $false)]
        [string]$PackageJsonPath = "package.json",

        [Parameter(Mandatory = $false)]
        [string[]]$EnvFiles = @(".env", ".env.local", ".env.development", ".env.production")
    )

    try {
        Write-Log "Gathering project information..." "INFO"

        $packageJsonFullPath = Join-Path -Path $PSScriptRoot -ChildPath $PackageJsonPath
        if (-not (Test-Path $packageJsonFullPath -PathType Leaf)) {
            throw "Package.json not found at path: $PackageJsonFullPath"
        }

        $pkg = Get-Content $packageJsonFullPath -Raw | ConvertFrom-Json
        if (-not $pkg) {
            throw "Failed to parse $PackageJsonPath"
        }

        # Check Git status safely
        $gitBranch = "N/A"
        $gitStatus = "N/A"
        $gitExists = (Get-Command git -ErrorAction SilentlyContinue)
        if ($gitExists) {
             # Check if inside a git repo work tree
            git rev-parse --is-inside-work-tree 2>$null | Out-Null
            if ($LASTEXITCODE -eq 0) {
                $gitBranch = (git rev-parse --abbrev-ref HEAD 2>$null).Trim()
                if ($LASTEXITCODE -ne 0) { $gitBranch = "Error getting branch" }

                $gitStatusOutput = (git status --porcelain 2>$null)
                if ($LASTEXITCODE -ne 0) {
                    $gitStatus = "Error getting status"
                } elseif ($gitStatusOutput) {
                    $gitStatus = "Has uncommitted changes"
                } else {
                    $gitStatus = "Clean"
                }
            } else {
                 $gitBranch = "Not a git repository"
                 $gitStatus = "Not a git repository"
            }
        } else {
            $gitBranch = "Git not found"
            $gitStatus = "Git not found"
        }


        $presentEnvFiles = $EnvFiles | ForEach-Object { Join-Path -Path $PSScriptRoot -ChildPath $_ } | Where-Object { Test-Path $_ -PathType Leaf } | ForEach-Object { Split-Path $_ -Leaf }

        $projectInfo = [PSCustomObject]@{
            Name          = $pkg.name | Get-OrElse "N/A"
            Version       = $pkg.version | Get-OrElse "N/A"
            NodeRequired  = $pkg.engines.node | Get-OrElse "Not specified"
            NodeCurrent   = $script:CurrentNodeVersion | Get-OrElse "N/A"
            NpmCurrent    = $script:CurrentNpmVersion | Get-OrElse "N/A"
            GitBranch     = $gitBranch
            GitStatus     = $gitStatus
            EnvFiles      = if ($presentEnvFiles) { $presentEnvFiles -join ', ' } else { 'None found' }
            DepsProd      = ($pkg.dependencies.PSObject.Properties).Count
            DepsDev       = ($pkg.devDependencies.PSObject.Properties).Count
        }

        Write-Host ""
        Write-Host "$($script:ANSI.BoldCyan)=== Project Information ===$($script:ANSI.Reset)"
        Write-Host "Name:              $($script:ANSI.Green)$($projectInfo.Name)$($script:ANSI.Reset)"
        Write-Host "Version:           $($script:ANSI.Green)$($projectInfo.Version)$($script:ANSI.Reset)"
        Write-Host "Node Required:     $($script:ANSI.Green)$($projectInfo.NodeRequired)$($script:ANSI.Reset)"
        Write-Host "Node Current:      $($script:ANSI.Green)$($projectInfo.NodeCurrent)$($script:ANSI.Reset)"
        Write-Host "Npm Current:       $($script:ANSI.Green)$($projectInfo.NpmCurrent)$($script:ANSI.Reset)"
        Write-Host "Git Branch:        $($script:ANSI.Green)$($projectInfo.GitBranch)$($script:ANSI.Reset)"
        Write-Host "Git Status:        $($script:ANSI.Green)$($projectInfo.GitStatus)$($script:ANSI.Reset)"
        Write-Host "Environment Files: $($script:ANSI.Green)$($projectInfo.EnvFiles)$($script:ANSI.Reset)"
        Write-Host "Production Deps:   $($script:ANSI.Green)$($projectInfo.DepsProd)$($script:ANSI.Reset)"
        Write-Host "Development Deps:  $($script:ANSI.Green)$($projectInfo.DepsDev)$($script:ANSI.Reset)"
        Write-Host "$($script:ANSI.Reset)"
    }
    catch {
        Write-Log "Failed to gather project information: $($_.Exception.Message)" "ERROR"
    }
}
