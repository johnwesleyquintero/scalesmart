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
BUILD_ARTIFACTS=(${BUILD_ARTIFACTS:-(".next" ".vercel" "node_modules" "package-lock.json" "coverage" ".nyc_output" "storybook-static" "dist" "out")})
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
    local i # loop counter
    clear

    # Box drawing characters (current ones are good, mostly double-lined)
    local border_top="╔$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╗"
    local border_middle="╠$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╣"
    local border_thin_sep="╟$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '─')╢"
    local border_bottom="╚$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╝"

    # Header
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_top}${ANSI_Reset}"
    local title_core="Wescore Project Cli v${VERSION}"
    local title_len=${#title_core}
    local total_padding=$((CONTENT_WIDTH - title_len))
    local pad_left=$((total_padding / 2))
    local pad_right=$((total_padding - pad_left))
    local title_line
    title_line=$(printf "%*s%s%s%s%*s" "$pad_left" "" "${ANSI_Bold}${ANSI_Yellow}" "$title_core" "${ANSI_Cyan}" "$pad_right" "")
    echo -e "║${title_line}${ANSI_Reset}║" # Outer ANSI_Reset for safety
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
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}1) ${ANSI_Reset}Install Dependencies     ${ANSI_Yellow}[i]${ANSI_Reset} - Setup project packages"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}6) ${ANSI_Reset}Start Dev Server        ${ANSI_Yellow}[d]${ANSI_Reset} - Run development environment"

    # Testing & Quality Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Testing & Quality"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}2) ${ANSI_Reset}Run Tests              ${ANSI_Yellow}[t]${ANSI_Reset} - Execute test suite"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}7) ${ANSI_Reset}Run Code Checks        ${ANSI_Yellow}[c]${ANSI_Reset} - Lint and analyze code"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}8) ${ANSI_Reset}Security Audit         ${ANSI_Yellow}[a]${ANSI_Reset} - Check dependencies"

    # Build & Maintenance Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Build & Maintenance"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}3) ${ANSI_Reset}Build Project          ${ANSI_Yellow}[b]${ANSI_Reset} - Create production build"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}4) ${ANSI_Reset}Clean Artifacts        ${ANSI_Yellow}[x]${ANSI_Reset} - Remove build files"

    # Monitoring Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Monitoring"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}5) ${ANSI_Reset}Project Status         ${ANSI_Yellow}[s]${ANSI_Reset} - View dependencies"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}11)${ANSI_Reset} Project Tracker        ${ANSI_Yellow}[u]${ANSI_Reset} - View & Add to Tracker Log"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}9) ${ANSI_Reset}View Logs              ${ANSI_Yellow}[l]${ANSI_Reset} - Check system logs"

    # Commit Generator
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Git"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}12)${ANSI_Reset} Generate Commit        ${ANSI_Yellow}[g]${ANSI_Reset} - Create commit message only"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}13)${ANSI_Reset} Commit & Push All      ${ANSI_Yellow}[p]${ANSI_Reset} - Stage all, commit, and push"

    # Security Section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Security"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}14)${ANSI_Reset} Generate Secret Key    ${ANSI_Yellow}[k]${ANSI_Reset} - Generate a secure key"

    # Exit Option
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Exit" "${ANSI_Red}" # Use Red for Exit section
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Red}10)${ANSI_Reset} Exit                   ${ANSI_Yellow}[q]${ANSI_Reset} - Quit application"

    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_bottom}${ANSI_Reset}"
    echo -e "${ANSI_Yellow}  Use number or shortcut key in [brackets]${ANSI_Reset}"
}

generate_secret_key() {
    local secret_key=$(openssl rand -hex 32)
    echo -e "${ANSI_Bold}${ANSI_Green}Generated Secret Key:${ANSI_Reset} $secret_key"
    echo "$secret_key" | clip
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Secret key copied to clipboard!"
}

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

    # Generate commit message
    if ! generate_commit_message; then
        # generate_commit_message already logs errors and prints messages if it fails (e.g. empty custom type)
        log_warn "Commit message generation was cancelled or failed." "commit_and_push"
        echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Commit message generation aborted. Nothing committed."
        return 1 # generate_commit_message returned non-zero
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
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Failed to commit. Check Git output above. Aborting push."
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

# --- Main Execution ---
main() {
    validate_environment


    while true; do
        show_menu
        echo -e "${ANSI_Bold}${ANSI_Yellow}› ${ANSI_Reset}\c"
        read -r choice
        choice=$(echo "$choice" | tr '[:upper:]' '[:lower:]')

        case $choice in
            1|"i") {
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
                # Cleanup temporary log
                # Do not delete .cli.log
            } ;;
            2|"t") {
                # Overwrite .cli.log
                log_info "Running tests..."
                # Logging now goes to centralized log file
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
                # Check if the test log contains any warnings or errors
                if grep -q -i "warn" .cli.log; then
                    log_warn "npm test completed with warnings. Check .cli.log for details."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} npm test completed with warnings. Check .cli.log for details."
                fi
                if grep -q -i "error" .cli.log; then
                    log_error "npm test completed with errors. Check .cli.log for details." "$test_command"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} npm test completed with errors. Check .cli.log for details."
                fi
                log_info "Tests completed. Check .cli.log for details."
                # Do not delete .cli.log
            } ;;
            3|"b") { npm run build ;} ;;
            4|"x") clean_artifacts ;;
            5|"s") npm list ;;
            6|"d") npm run dev ;;
            7|"c") {
                log_info "Running code checks..."
                # Logging now goes to centralized log file
                # Enhanced error parsing with timestamps and command context
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
                # Check if the check log contains any warnings or errors
                if grep -q -i "warn" .cli.log; then
                    log_warn "npm run check completed with warnings. Check .cli.log for details."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} npm run check completed with warnings. Check .cli.log for details."
                fi
                if grep -q -i "error" .cli.log; then
                    log_error "npm run check completed with errors. Check .cli.log for details." "$check_command"
                    echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} npm run check completed with errors. Check .cli.log for details."
                fi
                log_info "Code checks completed. Check .cli.log for details."
                # Do not delete .cli.log
            } ;;
            8|"a") { npm audit ;} ;;
            9|"l") cat "$LOG_FILE" ;;
            10|"q") exit 0 ;;
            11|"u") { # Project Tracker
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
            12|"g") {
                log_info "Generating commit message..."
                generate_commit_message
            } ;;
            13|"p") { # New: Commit & Push
                log_info "Starting Commit & Push All..."
                commit_and_push
            } ;;
            14|"k") { # Renumbered: Generate Secret Key
                log_info "Generating secret key..."
                generate_secret_key
            } ;;
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
        Write-Host "Name:              $($script:ANSI.Green)$($projectInfo.Name)$($
