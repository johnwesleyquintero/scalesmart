import { exec } from 'child_process';
import readline from 'readline';

// Define quick commit templates
const commitTemplates = [
  "quick: minor changes",
  "quick: bug fix",
  "quick: feature addition",
  "quick: documentation update",
  "quick: code refactor",
  "quick: performance improvement",
  "quick: test addition"
];

// Function to display commit templates
function displayTemplates() {
  console.log("Available commit templates:");
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

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Main script
console.log("Select a commit template:");
displayTemplates();

rl.question("Enter the number of the commit template: ", (templateNumber) => {
  const selectedTemplate = commitTemplates[templateNumber - 1];

  if (selectedTemplate) {
    console.log(`Selected commit template: ${selectedTemplate}`);
    rl.question("Do you want to use this template? (y/n): ", (confirm) => {
      if (confirm.toLowerCase() === 'y') {
        commitChanges(selectedTemplate);
      } else {
        console.log("Commit cancelled.");
      }
      rl.close();
    });
  } else {
    console.log("Invalid template number. Commit cancelled.");
    rl.close();
  }
});
