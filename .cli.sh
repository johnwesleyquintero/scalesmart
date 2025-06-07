#!/usr/bin/env bash

set -euo pipefail # Exit immediately if a command exits with a non-zero status (-e), treat unset variables as an error (-u), and propagate errors through pipes (-o pipefail)

# --- Function to load configuration from file ---
load_config() {
  local config_file="$CONFIG_FILE_PATH" # Use the global config path variable
  if [ -f "$config_file" ]; then
    log_info "Loading configuration from $config_file"
    while IFS='=' read -r key_raw value_raw || [[ -n "$key_raw" ]]; do # Process last line even if no newline
      local key
      key=$(echo "$key_raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

      # Skip empty lines or comments
      if [[ -z "$key" ]] || [[ "$key" =~ ^# ]]; then
        continue
      fi

      local value
      value=$(echo "$value_raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//') # Trim whitespace from raw value

      # Check if the value is quoted. If so, strip quotes. If not, remove trailing comments.
      if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
          # It's quoted, remove one layer of quotes
          value=$(echo "$value" | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
      else
          # Not quoted, remove trailing comments (e.g., MY_VAR=value # inline comment)
          value=$(echo "$value" | sed 's/[[:space:]]*#.*//')
      fi


      # Only set variables that are not empty and are valid bash exportable names
      if [ -n "$key" ] && [[ "$key" =~ ^[A-Za-z_][A-Za-z0-9_]*$ ]]; then
        if [ -n "$value" ]; then # Allow empty values if user explicitly sets them
          export "$key"="$value"
          log_info "Config loaded: $key"
        else # Handle case where value becomes empty after processing
          export "$key"=""
          log_info "Config loaded: $key (empty value)"
        fi
      elif [ -n "$key" ]; then
        log_warn "Skipping invalid or non-exportable config key: '$key'"
      fi
    done < "$config_file"
  else
    log_info "Configuration file '$config_file' not found. Using default settings."
  fi
}

# --- Script Configuration (Defaults, can be overridden by .cli.config.sh) ---
OS="$(uname -s)"
VERSION="1.2.1" # Incremented version for refinements
LOG_FILE="${LOG_FILE:-./.cli.log}" # Project-local log file
TRACKER_FILE="${TRACKER_FILE:-./.cli_project_tracker.log}" # Project-local tracker
REQUIRED_NODE_VERSION="${REQUIRED_NODE_VERSION:-16.0.0}"
REQUIRED_NPM_VERSION="${REQUIRED_NPM_VERSION:-9.0.0}"
# Ensure arrays are properly initialized, possibly from config
# For arrays from config, load_config would need to handle them specifically, e.g. by space-separated strings
# Current load_config handles simple key=value pairs. For arrays, you might need:
# BUILD_ARTIFACTS_STR="${BUILD_ARTIFACTS_STR:-".next .vercel node_modules coverage .nyc_output storybook-static dist out"}"
# read -r -a BUILD_ARTIFACTS <<< "$BUILD_ARTIFACTS_STR"
# For simplicity, keeping direct array initialization here. Config can override individual string vars.
BUILD_ARTIFACTS=(".next" ".vercel" "node_modules" "coverage" ".nyc_output" "storybook-static" "dist" "out")
LOG_PATTERNS=("*.cli.log" "*.tmp" "*.temp" "*.bak" "*.cache" "*.command_output.log")
REQUIRED_PROJECT_FILES=("package.json" "tsconfig.json" "next.config.js")

GENERATED_COMMIT_MESSAGE="" # For sharing commit message between functions
CONFIG_FILE_PATH=".cli.config.sh" # Standardized name (was .cli.config.sh in load_config)

# Maximum log file size in bytes (5MB)
MAX_LOG_SIZE=5242880
COMMAND_TIMEOUT=300 # Default command timeout in seconds
CONTENT_WIDTH=68 # Define a consistent width for menu content
CMD_TEMP_LOG=".cli.command_output.log" # Temp file for individual command outputs

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

# --- Logging Functions ---
rotate_log() {
    local log_file_to_rotate="$1"
    # Check if file exists and is a regular file, then check size
    if [[ -f "$log_file_to_rotate" ]] && \
       [[ $(stat -f%z "$log_file_to_rotate" 2>/dev/null || stat -c%s "$log_file_to_rotate" 2>/dev/null) -gt $MAX_LOG_SIZE ]]; then
        local timestamp
        timestamp=$(date +"%Y%m%d_%H%M%S")
        mv "$log_file_to_rotate" "${log_file_to_rotate}.${timestamp}.bak"
        # Log this rotation to the *new* log file
        local new_log_message
        new_log_message="$(date +'%Y-%m-%d %T') [INFO] Rotated log file: ${log_file_to_rotate} -> ${log_file_to_rotate}.${timestamp}.bak"
        echo -e "$new_log_message" >> "$log_file_to_rotate" # This creates the new log file with the rotation message
    fi
}

log() {
    local level="$1"
    local message="$2"
    local timestamp
    timestamp=$(date +'%Y-%m-%d %T')

    # Ensure log directory exists
    local log_dir
    log_dir=$(dirname "$LOG_FILE")
    if [[ ! -d "$log_dir" ]]; then
        mkdir -p "$log_dir"
    fi

    # Rotate logs if needed BEFORE writing the new message
    rotate_log "$LOG_FILE"

    echo -e "${timestamp} [${level}] ${message}" >> "$LOG_FILE"
}

log_info() {
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $1"
    log "INFO" "$1"
}

log_warn() {
    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} $1"
    log "WARN" "$1"
}

log_error() {
    local message="$1"
    local command_executed="${2:-N/A}"
    local exit_code="${3:-N/A}"
    local timestamp
    timestamp=$(date +'%Y-%m-%d %T')
    local file=""
    local line=""
    local error_message=""

    # Try to determine file and line from caller
    local caller_info
    caller_info=($(caller 0)) # Format: LINENO SCRIPT_NAME [FUNCTION_NAME]
    line="${caller_info[0]}"
    file="$(realpath "${caller_info[1]}" 2>/dev/null || echo "${caller_info[1]}")" # Full path to script
    error_message="$message" # Default error message is the input message

    # Attempt to parse file, line, and error_message from the $message string itself
    # This is useful if $message is e.g. a compiler error like "source.c:123: some error"
    if [[ "$message" =~ ^([^:]+):([0-9]+):[[:space:]]*(.*)$ ]]; then
        local parsed_file="${BASH_REMATCH[1]}"
        local parsed_line="${BASH_REMATCH[2]}"
        local parsed_msg="${BASH_REMATCH[3]}"
        # Basic check if parsed_file looks like a path - could be more sophisticated
        if [[ -f "$parsed_file" || "$parsed_file" == *"/"* || "$parsed_file" == *"$OS_EXT"* ]]; then
            file="$(realpath "$parsed_file" 2>/dev/null || echo "$parsed_file")"
            line="$parsed_line"
            error_message="$parsed_msg"
        fi
    fi

    local formatted_message="${ANSI_Red}[ERROR]${ANSI_Reset} ${timestamp} - ${file}:${line} - ${error_message}"
    echo -e "$formatted_message"
    log "ERROR" "In ${file}:${line} - ${error_message} (Command: ${command_executed}, Exit Code: ${exit_code})"


    local code_snippet=""
    local context_lines=3
    if [[ -f "$file" && -r "$file" ]]; then
        local start_line=$((line > context_lines ? line - context_lines : 1))
        local end_line=$((line + context_lines))
        local total_lines
        total_lines=$(wc -l < "$file" 2>/dev/null || echo 0)
        total_lines=${total_lines//[^0-9]/} # Ensure it's a number

        if [[ "$total_lines" -gt 0 ]]; then
            end_line=$((end_line > total_lines ? total_lines : end_line))
            # Ensure start_line is not greater than end_line
            [[ $start_line -gt $end_line ]] && start_line=$end_line

            code_snippet=$(sed -n "${start_line},${end_line}p" "$file" 2>/dev/null | 
                           awk -v s_line="$start_line" -v err_line="$line" '{
                               prefix = "    ";
                               current_nr = NR + s_line - 1;
                               if (current_nr == err_line) { prefix = "--> "; }
                               printf "%s%4d: %s\n", prefix, current_nr, $0;
                           }')
            if [[ -z "$code_snippet" ]]; then
                 code_snippet="    (Could not retrieve code snippet for $file:$line)"
            fi
        else
            code_snippet="    (File is empty or has no lines: $file)"
        fi
        log "ERROR" "Context:\n${code_snippet}"
    fi
    return 1 # Consistent return for error
}

# Load configuration (after logging functions are defined, so load_config can log)
load_config

# --- Cleanup and Spinner ---
cleanup() {
    local exit_status=$? # Capture the exit status of the last command
    stop_spinner
    echo -e "\n${ANSI_Yellow}[INFO]${ANSI_Reset} Cleaning up and exiting..."
    rm -f "$CMD_TEMP_LOG" # Clean up temporary command output log
    # Add any other specific cleanup tasks here
    
    # If cleanup is triggered by a signal (e.g., Ctrl+C), $? will be 128 + signal_number
    # Otherwise, it's the exit status of the last command.
    # We want to exit with a non-zero status if a signal caused termination.
    if [[ -n "$_CLEANUP_SIGNAL" ]]; then # Check if a signal was caught
        log_warn "Script terminated by signal $_CLEANUP_SIGNAL. Exiting with non-zero status."
        exit $((128 + _CLEANUP_SIGNAL)) # Exit with 128 + signal number
    elif [ "$exit_status" -ne 0 ]; then
        log_warn "Script exiting due to previous error. Exit status: $exit_status."
        exit "$exit_status"
    else
        exit 0
    fi
}

# Trap signals and set a variable to indicate which signal was caught
trap "_CLEANUP_SIGNAL=2; cleanup" SIGINT # SIGINT is typically 2
trap "_CLEANUP_SIGNAL=15; cleanup" SIGTERM # SIGTERM is typically 15

start_spinner() {
    local message="$1"
    echo -ne "${ANSI_Cyan}${message}${ANSI_Reset} "
    echo -ne "\e[?25l" # Hide cursor
    (
        while :; do
            for char in "${spinner_chars[@]}"; do
                echo -ne "\b${char}"
                sleep 0.1
            done
        done
    ) &
    spinner_pid=$!
    disown "$spinner_pid" # Detach from shell job control
}

stop_spinner() {
    if [ -n "$spinner_pid" ] && ps -p "$spinner_pid" > /dev/null; then
        kill "$spinner_pid" >/dev/null 2>&1
        wait "$spinner_pid" 2>/dev/null # Wait for it to actually terminate
    fi
    spinner_pid=""
    echo -ne "\b \b\e[?25h" # Clear spinner char, restore cursor
}

# --- UI Helper Functions ---
strip_ansi() {
    printf "%s" "$1" | sed -E 's/\x1b\[[0-9;]*[mGKHJ]//g'
}

print_bordered_line() {
    local text_with_color="$1"
    local text_no_color
    text_no_color=$(strip_ansi "$text_with_color")
    local visible_len=${#text_no_color}
    local padding_len=$((CONTENT_WIDTH - visible_len))
    ((padding_len < 0)) && padding_len=0
    local padding_str
    padding_str=$(printf "%*s" "$padding_len" "")
    echo -e "║${text_with_color}${padding_str}║"
}

# --- Clipboard Helper ---
copy_to_clipboard() {
    local content_to_copy="$1"
    local success_msg="${2:-Content copied to clipboard!}"
    local error_msg="${3:-Failed to copy. Install xclip/xsel (Linux), or ensure clip (Win)/pbcopy (macOS) is available.}"

    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then # Windows (Git Bash, Cygwin, MSYS)
        if command -v clip >/dev/null 2>&1; then
            echo -n "$content_to_copy" | clip
            log_info "$success_msg"
            echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $success_msg"
            return 0
        fi
    elif [[ "$OS" == "Darwin"* ]]; then # macOS
        if command -v pbcopy >/dev/null 2>&1; then
            echo -n "$content_to_copy" | pbcopy
            log_info "$success_msg"
            echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $success_msg"
            return 0
        fi
    elif [[ "$OS" == "Linux"* ]]; then # Linux
        if command -v xclip >/dev/null 2>&1; then
            echo -n "$content_to_copy" | xclip -selection clipboard
            log_info "$success_msg"
            echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $success_msg"
            return 0
        elif command -v xsel >/dev/null 2>&1; then
            echo -n "$content_to_copy" | xsel --clipboard --input
            log_info "$success_msg"
            echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $success_msg"
            return 0
        fi
    fi
    log_warn "$error_msg (OS: $OS)"
    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} $error_msg"
    return 1
}

# --- Command Execution Helpers ---
run_with_timeout() {
    local cmd="$1"
    local timeout=${2:-$COMMAND_TIMEOUT}
    local description="${3:-Command}"
    local cmd_pid
    
    # Start the command in the background
    eval "$cmd" & cmd_pid=$!

    local count=0
    while kill -0 "$cmd_pid" 2>/dev/null; do
        if [ $count -ge "$timeout" ]; then
            log_warn "${description} is taking too long, attempting to kill (PID: $cmd_pid)..."
            kill -TERM "$cmd_pid" 2>/dev/null # Try graceful termination first
            sleep 2 # Give it a moment
            if kill -0 "$cmd_pid" 2>/dev/null; then # Still alive?
                kill -KILL "$cmd_pid" 2>/dev/null # Force kill
            fi
            log_error "${description} timed out after ${timeout} seconds and was killed." "run_with_timeout"
            return 1 # Timeout error code
        fi
        sleep 1
        ((count++))
    done

    wait "$cmd_pid" # Get the actual exit code
    return $?
}

run_long_command() {
    local cmd_string="$1"
    local spinner_msg="$2"
    local success_msg="$3"
    local failure_msg="$4"
    local log_tag="${5:-${cmd_string%% *}}" # Use first word of command as log tag

    log_info "Executing with spinner: $cmd_string (Description: $spinner_msg)"
    echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} $spinner_msg (this may take a while)..."

    echo "$(date +'%Y-%m-%d %H:%M:%S') - Running command: $cmd_string" > "$CMD_TEMP_LOG" # Overwrite/create

    start_spinner "$spinner_msg..."
    # Execute command, append stdout and stderr to CMD_TEMP_LOG
    if eval "$cmd_string" >> "$CMD_TEMP_LOG" 2>&1; then
        local exit_code=$? # Should be 0 if eval successful path is taken
        stop_spinner
        log_info "$log_tag completed successfully (Spinner: $spinner_msg)."
        echo -e "\n${ANSI_Green}[SUCCESS]${ANSI_Reset} $success_msg"

        if grep -Eqi "(warning|warn)" "$CMD_TEMP_LOG"; then
            log_warn "$log_tag (Spinner: $spinner_msg) finished with warnings. Check $CMD_TEMP_LOG (also copied to main log)."
            echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Command completed with warnings. Details in $LOG_FILE and $CMD_TEMP_LOG."
        fi
        {
            echo "--- Output for: $cmd_string ($spinner_msg) ---"
            cat "$CMD_TEMP_LOG"
            echo "--- End Output ---"
        } >> "$LOG_FILE"
        return 0
    else
        local exit_code=$? # Capture actual exit code of the failed command
        stop_spinner
        log_error "$log_tag (Spinner: $spinner_msg) failed with exit code $exit_code. Check $CMD_TEMP_LOG (also copied to main log)." "$cmd_string" "$exit_code"
        echo -e "\n${ANSI_Red}[ERROR]${ANSI_Reset} $failure_msg (Exit Code: $exit_code). Details in $LOG_FILE and $CMD_TEMP_LOG."
        {
            echo "--- Output for FAILED command: $cmd_string ($spinner_msg) ---"
            cat "$CMD_TEMP_LOG"
            echo "--- End Output for FAILED command ---"
        } >> "$LOG_FILE"
        return "$exit_code" # Return the actual error code
    fi
}

# --- Core Logic Functions ---
validate_environment() {
    local check_cmd
    local node_found=false npm_found=false
    local all_validations_passed=true

    log_info "Starting environment validation..."

    # Check Node.js installation
    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        check_cmd="where node"
    else
        check_cmd="command -v node"
    fi
    if $check_cmd >/dev/null 2>&1; then
        log_info "Node.js executable found."
        node_found=true
    else
        log_error "Node.js not found. Please install Node.js." "validate_environment"
        all_validations_passed=false
    fi

    # Check npm installation
    if [[ "$OS" == "MINGW"* || "$OS" == "CYGWIN"* || "$OS" == "MSYS"* ]]; then
        check_cmd="where npm"
    else
        check_cmd="command -v npm"
    fi
    if $check_cmd >/dev/null 2>&1; then
        log_info "npm executable found."
        npm_found=true
    else
        log_error "npm not found. Please install npm." "validate_environment"
        all_validations_passed=false
    fi

    if ! $node_found || ! $npm_found; then
        echo -e "${ANSI_Red}[FATAL]${ANSI_Reset} Critical tools (Node.js/npm) missing. Environment validation failed. Exiting."
        exit 1
    fi

    local node_version npm_version
    if ! node_version_output=$(run_with_timeout "node -v" 10 "Node.js version check"); then
        log_error "Failed to get Node.js version. Is Node.js working correctly?" "validate_environment"
        all_validations_passed=false
    else
        node_version="${node_version_output#v}" # Remove leading 'v'
    fi

    if ! npm_version=$(run_with_timeout "npm -v" 10 "npm version check"); then
        log_error "Failed to get npm version. Is npm working correctly?" "validate_environment"
        all_validations_passed=false
    fi

    if ! $all_validations_passed; then # If version checks failed or tools not found earlier
        echo -e "${ANSI_Red}[FATAL]${ANSI_Reset} Failed to retrieve tool versions or critical tools missing. Environment validation failed. Exiting."
        exit 1
    fi

    # Compare versions: `printf 'R\nC' | sort -VC` returns 0 if R <= C (i.e., C is GTE R)
    if printf '%s\n%s' "$REQUIRED_NODE_VERSION" "$node_version" | sort -V -C; then
        log_info "Node.js version $node_version meets requirement >= $REQUIRED_NODE_VERSION."
    else
        log_error "Node.js version $node_version is less than required $REQUIRED_NODE_VERSION." "validate_environment"
        all_validations_passed=false
    fi

    if printf '%s\n%s' "$REQUIRED_NPM_VERSION" "$npm_version" | sort -V -C; then
        log_info "npm version $npm_version meets requirement >= $REQUIRED_NPM_VERSION."
    else
        log_error "npm version $npm_version is less than required $REQUIRED_NPM_VERSION." "validate_environment"
        all_validations_passed=false
    fi

    if ! $all_validations_passed; then
        echo -e "${ANSI_Red}[FATAL]${ANSI_Reset} Environment validation failed due to version mismatches or other issues. Exiting."
        exit 1
    fi

    log_info "Environment validation passed successfully."
}

clean_artifacts() {
    log_info "Cleaning build artifacts..."
    local item_cleaned=false
    for artifact in "${BUILD_ARTIFACTS[@]}"; do
        if [[ -e "$artifact" ]]; then
            log_info "Removing $artifact..."
            if rm -rf "$artifact"; then
                log_info "Successfully removed $artifact."
                echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Removed: $artifact"
                item_cleaned=true
            else
                log_error "Failed to remove $artifact." "clean_artifacts"
                echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Failed to remove: $artifact"
            fi
        else
            log_info "Artifact not found (already clean): $artifact"
        fi
    done

    if ! $item_cleaned; then
        log_info "No artifacts found to clean."
        echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} No artifacts found to clean."
    else
        log_info "Build artifacts cleaning process completed."
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Artifacts cleaning complete."
    fi
}

generate_commit_message() {
    local commit_type_input commit_scope commit_description commit_type
    GENERATED_COMMIT_MESSAGE="" # Clear previous message
    local suggested_description=""
    local common_types=("feat" "fix" "chore" "docs" "style" "refactor" "test" "ci" "build" "perf" "revert")

    echo -e "${ANSI_Bold}${ANSI_Yellow}Select Commit Type or enter a custom one:${ANSI_Reset}"
    for i in "${!common_types[@]}"; do
        echo -e "  ${ANSI_Green}$((i+1))) ${common_types[$i]}${ANSI_Reset}"
    done
    echo -e "  ${ANSI_Green}c) Custom type${ANSI_Reset}"
    echo -ne "${ANSI_Bold}${ANSI_Yellow}Your choice (number or custom type): ${ANSI_Reset}"
    read -r commit_type_input

    if [[ "$commit_type_input" =~ ^[0-9]+$ ]] && [ "$commit_type_input" -ge 1 ] && [ "$commit_type_input" -le "${#common_types[@]}" ]; then
        commit_type="${common_types[$((commit_type_input-1))]}"
    elif [[ "$commit_type_input" == "c" ]]; then
        echo -ne "${ANSI_Bold}${ANSI_Yellow}Enter Custom Commit Type: ${ANSI_Reset}"
        read -r commit_type
        commit_type=$(echo "$commit_type" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
        if [ -z "$commit_type" ]; then
            log_error "Custom commit type cannot be empty." "generate_commit_message"
            return 1
        fi
    else
        commit_type=$(echo "$commit_type_input" | tr '[:upper:]' '[:lower:]' | tr -d '[:space:]')
        if [ -z "$commit_type" ]; then
            log_warn "No valid selection or custom type entered, defaulting to 'chore'."
            commit_type="chore"
        fi
    fi
    log_info "Selected commit type: $commit_type"

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
        *) suggested_description="Describe the change: " ;;
    esac

    echo -ne "${ANSI_Bold}${ANSI_Yellow}Commit Scope (optional, e.g., component name): ${ANSI_Reset}"
    read -r commit_scope

    local description_prompt="${ANSI_Bold}${ANSI_Yellow}Commit Description: ${ANSI_Reset}"
    # Use printf for the prompt to avoid issues with -e in read if text starts with '-'
    printf "%s" "$description_prompt"
    # read -e for readline editing, -i for initial text
    read -e -i "$suggested_description" -r commit_description

    if [ -z "$commit_description" ] || [ "$commit_description" == "$suggested_description" ]; then
        log_error "Commit description cannot be empty or just the suggestion placeholder." "generate_commit_message"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Commit description is mandatory and must be more than the placeholder."
        return 1
    fi

    local commit_message="$commit_type"
    if [ -n "$commit_scope" ]; then
        commit_message="$commit_message($commit_scope)"
    fi
    commit_message="$commit_message: $commit_description"
    GENERATED_COMMIT_MESSAGE="$commit_message"

    echo -e "${ANSI_Bold}${ANSI_Green}Generated Commit Message:${ANSI_Reset} $commit_message"
    copy_to_clipboard "$commit_message" "Commit message copied to clipboard!"
    return 0
}

generate_secret_key() {
    local secret_key
    if command -v openssl >/dev/null 2>&1; then
        secret_key=$(openssl rand -hex 32)
        echo -e "${ANSI_Bold}${ANSI_Green}Generated Secret Key:${ANSI_Reset} $secret_key"
        copy_to_clipboard "$secret_key" "Secret key copied to clipboard!"
    else
        log_error "openssl command not found. Cannot generate secret key." "generate_secret_key"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} openssl is required to generate a secret key."
        return 1
    fi
}

# --- Smart Commit Templates & Functions ---
COMMIT_TEMPLATES=(
    "feat(component): add new component for"
    "fix(bug): resolve issue with"
    "docs(readme): update documentation for"
    # ... (rest of templates)
)
QUICK_COMMITS=(
    "quick: minor changes"
    "quick: bug fix"
    # ... (rest of quick commits)
)

smart_commit_message() {
    local commit_message=""
    local template_choice

    echo -e "\n${ANSI_Bold}${ANSI_Yellow}Select Commit Message Mode:${ANSI_Reset}"
    echo -e "  ${ANSI_Green}1)${ANSI_Reset} Detailed Commit (Interactive)"
    echo -e "  ${ANSI_Green}2)${ANSI_Reset} Quick Commit (Predefined short messages)"
    echo -e "  ${ANSI_Green}3)${ANSI_Reset} Use Template (Predefined structures)"
    echo -e "  ${ANSI_Green}4)${ANSI_Reset} AI-Suggested Commit (Basic suggestion from changes)"
    echo -e "  ${ANSI_Green}b)${ANSI_Reset} Back to main menu"
    echo -ne "${ANSI_Bold}${ANSI_Yellow}Your choice (1-4, b): ${ANSI_Reset}"
    read -r template_choice

    case $template_choice in
        1) generate_commit_message ;;
        2) quick_commit ;;
        3) template_commit ;;
        4) ai_suggest_commit ;;
        "b"|"B")
            log_info "User opted out of smart commit message generation."
            return 1 ;; # Indicate cancellation
        *)
            log_error "Invalid choice '$template_choice' in smart commit." "smart_commit_message"
            return 1 ;; # Indicate failure/invalid choice
    esac
    return $? # Propagate success/failure from the chosen function
}

