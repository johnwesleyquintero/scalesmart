import { exec, execSync } from 'child_process';
import readline from 'readline';

// Define quick commit templates
const commitTemplates = [
  'quick: minor changes',
  'quick: bug fix',
  'quick: feature addition',
  'quick: documentation update',
  'quick: code refactor',
  'quick: performance improvement',
  'quick: test addition',
];

// Function to display commit templates
function displayTemplates() {
  console.log('Available commit templates:');
  commitTemplates.forEach((template, index) => {
    console.log(`${index + 1}. ${template}`);
  });
}

// Function to commit changes
function commitChanges(commitMessage) {
  exec(`git add . && git commit -m "${commitMessage}"`, (error) => {
    if (error) {
      console.error(`Error committing changes: ${error}`);
      return;
    }
    console.log(`Changes committed with message: ${commitMessage}`);
  });
}

// Function to suggest commit message based on staged files
function suggestCommitMessage() {
  try {
    const stagedFiles = execSync('git diff --staged --name-only', { encoding: 'utf8' }).trim().split('\n');
    if (stagedFiles.length === 0 || (stagedFiles.length === 1 && stagedFiles[0] === '')) {
      return null; // No staged changes
    }

    // Simple heuristic: suggest type based on file paths
    let type = 'chore'; // Default type
    let scope = '';
    const fileCount = stagedFiles.length;

    if (stagedFiles.some(file => file.startsWith('src/'))) {
        type = 'feat';
        scope = 'app';
    }
    if (stagedFiles.some(file => file.startsWith('src/components/'))) {
        type = 'ui';
        scope = 'components';
    }
     if (stagedFiles.some(file => file.startsWith('src/lib/'))) {
        type = 'refactor';
        scope = 'lib';
    }
    if (stagedFiles.some(file => file.startsWith('src/hooks/'))) {
        type = 'refactor';
        scope = 'hooks';
    }
    if (stagedFiles.some(file => file.startsWith('src/styles/'))) {
        type = 'style';
        scope = 'css';
    }
    if (stagedFiles.some(file => file.startsWith('docs/'))) {
        type = 'docs';
        scope = 'docs';
    }
    if (stagedFiles.some(file => file.startsWith('scripts/'))) {
        type = 'chore';
        scope = 'scripts';
    }
    if (stagedFiles.some(file => file.startsWith('src/types/'))) {
        type = 'types';
        scope = 'types';
    }
     if (stagedFiles.some(file => file.startsWith('src/config/'))) {
        type = 'config';
        scope = 'config';
    }
     if (stagedFiles.some(file => file.startsWith('src/data/'))) {
        type = 'data';
        scope = 'data';
    }
     if (stagedFiles.some(file => file.startsWith('src/context/'))) {
        type = 'refactor';
        scope = 'context';
    }
     if (stagedFiles.some(file => file.startsWith('src/utils/'))) {
        type = 'refactor';
        scope = 'utils';
    }
     if (stagedFiles.some(file => file.startsWith('src/pages/'))) {
        type = 'feat';
        scope = 'pages';
    }


    // Basic description based on file count
    const description = fileCount === 1 ? `update ${stagedFiles[0]}` : `update ${fileCount} files`;

    return `${type}${scope ? '(' + scope + ')' : ''}: ${description}`;

  } catch (error) {
    console.error(`Error getting staged files: ${error}`);
    return null;
  }
}


// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Main script
const suggestedMessage = suggestCommitMessage();

if (suggestedMessage) {
  console.log(`Suggested commit message: ${suggestedMessage}`);
  rl.question('Use suggested message? (y/n/c - custom): ', (choice) => {
    if (choice.toLowerCase() === 'y') {
      commitChanges(suggestedMessage);
      rl.close();
    } else if (choice.toLowerCase() === 'c') {
      rl.question('Enter custom commit message: ', (customMessage) => {
        commitChanges(customMessage);
        rl.close();
      });
    } else {
      console.log('Select a commit template:');
      displayTemplates();
      rl.question('Enter the number of the commit template: ', (templateNumber) => {
        const selectedTemplate = commitTemplates[templateNumber - 1];
        if (selectedTemplate) {
          commitChanges(selectedTemplate);
        } else {
          console.log('Invalid template number. Commit cancelled.');
        }
        rl.close();
      });
    }
  });
} else {
  console.log('No staged changes found or error occurred. Select a commit template:');
  displayTemplates();
  rl.question('Enter the number of the commit template: ', (templateNumber) => {
    const selectedTemplate = commitTemplates[templateNumber - 1];
    if (selectedTemplate) {
      commitChanges(selectedTemplate);
    } else {
      console.log('Invalid template number. Commit cancelled.');
    }
    rl.close();
  });
}
