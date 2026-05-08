/**
 * @file Script to automate code quality checks (formatting, linting, type checking).
 *
 * This script runs a series of configured shell commands in parallel and provides
 * consolidated reporting. It is written in pure JavaScript with JSDoc for type

 * safety, requiring no external build tools like TypeScript.
 *
 * It offers two output modes:
 * 1. Human-readable (default): A clean summary followed by a detailed, consolidated
 *    AI prompt for any failures.
 * 2. JSON output (via --json flag): Machine-readable output, ideal for
 *    integration with other tools or AI workflows.
 *
 * @example
 * node code-checker.mjs
 * node code-checker.mjs --json
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import { CHECKS } from './code-checks.config.mjs'; // Assumed to be CheckConfig[]

// Simple console color replacements for chalk
const colors = {
  green: (text) => `\x1b[32m${text}\x1b[0m`,
  red: (text) => `\x1b[31m${text}\x1b[0m`,
  yellow: (text) => `\x1b[33m${text}\x1b[0m`,
  blue: (text) => `\x1b[34m${text}\x1b[0m`,
  bold: (text) => `\x1b[1m${text}\x1b[0m`,
  dim: (text) => `\x1b[2m${text}\x1b[0m`,
};

const execPromise = promisify(exec);

// --- Type Definitions via JSDoc for JS-compatibility ---

/**
 * Configuration for a single check.
 * @typedef {object} CheckConfig
 * @property {string} name - The display name for the check.
 * @property {string} command - The shell command to execute.
 */

/**
 * A single parsed error from a tool's output.
 * @typedef {object} ParsedError
 * @property {string} filePath - The path to the file with the error.
 * @property {number} line - The line number of the error.
 * @property {number} column - The column number of the error.
 * @property {string} message - The full error message line.
 */

/**
 * The structured result of parsing a tool's output.
 * @typedef {object} ParsedOutput
 * @property {Map<string, ParsedError[]>} errorsByFile - Errors grouped by file path.
 * @property {string[]} generalOutput - Output lines that couldn't be parsed as errors.
 */

/**
 * The complete result of a single check run.
 * @typedef {object} CheckResult
 * @property {string} name - The name of the check.
 * @property {boolean} success - Whether the check passed.
 * @property {string} command - The command that was executed.
 * @property {string} stdout - The standard output from the command.
 * @property {string} stderr - The standard error from the command.
 * @property {string} combinedOutput - The combined stdout and stderr.
 * @property {ParsedOutput} [parsedOutput] - The parsed output, if the check failed.
 */

// --- Constants ---

const EXIT_CODES = {
  SUCCESS: 0,
  CHECK_FAILED: 1,
  UNEXPECTED_ERROR: 2,
};

// --- Core Logic ---

/**
 * Parses linter-style output into a structured format.
 * @param {string} output - Raw stdout or stderr from a command.
 * @returns {ParsedOutput} A structured representation of the errors.
 */
function parseLinterOutput(output) {
  if (!output) return { errorsByFile: new Map(), generalOutput: [] };

  const lines = output.split('\n');
  const errorsByFile = new Map();
  const generalOutput = [];
  let currentFile = null;

  // Pattern for "file:line:col" (inline)
  const inlinePattern = /^(?<filePath>[^\s].*?):(?<line>\d+):(?<column>\d+)/;
  // Pattern for "  line:col  level  message" (indented stylish format)
  const indentedPattern =
    /^\s+(?<line>\d+):(?<column>\d+)\s+(?:error|warning|info)\s+(?<message>.*)/;

  lines.forEach((line) => {
    const inlineMatch = line.match(inlinePattern);
    const indentedMatch = line.match(indentedPattern);

    if (inlineMatch?.groups?.filePath) {
      const { filePath, line: lineStr, column: colStr } = inlineMatch.groups;
      addError(filePath, lineStr, colStr, line.trim());
    } else if (indentedMatch && currentFile) {
      const { line: lineStr, column: colStr, message } = indentedMatch.groups;
      addError(currentFile, lineStr, colStr, message);
    } else if (
      line.trim() &&
      !line.startsWith(' ') &&
      (line.includes('\\') || line.includes('/'))
    ) {
      // Capture file path header in stylish output
      currentFile = line.trim();
    } else if (line.trim()) {
      generalOutput.push(line);
    }
  });

  function addError(filePath, lineStr, colStr, message) {
    if (!errorsByFile.has(filePath)) {
      errorsByFile.set(filePath, []);
    }
    errorsByFile.get(filePath).push({
      filePath,
      line: parseInt(lineStr, 10),
      column: parseInt(colStr, 10),
      message,
    });
  }

  return { errorsByFile, generalOutput };
}

