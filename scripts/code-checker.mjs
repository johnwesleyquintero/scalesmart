/**
 * @file Script to automate code quality checks (formatting, linting, type checking)
 * Runs checks in parallel and provides consolidated reporting
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execPromise = promisify(exec);

// Configuration - could be moved to external config file if needed
const CHECKS = [
  { command: 'npm run format', name: 'Format Check' },
  { command: 'npm run lint', name: 'Lint Check' },
  { command: 'npm run typecheck', name: 'Type Check' },
  // Additional checks can be added here
  // { command: 'npm run test', name: 'Unit Tests' },
];

// Exit codes
const EXIT_CODES = {
  SUCCESS: 0,
  CHECK_FAILED: 1,
  UNEXPECTED_ERROR: 2,
};

/**
 * Validates a command before execution
 * @param {string} command - Command to validate
 * @throws {Error} If command is invalid
 */
function validateCommand(command) {
  if (typeof command !== 'string' || command.trim() === '') {
    throw new Error(`Invalid command: ${command}`);
  }
}

/**
 * Formats error output for better readability
 * @param {string} output - Raw error output
 * @returns {string} Formatted error message
 */
function formatErrorOutput(output) {
  if (!output) return '';

  const lines = output.split('\n');
  const categorizedOutput = new Map();
  const uncategorizedLines = [];
  const filePattern = /^(.*?):(\d+):(\d+)/; // Matches filepath:line:column

  lines.forEach((line) => {
    const match = line.match(filePattern);
    if (match?.[1]) {
      const filePath = match[1];
      if (!categorizedOutput.has(filePath)) {
        categorizedOutput.set(filePath, []);
      }
      categorizedOutput.get(filePath).push(line);
    } else if (line.trim()) {
      uncategorizedLines.push(line);
    }
  });

  let formattedOutput = '';

  // Add categorized output
  categorizedOutput.forEach((lines, filePath) => {
    formattedOutput += `\n${chalk.underline(filePath)}:\n`;
    formattedOutput += lines.join('\n') + '\n';
  });

  // Add uncategorized output
  if (uncategorizedLines.length > 0) {
    formattedOutput += `\n${chalk.dim('General output:')}\n`;
    formattedOutput += uncategorizedLines.join('\n') + '\n';
  }

  return formattedOutput;
}

/**
 * Executes a shell command with improved error handling
 * @param {string} command - The shell command to execute
 * @param {string} name - Descriptive name for the command
 * @returns {Promise<boolean>} True if command succeeded, false otherwise
 */
async function runCommand(command, name) {
  validateCommand(command);

  console.log(chalk.blue(`\n▶ Starting ${name}...`));

  try {
    const { stdout } = await execPromise(command);
    if (stdout.trim()) {
      console.log(chalk.dim(stdout));
    }
    console.log(chalk.green(`✓ ${name} passed`));
    return true;
  } catch (error) {
    console.error(chalk.red(`✗ ${name} failed`));

    const output = [error.stdout, error.stderr].filter(Boolean).join('\n');

    if (output) {
      console.error(formatErrorOutput(output));
    }

    return false;
  }
}

/**
 * Orchestrates parallel execution of code quality checks
 * @returns {Promise<void>}
 */
async function runQualityChecks() {
  try {
    console.log(chalk.bold('\nRunning Code Quality Checks\n'));

    const results = await Promise.all(
      CHECKS.map((check) => runCommand(check.command, check.name)),
    );

    const allPassed = results.every(Boolean);

    if (allPassed) {
      console.log(chalk.bold.green('\nAll checks passed!'));
      process.exit(EXIT_CODES.SUCCESS);
    } else {
      console.error(chalk.bold.red('\nSome checks failed.'));
      process.exit(EXIT_CODES.CHECK_FAILED);
    }
  } catch (error) {
    console.error(chalk.bold.red('\nUnexpected error:'));
    console.error(error);
    process.exit(EXIT_CODES.UNEXPECTED_ERROR);
  }
}

// Execute the checks
runQualityChecks();
