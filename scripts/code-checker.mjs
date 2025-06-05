/**
 * @file This script automates the execution of various code quality checks
 * such as formatting, linting, and type checking. It runs these checks in parallel
 * and reports the overall success or failure.
 */

import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

let spinnerInterval;
const spinnerChars = ['|', '/', '-', '\\'];
let spinnerIndex = 0;

function startSpinner() {
  process.stdout.write('Running checks... ');
  spinnerInterval = setInterval(() => {
    process.stdout.write('\b' + spinnerChars[spinnerIndex]);
    spinnerIndex = (spinnerIndex + 1) % spinnerChars.length;
  }, 100);
}

function stopSpinner() {
  clearInterval(spinnerInterval);
  process.stdout.write('\b \n'); // Clear the spinner character and move to a new line
}

/**
 * Runs a given shell command and logs its output.
 * @param {string} command - The shell command to execute.
 * @param {string} name - A descriptive name for the command being run (e.g., "Lint Check").
 * @returns {Promise<boolean>} - True if the command succeeded, false otherwise.
 */
async function runCommand(command, name) {
  console.log(`Starting ${name}...`);
  try {
    await execPromise(command);
    return true;
  } catch (error) {
    console.error(`${name} failed.`);
    let output = '';
    if (error.stdout) output += error.stdout;
    if (error.stderr) output += error.stderr;

    const lines = output.split('\n');
    const categorizedOutput = {};
    const uncategorizedLines = [];
    const filePattern = /^(.*?):(\d+):(\d+)/; // Basic pattern for filepath:line:column

    lines.forEach((line) => {
      const match = line.match(filePattern);
      if (match && match[1]) {
        const filePath = match[1];
        if (!categorizedOutput[filePath]) {
          categorizedOutput[filePath] = [];
        }
        categorizedOutput[filePath].push(line);
      } else {
        uncategorizedLines.push(line);
      }
    });

    // Log categorized output
    for (const filePath in categorizedOutput) {
      console.error(`\n--- ${name} - ${filePath} ---`);
      categorizedOutput[filePath].forEach((line) => console.error(line));
    }

    // Log any uncategorized lines
    if (uncategorizedLines.length > 0) {
      console.error(`\n--- ${name} - General Output ---`);
      uncategorizedLines.forEach((line) => console.error(line));
    }

    return false;
  }
}

/**
 * Orchestrates and runs multiple code quality checks in parallel.
 * Exits the process with a status code of 0 if all checks pass, or 1 if any fail.
 */
async function checkCode() {
  const checksToRun = [
    { command: 'npm run format', name: 'Format Check' },
    { command: 'npm run lint', name: 'Lint Check' },
    { command: 'npm run typecheck', name: 'Type Check' },
    // Add more checks here easily
    // { command: 'npm run test', name: 'Unit Tests' },
  ];

  startSpinner();

  try {
    const results = await Promise.all(
      checksToRun.map((check) => runCommand(check.command, check.name)),
    );

    const allPassed = results.every((result) => result === true);

    if (allPassed) {
      stopSpinner();
      process.exit(0);
    } else {
      stopSpinner();
      console.error('\nSome code checks failed.');
      process.exit(1);
    }
  } catch (error) {
    stopSpinner();
    console.error('An unexpected error occurred:', error);
    process.exit(1);
  }
}

checkCode();
