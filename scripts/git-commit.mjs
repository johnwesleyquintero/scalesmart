import { exec, execSync } from 'child_process';

// Define quick commit templates

// Function to commit changes
function commitAndPushChanges(commitMessage) {
  exec(`git commit -m "${commitMessage}"`, (error) => {
    if (error) {
      console.error(`Error committing changes: ${error}`);
      return;
    }
    console.log(`Changes committed with message: ${commitMessage}`);
    exec('git push', (pushError) => {
      if (pushError) {
        console.error(`Error pushing changes: ${pushError}`);
        return;
      }
      console.log('Changes pushed successfully.');
    });
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

// Main script
exec('git add .', (addError) => {
  if (addError) {
    console.error(`Error adding files: ${addError}`);
    return;
  }
  console.log('All changes added to staging.');

  const suggestedMessage = suggestCommitMessage();

  if (suggestedMessage) {
    console.log(`Suggested commit message: ${suggestedMessage}`);
    commitAndPushChanges(suggestedMessage);
  } else {
    console.log('No staged changes found or error occurred. No commit and push performed.');
  }
});