quick_commit() {
    echo -e "\n${ANSI_Bold}${ANSI_Yellow}Select Quick Commit:${ANSI_Reset}"
    for i in "${!QUICK_COMMITS[@]}"; do
        echo -e "  ${ANSI_Green}$((i+1))) ${ANSI_Reset}${QUICK_COMMITS[$i]}"
    done
    echo -ne "${ANSI_Bold}${ANSI_Yellow}Your choice (1-${#QUICK_COMMITS[@]}): ${ANSI_Reset}"
    read -r choice

    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#QUICK_COMMITS[@]}" ]; then
        GENERATED_COMMIT_MESSAGE="${QUICK_COMMITS[$((choice-1))]}"
        log_info "Selected quick commit: $GENERATED_COMMIT_MESSAGE"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Selected quick commit: $GENERATED_COMMIT_MESSAGE"
        return 0
    else
        log_error "Invalid quick commit selection: $choice" "quick_commit"
        return 1
    fi
}

template_commit() {
    echo -e "\n${ANSI_Bold}${ANSI_Yellow}Select Template:${ANSI_Reset}"
    for i in "${!COMMIT_TEMPLATES[@]}"; do
        echo -e "  ${ANSI_Green}$((i+1))) ${ANSI_Reset}${COMMIT_TEMPLATES[$i]}"
    done
    echo -ne "${ANSI_Bold}${ANSI_Yellow}Your choice (1-${#COMMIT_TEMPLATES[@]}): ${ANSI_Reset}"
    read -r choice

    if [[ "$choice" =~ ^[0-9]+$ ]] && [ "$choice" -ge 1 ] && [ "$choice" -le "${#COMMIT_TEMPLATES[@]}" ]; then
        local template="${COMMIT_TEMPLATES[$((choice-1))]}"
        echo -ne "${ANSI_Bold}${ANSI_Yellow}Complete the message: ${template} ${ANSI_Reset}"
        read -r details
        if [ -z "$details" ]; then
            log_error "Details for template commit cannot be empty." "template_commit"
            return 1
        fi
        GENERATED_COMMIT_MESSAGE="$template $details"
        log_info "Generated template commit: $GENERATED_COMMIT_MESSAGE"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Generated commit message: $GENERATED_COMMIT_MESSAGE"
        return 0
    else
        log_error "Invalid template selection: $choice" "template_commit"
        return 1
    fi
}