/**
 * Executes a shell command with improved error handling and result structuring.
 * @param {CheckConfig} check - The configuration for the check to run.
 * @returns {Promise<CheckResult>} A detailed result object.
 */
async function runCommand(check) {
  const { name, command } = check;
  console.log(colors.blue(`▶ Running: ${name}...`));

  try {
    const { stdout, stderr } = await execPromise(command);
    return {
      name,
      command,
      success: true,
      stdout,
      stderr,
      combinedOutput: [stdout, stderr].filter(Boolean).join('\n\n'),
    };
  } catch (error) {
    if (error.code === 'ENOENT') {
      const errorMessage = `Command not found: ${command.split(' ')[0]}. Please ensure it is installed and in your PATH.`;
      return {
        name,
        command,
        success: false,
        stdout: '',
        stderr: errorMessage,
        combinedOutput: errorMessage,
        parsedOutput: parseLinterOutput(errorMessage),
      };
    }

    const stdout = error.stdout || '';
    const stderr = error.stderr || '';
    const combinedOutput = [stdout, stderr].filter(Boolean).join('\n\n');

    return {
      name,
      command,
      success: false,
      stdout,
      stderr,
      combinedOutput,
      parsedOutput: parseLinterOutput(combinedOutput),
    };
  }
}

// --- Output & Display ---

/**
 * Displays results in a human-readable format and generates an AI prompt on failure.
 * @param {CheckResult[]} results - The array of check results.
 */
function displayHumanReadableOutput(results) {
  const failedChecks = results.filter((r) => !r.success);
  const passedChecks = results.filter((r) => r.success);

  console.log(colors.bold('\n--- Code Quality Check Summary ---'));

  // Display passed checks and any warnings they produced
  passedChecks.forEach((check) => {
    console.log(colors.green(`✓ ${check.name} passed`));
    if (check.stderr && check.stderr.trim()) {
      console.log(colors.yellow(`  ⚠ Warnings:`));
      // Indent warnings for readability
      console.log(colors.dim(check.stderr.trim().replace(/^/gm, '    ')));
    }
  });

  // Display failed checks (name only)
  failedChecks.forEach((check) => {
    console.error(colors.red(`✗ ${check.name} failed`));
  });

  // If there are failures, show the consolidated AI prompt with all details
  if (failedChecks.length > 0) {
    console.error(colors.bold('\nSome checks failed. See details below.'));
    const prompt = `
The following code quality checks failed. Your task is to provide the necessary code changes or commands to fix these issues.

### Summary of Failures:
${failedChecks
  .map(
    (check) => `
- **Check:** ${check.name}
- **Command:** \`${check.command}\`
- **Error Output:**
\`\`\`
${check.combinedOutput.trim()}
\`\`\`
`,
  )
  .join('')}
Please analyze the error output for each failed check and provide a plan or code patch to resolve the problems.
`;
    console.log(colors.bold('\n--- AI Task Prompt for Failed Checks ---'));
    console.log(prompt);
    console.log(colors.bold('------------------------------------'));
  } else {
    console.log(colors.bold('\n✨ All checks passed successfully!'));
  }
}

/**
 * Displays results as a JSON object to stdout.
 * @param {CheckResult[]} results - The array of check results.
 */
function displayJsonOutput(results) {
  // To avoid circular references in JSON from the Map object, we convert it.
  const serializableResults = results.map((result) => {
    if (result.parsedOutput) {
      return {
        ...result,
        parsedOutput: {
          errorsByFile: Object.fromEntries(result.parsedOutput.errorsByFile),
          generalOutput: result.parsedOutput.generalOutput,
        },
      };
    }
    return result;
  });
  console.log(JSON.stringify({ results: serializableResults }, null, 2));
}

// --- Main Orchestration ---

/**
 * Orchestrates parallel execution of code quality checks and reports results.
 * @returns {Promise<void>}
 */
async function main() {
  const useJsonOutput = process.argv.includes('--json');

  if (!useJsonOutput) {
    console.log(colors.bold('\nRunning Code Quality Checks...'));
  }

  try {
    /** @type {CheckConfig[]} */
    const checksToRun = CHECKS;
    const results = await Promise.all(
      checksToRun.map((check) => runCommand(check)),
    );
    const allPassed = results.every((result) => result.success);

    if (useJsonOutput) {
      displayJsonOutput(results);
    } else {
      displayHumanReadableOutput(results);
    }

    process.exit(allPassed ? EXIT_CODES.SUCCESS : EXIT_CODES.CHECK_FAILED);
  } catch (error) {
    console.error(colors.bold('\nAn unexpected error occurred:'));
    console.error(error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

// Execute the checks
main();
