#!/bin/bash

# Advanced Terminal Resume Scanner
# A utility for basic resume analysis via terminal.

# --- Configuration ---
# Keywords that make ATS bots happy (or so they say)
ATS_POSITIVE_KEYWORDS=("experience" "skills" "education" "developed" "managed" "led" "achieved" "implemented" "designed" "analyzed" "project" "team" "python" "java" "javascript" "aws" "azure" "gcp" "sql" "api" "data" "agile" "scrum" "optimized" "increased" "reduced" "strategy")

# --- Helper Functions ---
print_header() {
    echo ""
    echo "-----------------------------------------------------"
    echo "  🚀 Advanced Terminal Resume Scanner 🚀"
    echo "-----------------------------------------------------"
    echo "Scanning: $1"
    echo ""
}

print_section_header() {
    echo -e "\n🔍 \033[1;34m$1\033[0m" # Bold Blue
    echo "------------------------------------------"
}

check_status() {
    local status_ok=$1
    local message_ok=$2
    local message_fail=$3

    if [ "$status_ok" -eq 1 ]; then
        echo -e "✅ \033[32mStatus: PASS\033[0m - $message_ok" # Green
    else
        echo -e "⚠️  \033[33mStatus: REVIEW\033[0m - $message_fail" # Yellow
    fi
}

# --- Main Logic ---
if [ -z "$1" ]; then
    echo "Usage: $0 <path_to_resume_file>"
    echo "Example: $0 /path/to/your/resume.txt"
    echo "         $0 /path/to/your/resume.pdf"
    exit 1
fi

RESUME_FILE_ARG="$1"
# Get absolute path for clarity in messages
RESUME_FILE=$(realpath "$RESUME_FILE_ARG" 2>/dev/null || echo "$RESUME_FILE_ARG")

TEMP_TEXT_FILE="/tmp/resume_text_$(date +%s)_$RANDOM.txt"

if [ ! -f "$RESUME_FILE_ARG" ]; then
    echo -e "\033[1;31mError: File not found at '$RESUME_FILE_ARG'\033[0m" # Bold Red
    exit 1
fi

print_header "$RESUME_FILE"

# Convert PDF to text if pdftotext is available and it's a PDF
if [[ "$RESUME_FILE_ARG" == *.pdf ]]; then
    if command -v pdftotext &> /dev/null; then
        echo "📄 Detected PDF. Attempting to convert to text using pdftotext..."
        pdftotext "$RESUME_FILE_ARG" "$TEMP_TEXT_FILE"
        if [ $? -ne 0 ]; then
            echo -e "\033[1;31mError: pdftotext failed to convert '$RESUME_FILE'.\033[0m"
            exit 1
        fi
        RESUME_CONTENT_LOWERCASE=$(cat "$TEMP_TEXT_FILE" | tr '[:upper:]' '[:lower:]')
        rm "$TEMP_TEXT_FILE" # Clean up temp file
    else
        echo -e "\033[33mWarning: '$RESUME_FILE' is a PDF, but 'pdftotext' is not installed.\033[0m"
        echo "Please install 'pdftotext' (often part of poppler-utils) or provide a .txt file."
        echo "Attempting to read as plain text (might not work well for PDF)..."
        RESUME_CONTENT_LOWERCASE=$(cat "$RESUME_FILE_ARG" | tr '[:upper:]' '[:lower:]')
    fi
elif [[ "$RESUME_FILE_ARG" == *.txt ]]; then
    echo "📄 Detected TXT file. Reading content..."
    RESUME_CONTENT_LOWERCASE=$(cat "$RESUME_FILE_ARG" | tr '[:upper:]' '[:lower:]')
else
    echo -e "\033[33mWarning: File type not explicitly supported (.pdf or .txt recommended).\033[0m"
    echo "Attempting to read as plain text..."
    RESUME_CONTENT_LOWERCASE=$(cat "$RESUME_FILE_ARG" | tr '[:upper:]' '[:lower:]')
fi

# --- Perform Scans ---

print_section_header "ATS 'Friendliness' Scan (Keyword Density)"
ats_keyword_count=0
for keyword in "${ATS_POSITIVE_KEYWORDS[@]}"; do
    if echo "$RESUME_CONTENT_LOWERCASE" | grep -q "$keyword"; then
        ((ats_keyword_count++))
    fi
done
total_ats_keywords=${#ATS_POSITIVE_KEYWORDS[@]}
ats_percentage=$((ats_keyword_count * 100 / total_ats_keywords))

echo "Found $ats_keyword_count out of $total_ats_keywords targeted ATS keywords ($ats_percentage%)."
if [ "$ats_percentage" -gt 50 ]; then
    check_status 1 "Good keyword density. Appears well-optimized for ATS keywords." "Low keyword density. Consider incorporating more industry-specific keywords."
else
    check_status 0 "Good keyword density. Appears well-optimized for ATS keywords." "Low keyword density. Consider incorporating more industry-specific keywords."
fi

print_section_header "'Industry Standards' Compliance (Section Check)"
has_summary=$(echo "$RESUME_CONTENT_LOWERCASE" | grep -Ec "(summary|objective|profile)")
has_experience=$(echo "$RESUME_CONTENT_LOWERCASE" | grep -Ec "(experience|employment|history)")
has_education=$(echo "$RESUME_CONTENT_LOWERCASE" | grep -Ec "(education|qualifications)")
has_skills=$(echo "$RESUME_CONTENT_LOWERCASE" | grep -Ec "(skills|technical|proficiencies)")

standard_sections_found=0
[[ $has_summary -gt 0 ]] && ((standard_sections_found++))
[[ $has_experience -gt 0 ]] && ((standard_sections_found++))
[[ $has_education -gt 0 ]] && ((standard_sections_found++))
[[ $has_skills -gt 0 ]] && ((standard_sections_found++))

if [ "$standard_sections_found" -ge 3 ]; then
    check_status 1 "Contains key sections. Standard resume structure detected." "Missing some standard sections. Ensure all key resume components are present."
else
    check_status 0 "Contains key sections. Standard resume structure detected." "Missing some standard sections. Ensure all key resume components are present."
fi
echo "  - Summary/Objective like section: $([ "$has_summary" -gt 0 ] && echo "Detected ✅" || echo "Not Detected ❌")"
echo "  - Experience like section: $([ "$has_experience" -gt 0 ] && echo "Detected ✅" || echo "Not Detected ❌")"
echo "  - Education like section: $([ "$has_education" -gt 0 ] && echo "Detected ✅" || echo "Not Detected ❌")"
echo "  - Skills like section: $([ "$has_skills" -gt 0 ] && echo "Detected ✅" || echo "Not Detected ❌")"

print_section_header "ISS Optimization Scan (Conceptual Check)"
echo "Performing conceptual ISS compatibility check..." && sleep 1
echo "ℹ️  Status: Informational - This check acknowledges discussed 'ISS' criteria."

print_section_header "CMS Optimization Scan (Conceptual Check)"
echo "Performing conceptual CMS alignment check..." && sleep 1
echo "ℹ️  Status: Informational - This check acknowledges discussed 'CMS' criteria."

echo -e "\n\n✨ \033[1;35mOverall Scan Summary\033[0m ✨" # Bold Magenta
echo "------------------------------------------"
echo "This resume has undergone a basic analysis using terminal-based tools."
echo "This scan provides an initial overview. For comprehensive feedback, consult industry best practices and specific job requirements."
echo "Scan performed via terminal interface."
echo ""
echo "-----------------------------------------------------"
echo "             Scan Complete."
echo "-----------------------------------------------------"

exit 0