ai_suggest_commit() {
    echo -e "\n${ANSI_Yellow}[INFO]${ANSI_Reset} Analyzing changes for AI suggestion..."
    if ! command -v git >/dev/null 2>&1; then
        log_error "Git command not found. Cannot generate AI-suggested commit." "ai_suggest_commit"
        return 1
    fi

    local changes
    changes=$(git diff --cached --name-only) # Prefer staged changes
    if [ -z "$changes" ]; then
        changes=$(git diff --name-only HEAD) # If nothing staged, check working directory changes against HEAD
    fi
    if [ -z "$changes" ]; then
        log_warn "No changes detected by git. Cannot suggest a commit message." "ai_suggest_commit"
        echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} No changes to suggest a commit for. Try staging files first."
        return 1 # Or fallback to manual
    fi

    local suggestion="chore: update project files" # Default suggestion
    # Simplified suggestion logic (can be expanded)
    if echo "$changes" | grep -q -E "(\.md|\.txt|README|CONTRIBUTING|LICENSE)"; then suggestion="docs: update documentation files"; fi
    if echo "$changes" | grep -q -E "(package\.json|yarn\.lock|pnpm-lock\.yaml)"; then suggestion="chore(deps): update dependencies"; fi
    if echo "$changes" | grep -q -E "(\.js|\.ts|\.jsx|\.tsx)"; then suggestion="feat: modify script/component files"; fi
    if echo "$changes" | grep -q "src/"; then suggestion="refactor: changes in src directory"; fi
    # More specific rules from original script
    if echo "$changes" | grep -q "supabase/"; then suggestion="db: update database schema or config"; fi
    # ... (add more rules as needed from original)

    echo -e "${ANSI_Bold}${ANSI_Yellow}AI Suggested Commit Message:${ANSI_Reset} $suggestion"
    echo -ne "${ANSI_Bold}${ANSI_Yellow}Use this suggestion? (Y/n) or (e)dit: ${ANSI_Reset}"
    read -r use_suggestion
    use_suggestion=$(echo "$use_suggestion" | tr '[:upper:]' '[:lower:]')

    if [[ "$use_suggestion" == "y" || -z "$use_suggestion" ]]; then
        GENERATED_COMMIT_MESSAGE="$suggestion"
        log_info "Using AI suggestion: $GENERATED_COMMIT_MESSAGE"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Using AI suggestion: $GENERATED_COMMIT_MESSAGE"
        return 0
    elif [[ "$use_suggestion" == "e" ]]; then
        echo -ne "${ANSI_Bold}${ANSI_Yellow}Edit suggestion: ${ANSI_Reset}"
        read -e -i "$suggestion" -r GENERATED_COMMIT_MESSAGE
        if [ -z "$GENERATED_COMMIT_MESSAGE" ]; then
            log_error "Edited commit message cannot be empty." "ai_suggest_commit"
            return 1
        fi
        log_info "Using edited AI suggestion: $GENERATED_COMMIT_MESSAGE"
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Using edited suggestion: $GENERATED_COMMIT_MESSAGE"
        return 0
    else
        log_info "AI suggestion declined. Falling back to detailed commit generation."
        echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} AI suggestion declined. Proceeding to manual commit message generation."
        generate_commit_message
        return $? # Propagate result from generate_commit_message
    fi
}


commit_and_push() {
    log_info "Starting commit and push process..."
    if ! command -v git >/dev/null 2>&1; then
        log_error "Git command not found. Commit and push aborted." "commit_and_push"
        return 1
    fi
    if ! git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        log_error "Not inside a Git repository. Commit and push aborted." "commit_and_push"
        return 1
    fi

    log_info "Staging tracked changes (git add --update)..."
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Staging tracked changes..."
    if ! git add --update; then
        log_error "Failed to stage tracked changes (git add --update)." "commit_and_push"
        return 1
    fi
    log_info "Tracked changes staged successfully."
    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Tracked changes staged."
    
    # Warn about untracked files if any
    if git status --porcelain | grep -q "^??"; then
        log_warn "Untracked files detected. They will NOT be committed. Use 'git add <file>' manually if needed."
        echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Untracked files detected. They will NOT be committed. Stage them manually if needed."
    fi

    # Use smart commit message system
    if ! smart_commit_message; then # This function sets GENERATED_COMMIT_MESSAGE or returns error
        log_warn "Commit message generation was cancelled or failed. Nothing committed." "commit_and_push"
        # No need to print another user message, smart_commit_message handles its own.
        return 1 # Propagate failure/cancellation
    fi

    if [ -z "$GENERATED_COMMIT_MESSAGE" ]; then
        log_error "Commit message is empty after generation process. Aborting commit." "commit_and_push"
        return 1
    fi

    log_info "Committing with message: '$GENERATED_COMMIT_MESSAGE'"
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Committing with message: ${ANSI_Cyan}'$GENERATED_COMMIT_MESSAGE'${ANSI_Reset}"
    if ! git commit -m "$GENERATED_COMMIT_MESSAGE"; then
        log_error "Failed to commit changes." "commit_and_push (git commit)"
        return 1
    fi
    log_info "Changes committed successfully."
    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Changes committed."
    
    # Log to project tracker
    local tracker_log_message="$(date +'%Y-%m-%d %H:%M:%S') - Commit: $GENERATED_COMMIT_MESSAGE"
    echo "$tracker_log_message" >> "$TRACKER_FILE" 2>/dev/null || log_warn "Failed to write to tracker file $TRACKER_FILE"
    rotate_log "$TRACKER_FILE" # Rotate tracker file if needed


    log_info "Pushing changes to remote..."
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Pushing changes to remote..."
    if ! git push; then
        log_error "Failed to push changes." "commit_and_push (git push)"
        return 1
    fi
    log_info "Changes pushed successfully."
    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Changes pushed to remote."

    log_info "Commit and push process completed successfully."
    echo -e "${ANSI_Green}${ANSI_Bold}[SUCCESS]${ANSI_Reset} All changes committed and pushed successfully!"
    return 0
}

reset_project() {
    log_info "Starting project reset..."
    echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Preparing to reset project. This will remove untracked files and caches."
    echo -ne "${ANSI_Bold}${ANSI_Red}ARE YOU SURE you want to reset? (y/N): ${ANSI_Reset}"
    read -r confirmation
    if [[ "${confirmation}" != "y" && "${confirmation}" != "Y" ]]; then
        log_info "Project reset cancelled by user."
        echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Project reset cancelled."
        return 1
    fi

    remove_if_exists() {
        local item_to_remove="$1"
        if [[ -e "$item_to_remove" ]]; then
            log_info "Removing $item_to_remove..."
            if rm -rf "$item_to_remove"; then
                log_info "Successfully removed $item_to_remove."
                echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Removed: $item_to_remove"
            else
                log_error "Failed to remove $item_to_remove." "reset_project (remove_if_exists)"
            fi
        fi
    }

    log_info "Removing build artifacts..."
    for artifact in "${BUILD_ARTIFACTS[@]}"; do remove_if_exists "$artifact"; done

    log_info "Removing lock files..."
    remove_if_exists "package-lock.json"; remove_if_exists "yarn.lock"; remove_if_exists "pnpm-lock.yaml"; remove_if_exists ".pnpm-store"

    log_info "Removing local environment files..."
    remove_if_exists ".env.local"; remove_if_exists ".env.development.local"; remove_if_exists ".env.test.local"; remove_if_exists ".env.production.local"

    if command -v npm >/dev/null 2>&1; then
        log_info "Clearing npm cache..."
        if npm cache clean --force; then log_info "npm cache cleared."; echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} npm cache cleared"; else log_error "Failed to clear npm cache." "reset_project (npm cache clean)"; fi
        log_info "Verifying npm cache..."
        if npm cache verify; then log_info "npm cache verified."; echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} npm cache verified"; else log_error "Failed to verify npm cache." "reset_project (npm cache verify)"; fi
    else
        log_warn "npm command not found, skipping npm cache operations."
    fi

    log_info "Project reset process completed."
    echo -e "${ANSI_Green}${ANSI_Bold}[SUCCESS]${ANSI_Reset} Project reset complete!"
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} You may need to run dependency installation (e.g., npm install) next."
}

setup_dev_environment() {
    log_info "Setting up/checking development environment..."
    local all_ok=true

    local required_tools=("node" "npm" "git") # Assuming git is generally useful
    local missing_tools=()
    for tool in "${required_tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            missing_tools+=("$tool")
            all_ok=false
        fi
    done
    if [ ${#missing_tools[@]} -ne 0 ]; then
        log_error "Missing required tools: ${missing_tools[*]}" "setup_dev_environment"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Please install: ${missing_tools[*]}"
    fi

    local missing_configs=()
    for config_file in "${REQUIRED_PROJECT_FILES[@]}"; do
        if [ ! -f "$config_file" ]; then
            missing_configs+=("$config_file")
            all_ok=false
        fi
    done
    if [ ${#missing_configs[@]} -ne 0 ]; then
        log_error "Missing required project files: ${missing_configs[*]}" "setup_dev_environment"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Missing project files: ${missing_configs[*]}"
    fi

    if [ -d "supabase" ] && ! command -v supabase &> /dev/null; then
        log_warn "Supabase directory exists but Supabase CLI not found." "setup_dev_environment"
        echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Supabase CLI not found. Consider installing with: npm install -g supabase"
        # Do not set all_ok=false for this, it's optional
    fi

    if [ ! -f ".env.local" ] && [ -f ".env.example" ]; then
        log_info ".env.local not found, copying from .env.example..."
        if cp ".env.example" ".env.local"; then
            log_info "Created .env.local from .env.example."
            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Created .env.local from .env.example. Please review it."
        else
            log_error "Failed to copy .env.example to .env.local." "setup_dev_environment"
            all_ok=false
        fi
    elif [ ! -f ".env.local" ] && [ ! -f ".env" ]; then # Also check .env as a fallback
        log_warn ".env.local or .env not found. Some features might not work." "setup_dev_environment"
        echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} No .env.local or .env file found. Consider creating one (e.g., from .env.example or using Vercel env pull)."
    fi

    if [ ! -d "node_modules" ] && [ -f "package.json" ]; then
        log_warn "node_modules directory not found." "setup_dev_environment"
        echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} node_modules directory not found. Run 'Install Dependencies' option."
        # all_ok=false # Not necessarily a failure of setup check, but an indicator for next steps
    fi

    if $all_ok; then
        log_info "Development environment check passed."
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Development environment appears to be set up correctly."
        return 0
    else
        log_error "Development environment setup check failed with one or more issues." "setup_dev_environment"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Development environment has issues. Please check logs."
        return 1
    fi
}

show_project_info() {
    log_info "Displaying project information..."
    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Project Information ===${ANSI_Reset}"
    if [ -f "package.json" ]; then
        local name version description author
        name=$(node -p "require('./package.json').name" 2>/dev/null || echo "N/A")
        version=$(node -p "require('./package.json').version" 2>/dev/null || echo "N/A")
        description=$(node -p "require('./package.json').description" 2>/dev/null || echo "N/A")
        echo -e "${ANSI_Yellow}Project:${ANSI_Reset}     $name"
        echo -e "${ANSI_Yellow}Version:${ANSI_Reset}     $version"
        echo -e "${ANSI_Yellow}Description:${ANSI_Reset} $description"
    else
        echo -e "${ANSI_Yellow}package.json not found.${ANSI_Reset}"
    fi

    if command -v git >/dev/null 2>&1 && git rev-parse --is-inside-work-tree > /dev/null 2>&1; then
        echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Git Status ===${ANSI_Reset}"
        local branch status
        branch=$(git branch --show-current 2>/dev/null || git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
        status=$(git status --porcelain 2>/dev/null)
        echo -e "${ANSI_Yellow}Branch:${ANSI_Reset}      $branch"
        if [ -n "$status" ]; then
            echo -e "${ANSI_Yellow}Status:${ANSI_Reset}      ${ANSI_Red}Uncommitted changes${ANSI_Reset}"
            echo "$status" | while IFS= read -r line; do echo "  $line"; done
        else
            echo -e "${ANSI_Yellow}Status:${ANSI_Reset}      ${ANSI_Green}Clean${ANSI_Reset}"
        fi
    fi

    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Environment ===${ANSI_Reset}"
    echo -e "${ANSI_Yellow}CLI Version:${ANSI_Reset}   $VERSION"
    echo -e "${ANSI_Yellow}OS:${ANSI_Reset}          $OS"
    echo -e "${ANSI_Yellow}Node:${ANSI_Reset}        $(node -v 2>/dev/null || echo 'N/A (Node not found or not working)')"
    echo -e "${ANSI_Yellow}NPM:${ANSI_Reset}         $(npm -v 2>/dev/null || echo 'N/A (npm not found or not working)')"

    echo -e "\n${ANSI_Bold}${ANSI_Cyan}=== Project Structure (Top Level) ===${ANSI_Reset}"
    if command -v tree >/dev/null 2>&1; then
        tree -L 1 -a -I 'node_modules|.git|.next|out|.vercel|coverage|.nyc_output|storybook-static|dist' 2>/dev/null || ls -d .*/ */ | head -n 15
    else
        ls -d .*/ */ | head -n 15 # Fallback: list directories
    fi
}

manage_dev_server() {
    local action="$1"
    local dev_pid_file=".dev-server.pid" # Store in project root

    case "$action" in
        "start")
            if [ -f "$dev_pid_file" ]; then
                local pid
                pid=$(cat "$dev_pid_file")
                if ps -p "$pid" > /dev/null 2>&1; then # Check if process with that PID is running
                    log_warn "Development server is already running (PID: $pid)."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Development server already running (PID: $pid)."
                    return 1
                else
                    log_info "Stale PID file found for dev server. Removing."
                    rm -f "$dev_pid_file"
                fi
            fi
            if [ ! -f "package.json" ] || ! grep -q "\"dev\":" package.json ; then
                log_error "No 'npm run dev' script found in package.json." "manage_dev_server"
                return 1
            fi
            log_info "Starting development server (npm run dev)..."
            echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Starting development server..."
            # Run in background, redirect its output, save PID
            npm run dev > .dev-server.log 2>&1 &
            echo $! > "$dev_pid_file"
            log_info "Development server started (PID: $!). Output logged to .dev-server.log."
            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Development server started (PID: $!). Check .dev-server.log for output."
            ;;
        "stop")
            if [ -f "$dev_pid_file" ]; then
                local pid
                pid=$(cat "$dev_pid_file")
                if ps -p "$pid" > /dev/null 2>&1; then
                    log_info "Stopping development server (PID: $pid)..."
                    kill "$pid"
                    sleep 1 # Give it a moment to shut down
                    if ps -p "$pid" > /dev/null 2>&1; then # Check if still alive
                        log_warn "Dev server (PID: $pid) did not stop gracefully, sending SIGKILL."
                        kill -9 "$pid"
                    fi
                    rm -f "$dev_pid_file"
                    log_info "Development server stopped."
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Development server stopped."
                else
                    log_warn "No running development server found for PID $pid (stale PID file)."
                    echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} No running server found for PID in $dev_pid_file. Removed stale file."
                    rm -f "$dev_pid_file"
                fi
            else
                log_warn "No development server PID file found. Is it running?"
                echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} No development server PID file found."
            fi
            ;;
        "status")
            if [ -f "$dev_pid_file" ]; then
                local pid
                pid=$(cat "$dev_pid_file")
                if ps -p "$pid" > /dev/null 2>&1; then
                    log_info "Development server is running (PID: $pid)."
                    echo -e "${ANSI_Green}[STATUS]${ANSI_Reset} Development server is RUNNING (PID: $pid)."
                else
                    log_info "Development server is not running (stale PID file: $dev_pid_file)."
                    echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} Development server is NOT RUNNING (stale PID file found)."
                    rm -f "$dev_pid_file"
                fi
            else
                log_info "No development server PID file found. Assuming not running."
                echo -e "${ANSI_Yellow}[STATUS]${ANSI_Reset} Development server is NOT RUNNING (no PID file)."
            fi
            ;;
        *) log_error "Invalid action '$action' for manage_dev_server." "manage_dev_server"; return 1;;
    esac
}

manage_database() {
    local action="$1"
    if ! command -v supabase >/dev/null 2>&1; then
        log_error "Supabase CLI not found. Please install it first (npm install -g supabase)." "manage_database"
        return 1
    fi
    if [ ! -d "supabase" ]; then # Check if supabase project files exist
        log_error "Supabase project directory ('supabase') not found in current location." "manage_database"
        echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} This does not appear to be a Supabase project root."
        return 1
    fi

    case "$action" in
        "start") run_long_command "supabase start" "Starting Supabase local services" "Supabase services started." "Failed to start Supabase." "supabase-start" ;;
        "stop") run_long_command "supabase stop --no-backup" "Stopping Supabase local services" "Supabase services stopped." "Failed to stop Supabase." "supabase-stop" ;; # --no-backup often desired for quick stops
        "status") supabase status ;; # Status is usually quick and informative directly
        "reset") run_long_command "supabase db reset" "Resetting Supabase local database" "Supabase database reset." "Failed to reset Supabase database." "supabase-db-reset" ;;
        *) log_error "Invalid action '$action' for manage_database." "manage_database"; return 1;;
    esac
}

manage_vercel() {
    local action="$1"
    if ! command -v vercel >/dev/null 2>&1; then
        echo -ne "${ANSI_Yellow}[ACTION]${ANSI_Reset} Vercel CLI not found. Attempt to install globally? (y/N): "
        read -r install_choice
        if [[ "$install_choice" == "y" || "$install_choice" == "Y" ]]; then
            if ! run_long_command "npm install -g vercel" "Installing Vercel CLI" "Vercel CLI installed." "Failed to install Vercel CLI."; then
                log_error "Failed to install Vercel CLI. Aborting Vercel operation." "manage_vercel"
                return 1
            fi
        else
            log_error "Vercel CLI not found and not installed. Aborting Vercel operation." "manage_vercel"
            return 1
        fi
    fi

    case "$action" in
        "deploy") run_long_command "vercel deploy --prod" "Deploying to Vercel (production)" "Deployment to Vercel initiated." "Vercel deployment failed." "vercel-deploy" ;;
        "env-pull")
            log_info "Pulling environment variables from Vercel for current project/branch..."
            local env_target_file=".env.local" # Default target
            if [ -f "$env_target_file" ]; then
                local backup_file="${env_target_file}.backup.$(date +"%Y%m%d_%H%M%S")"
                log_info "Backing up existing $env_target_file to $backup_file"
                cp "$env_target_file" "$backup_file"
            fi
            if vercel env pull "$env_target_file"; then # Vercel CLI handles prompts
                log_info "Vercel environment variables pulled to $env_target_file."
                echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Environment variables pulled to $env_target_file."
            else
                log_error "Failed to pull Vercel environment variables." "manage_vercel (env-pull)"
                if [ -f "$backup_file" ]; then
                    log_info "Restoring $env_target_file from backup $backup_file."
                    mv "$backup_file" "$env_target_file"
                    echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} Restored $env_target_file from backup."
                fi
                return 1
            fi
            ;;
        "env-push")
            log_info "Pushing environment variables from .env.local to Vercel (production)..."
            if [ ! -f ".env.local" ]; then
                log_error ".env.local file not found. Cannot push." "manage_vercel (env-push)"
                return 1
            fi
            log_info "Pushing environment variables from .env.local to Vercel (production)..."
            if [ ! -f ".env.local" ]; then
                log_error ".env.local file not found. Cannot push." "manage_vercel (env-push)"
                return 1
            fi

            echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} You are about to push ALL variables from .env.local to Vercel Production."
            echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Ensure no sensitive local-only variables are present in .env.local."
            echo -ne "${ANSI_Bold}${ANSI_Red}ARE YOU SURE you want to proceed? (y/N): ${ANSI_Reset}"
            read -r confirmation
            if [[ "${confirmation}" != "y" && "${confirmation}" != "Y" ]]; then
                log_info "Vercel env push cancelled by user."
                echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Vercel environment variable push cancelled."
                return 1
            fi

            echo -e "${ANSI_Yellow}[INFO]${ANSI_Reset} Reading from .env.local to push to Vercel Production environment."
            local pushed_count=0
            local failed_count=0
            while IFS='=' read -r key_raw value_raw || [[ -n "$key_raw" ]]; do
                local key
                key=$(echo "$key_raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//')

                if [[ "$key" =~ ^#.*$ ]] || [[ -z "$key" ]]; then continue; fi

                local value
                # Robustly handle quoted values and comments for .env.local
                value=$(echo "$value_raw" | sed -e 's/^[[:space:]]*//' -e 's/[[:space:]]*$//') # Trim whitespace from raw value
                if [[ "$value" =~ ^\".*\"$ ]] || [[ "$value" =~ ^\'.*\'$ ]]; then
                    value=$(echo "$value" | sed -e 's/^"\(.*\)"$/\1/' -e "s/^'\(.*\)'$/\1/")
                else
                    value=$(echo "$value" | sed 's/[[:space:]]*#.*//')
                fi

                if [ -n "$key" ]; then
                    echo -e "${ANSI_Cyan}[ACTION]${ANSI_Reset} Adding/Updating Vercel env var ${ANSI_Bold}'$key'${ANSI_Reset} for production..."
                    # Use printf %q to properly quote the value for the shell command
                    # This ensures spaces and special characters are handled correctly by vercel env add
                    local quoted_value
                    printf -v quoted_value '%q' "$value"
                    
                    if vercel env add "$key" "$quoted_value" production; then
                        log_info "Successfully added/updated Vercel env var: $key (production)"
                        echo -e "${ANSI_Green}OK${ANSI_Reset}"
                        ((pushed_count++))
                    else
                        log_error "Failed to add/update Vercel env var: $key. It might require confirmation or already exist with a different type." "manage_vercel (env-push)"
                        echo -e "${ANSI_Red}Failed for $key. Check Vercel output/dashboard.${ANSI_Reset}"
                        ((failed_count++))
                    fi
                fi
            done < ".env.local"
            log_info "$pushed_count variables successfully pushed, $failed_count failed for Vercel env push."
            if [ "$failed_count" -eq 0 ]; then
                echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Environment variable push process completed. $pushed_count variables pushed."
            else
                echo -e "${ANSI_Red}[ERROR]${ANSI_Reset} Environment variable push process completed with errors. $pushed_count variables pushed, $failed_count failed."
                return 1
            fi
            ;;
        "login") vercel login ;;
        "logout") vercel logout ;;
        *) log_error "Invalid action '$action' for manage_vercel." "manage_vercel"; return 1;;
    esac
}

create_default_env() {
    local env_file=".env.local"
    log_info "Creating default $env_file..."
    if [ -f "$env_file" ]; then
        echo -ne "${ANSI_Yellow}[WARN]${ANSI_Reset} $env_file already exists. Overwrite with template? (y/N): "
        read -r overwrite_choice
        if [[ "$overwrite_choice" != "y" && "$overwrite_choice" != "Y" ]]; then
            log_info "User chose not to overwrite $env_file."
            echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} $env_file not overwritten."
            return 1
        fi
    fi

    # Using the .env.example pattern is more robust than hardcoding values here
    if [ -f ".env.example" ]; then
        if cp ".env.example" "$env_file"; then
            log_info "Created $env_file from .env.example."
            echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Created $env_file from .env.example. Please review and fill in the values."
        else
            log_error "Failed to copy .env.example to $env_file." "create_default_env"
        fi
    else
        log_warn ".env.example not found. Creating a very basic $env_file."
        cat > "$env_file" << EOL
# Basic .env.local created by CLI
# Please add your project-specific variables here.
# Example:
# DATABASE_URL="your_database_url_here"
# API_KEY="your_api_key_here"

NEXT_PUBLIC_APP_URL="http://localhost:3000"
EOL
        log_info "Created basic $env_file. Please customize it."
        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Created a basic $env_file. Please customize it."
    fi
    echo -e "${ANSI_Cyan}[INFO]${ANSI_Reset} Remember to update placeholder values in $env_file and DO NOT commit it if it contains secrets."
}

# --- Interactive Menu ---
show_menu() {
    clear
    local border_top="╔$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╗"
    local border_middle="╠$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╣"
    local border_thin_sep="╟$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '─')╢"
    local border_bottom="╚$(printf '%*s' "$CONTENT_WIDTH" '' | tr ' ' '═')╝"

    local title_core="WesCLI v${VERSION}"
    local title_len=${#title_core}
    local total_padding=$((CONTENT_WIDTH - title_len))
    local pad_left=$((total_padding / 2))
    local pad_right=$((total_padding - pad_left))
    local title_line
    title_line=$(printf "%*s%s%s%s%*s" "$pad_left" "" "${ANSI_Bold}${ANSI_Yellow}" "$title_core" "${ANSI_Cyan}" "$pad_right" "")
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_top}${ANSI_Reset}"
    echo -e "║${title_line}${ANSI_Reset}║"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"

    print_section_title() {
        local core_title="$1"; local color="${2:-${ANSI_Blue}}"
        local title_text_len=${#core_title}
        local total_sec_padding=$((CONTENT_WIDTH - title_text_len)); local pad_sec_left=$((total_sec_padding / 2)); local pad_sec_right=$((total_sec_padding - pad_sec_left))
        local section_line_content; section_line_content=$(printf "%*s%s%s%s%*s" "$pad_sec_left" "" "${ANSI_Bold}${color}" "$core_title" "${ANSI_Reset}" "$pad_sec_right" "")
        echo -e "║${section_line_content}║"
    }

    # Sections and items... (Copied from original, ensure keys match main loop)
    print_section_title "Development"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_thin_sep}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[e]${ANSI_Reset} Setup/Check Env       - Check/setup dev environment"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[i]${ANSI_Reset} Install Dependencies    - Setup project packages"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[d]${ANSI_Reset} Dev Server              - Manage development server"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[b]${ANSI_Reset} Database (Supabase)     - Manage local Supabase"

    print_section_title "Testing & Quality"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[t]${ANSI_Reset} Run Tests               - Execute test suite (npm test)"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[c]${ANSI_Reset} Run Code Checks         - Lint & analyze (npm run check)"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[a]${ANSI_Reset} Security Audit          - Check deps (npm audit)"

    print_section_title "Build & Maintenance"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[w]${ANSI_Reset} Build Project           - Create prod build (npm run build)"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[x]${ANSI_Reset} Clean Artifacts         - Remove build/cache files"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[r]${ANSI_Reset} Reset Project           - Clean slate (remove artifacts, caches)"

    print_section_title "Utilities & Info"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[s]${ANSI_Reset} Project Status          - View project info & versions"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[u]${ANSI_Reset} Project Tracker         - View & Add to Tracker Log"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[l]${ANSI_Reset} View CLI Logs           - Display $LOG_FILE"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[k]${ANSI_Reset} Generate Secret Key     - Generate a secure key (openssl)"

    print_section_title "Git & Vercel"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[g]${ANSI_Reset} Generate Commit Msg     - Interactive commit message"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[p]${ANSI_Reset} Smart Commit & Push     - Stage, commit, and push"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[v]${ANSI_Reset} Vercel Deployment       - Deploy, Login/Logout"
    print_bordered_line " ${ANSI_Bold}${ANSI_Green}[m]${ANSI_Reset} Vercel Env Vars         - Pull/Push Vercel env, create .env.local"
    
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_middle}${ANSI_Reset}"
    print_section_title "Exit" "${ANSI_Red}"
    print_bordered_line " ${ANSI_Bold}${ANSI_Red}[q]${ANSI_Reset} Exit                    - Quit application"
    echo -e "${ANSI_Bold}${ANSI_Cyan}${border_bottom}${ANSI_Reset}"
    echo -e "${ANSI_Yellow}  Enter shortcut key (e.g., 'e', 'i', 'q')...${ANSI_Reset}"
}


# --- Main Execution ---
main() {
    log_info "CLI Started. Version: $VERSION. OS: $OS. Log File: $LOG_FILE"
    validate_environment # This will exit if validation fails

    while true; do
        show_menu
        echo -ne "${ANSI_Bold}${ANSI_Yellow}› ${ANSI_Reset}"
        read -r choice
        choice=$(echo "$choice" | tr '[:upper:]' '[:lower:]') # Case-insensitive

        # Add a small delay or clear before action output for better UX
        # clear # Or just some newlines
        echo ""

        case $choice in
            "e") setup_dev_environment ;;
            "i") 
                if ! run_long_command "npm install --legacy-peer-deps" \
                    "Installing dependencies" \
                    "Dependencies installed successfully." \
                    "Dependency installation failed."; then
                    # run_long_command handles logging and error messages.
                    # Script will now return to menu instead of exiting.
                    log_error "Dependency installation failed. Returning to menu." "main_loop (npm install)"
                fi
                # Post-install verification (optional, can be part of run_long_command if generalized)
                if [ -d "node_modules" ]; then
                    log_info "Verifying package integrity (npm ls --depth=0)..."
                    if npm ls --depth=0 > "$CMD_TEMP_LOG" 2>&1; then
                        log_info "npm ls verification passed."
                        echo -e "${ANSI_Green}[INFO]${ANSI_Reset} Package verification (npm ls) passed."
                    else
                        log_warn "npm ls verification reported issues. Check $CMD_TEMP_LOG and $LOG_FILE."
                        echo -e "${ANSI_Yellow}[WARN]${ANSI_Reset} Package verification (npm ls) reported issues."
                        cat "$CMD_TEMP_LOG" >> "$LOG_FILE" # Append npm ls output
                    fi
                fi
                ;;
            "d")
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Dev Server Management${ANSI_Reset}"
                echo -e "  1) Start server"
                echo -e "  2) Stop server"
                echo -e "  3) Check status"
                echo -e "  b) Back"
                echo -ne "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}"
                read -r server_choice
                case $server_choice in
                    1) manage_dev_server "start" ;;
                    2) manage_dev_server "stop" ;;
                    3) manage_dev_server "status" ;;
                    "b"|"B") ;;
                    *) log_error "Invalid choice '$server_choice' for Dev Server." "main_loop" ;;
                esac
                ;;
            "b")
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Database (Supabase) Management${ANSI_Reset}"
                echo -e "  1) Start local database"
                echo -e "  2) Stop local database"
                echo -e "  3) Check status"
                echo -e "  4) Reset database"
                echo -e "  b) Back"
                echo -ne "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}"
                read -r db_choice
                case $db_choice in
                    1) manage_database "start" ;;
                    2) manage_database "stop" ;;
                    3) manage_database "status" ;;
                    4) manage_database "reset" ;;
                    "b"|"B") ;;
                    *) log_error "Invalid choice '$db_choice' for Database." "main_loop" ;;
                esac
                ;;
            "t")
                if ! run_long_command "npm test" \
                    "Running tests" \
                    "Tests completed." \
                    "Tests failed or encountered errors."; then
                    log_error "Tests failed or encountered errors. Returning to menu." "main_loop (npm test)"
                fi
                ;;
            "c")
                if ! run_long_command "npm run check" \
                    "Running code checks" \
                    "Code checks completed." \
                    "Code checks failed or found issues."; then
                    log_error "Code checks failed or found issues. Returning to menu." "main_loop (npm run check)"
                fi
                ;;
            "a") # Security Audit - typically interactive, direct output is fine
                log_info "Running security audit (npm audit)..."
                echo -e "${ANSI_Yellow}[ACTION]${ANSI_Reset} Running npm audit. Review output for vulnerabilities..."
                if npm audit; then
                    log_info "npm audit completed. No high/critical vulnerabilities or audit passed."
                    echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} npm audit check passed or found no new high/critical issues."
                else
                    local audit_exit_code=$?
                    log_warn "npm audit found vulnerabilities or failed (Exit Code: $audit_exit_code). Please review the output."
                    echo -e "${ANSI_Red}[WARN]${ANSI_Reset} npm audit found issues or failed. Review output above."
                    # Do not exit for audit failures typically, user needs to assess
                fi
                ;;
            "w")
                if ! run_long_command "npm run build" \
                    "Building project" \
                    "Project built successfully." \
                    "Project build failed."; then
                    log_error "Project build failed. Returning to menu." "main_loop (npm run build)"
                fi
                ;;
            "x") clean_artifacts ;;
            "r") reset_project ;;
            "s") show_project_info ;;
            "u")
                log_info "Accessing Project Tracker ($TRACKER_FILE)..."
                echo -e "\n${ANSI_Bold}${ANSI_Magenta}--- Project Tracker ---${ANSI_Reset}"
                if [[ -f "$TRACKER_FILE" && -s "$TRACKER_FILE" ]]; then
                    echo -e "${ANSI_Yellow}Recent Entries (last 15):${ANSI_Reset}"
                    tail -n 15 "$TRACKER_FILE"; echo ""
                else
                    echo -e "${ANSI_Cyan}Tracker is currently empty.${ANSI_Reset}"
                fi
                echo -ne "${ANSI_Bold}${ANSI_Yellow}Add new entry? (y/N): ${ANSI_Reset}"
                read -r add_choice
                if [[ "$add_choice" == "y" || "$add_choice" == "Y" ]]; then
                    echo -ne "${ANSI_Bold}${ANSI_Yellow}Enter tracker note: ${ANSI_Reset}"
                    read -r tracker_note
                    if [ -n "$tracker_note" ]; then
                        local tracker_log_entry="$(date +"%Y-%m-%d %H:%M:%S") - $tracker_note"
                        echo "$tracker_log_entry" >> "$TRACKER_FILE"
                        rotate_log "$TRACKER_FILE" # Rotate tracker if needed
                        log_info "New entry added to tracker: $tracker_note"
                        echo -e "${ANSI_Green}[SUCCESS]${ANSI_Reset} Entry added."
                    else
                        log_warn "No tracker note entered."
                    fi
                fi
                ;;
            "l")
                log_info "Displaying CLI log file: $LOG_FILE"
                if [ -f "$LOG_FILE" ]; then
                    echo -e "\n${ANSI_Bold}${ANSI_Cyan}--- CLI Log ($LOG_FILE) ---${ANSI_Reset}"
                    cat "$LOG_FILE"
                    echo -e "${ANSI_Bold}${ANSI_Cyan}--- End of Log ---${ANSI_Reset}"
                else
                    log_warn "Log file $LOG_FILE not found."
                fi
                ;;
            "g") generate_commit_message ;;
            "p") commit_and_push ;;
            "v")
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Vercel Deployment Management${ANSI_Reset}"
                echo -e "  1) Deploy to production"
                echo -e "  2) Login to Vercel"
                echo -e "  3) Logout from Vercel"
                echo -e "  b) Back"
                echo -ne "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}"
                read -r deploy_choice
                case $deploy_choice in
                    1) manage_vercel "deploy" ;;
                    2) manage_vercel "login" ;;
                    3) manage_vercel "logout" ;;
                    "b"|"B") ;;
                    *) log_error "Invalid choice '$deploy_choice' for Vercel Deployment." "main_loop" ;;
                esac
                ;;
            "m")
                echo -e "\n${ANSI_Bold}${ANSI_Yellow}Vercel Environment Variable Management${ANSI_Reset}"
                echo -e "  1) Pull from Vercel (updates .env.local)"
                echo -e "  2) Push to Vercel (from .env.local to Production env)"
                echo -e "  3) Create default .env.local (from .env.example or basic template)"
                echo -e "  b) Back"
                echo -ne "${ANSI_Bold}${ANSI_Yellow}Choose an option: ${ANSI_Reset}"
                read -r env_choice
                case $env_choice in
                    1) manage_vercel "env-pull" ;;
                    2) manage_vercel "env-push" ;;
                    3) create_default_env ;;
                    "b"|"B") ;;
                    *) log_error "Invalid choice '$env_choice' for Vercel Env Vars." "main_loop" ;;
                esac
                ;;
            "k") generate_secret_key ;;
            "q") cleanup ;; # Calls exit internally
            *)
                log_warn "Invalid selection: '$choice'"
                echo -e "${ANSI_Red}Invalid selection. Please try again.${ANSI_Reset}"
                ;;
        esac

        if [[ "$choice" != "q" ]]; then
            echo -ne "\n${ANSI_Yellow}Press Enter to continue...${ANSI_Reset}"
            read -r _ # Wait for user
        fi
    done
}

# Script entry point: only run main if executed directly
if [[ "${BASH_SOURCE[0]}" == "$0" ]]; then
    main "$@"
    exit 0 # Should be unreachable if main loop is infinite or cleanup exits
fi
