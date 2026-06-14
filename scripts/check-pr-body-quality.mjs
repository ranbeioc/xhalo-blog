import { readFileSync } from 'fs';

// Retrieve the PR body from the environment variable
const prBody = process.env.PR_BODY;

if (prBody === undefined) {
  console.log('PR_BODY environment variable is not defined. Skipping validation (assuming local non-PR execution).');
  process.exit(0);
}

if (!prBody || prBody.trim() === '') {
  console.error('Error: PR body is empty.');
  process.exit(1);
}

// 1. Check for specific forbidden template placeholders and patterns
const forbiddenPatterns = [
  '<!-- What does this PR do?',
  '<!-- List the key changes made',
  'npm test output here',
  'Additional Notes',
  'TBD',
  'placeholder'
];

for (const pattern of forbiddenPatterns) {
  if (prBody.toLowerCase().includes(pattern.toLowerCase())) {
    console.error(`Error: PR body contains forbidden template placeholder or text: "${pattern}"`);
    process.exit(1);
  }
}

// 2. Check for unresolved HTML comments
// Standard PR templates use HTML comments for instructions. If any <!-- ... --> comments remain, fail.
const htmlCommentRegex = /<!--[\s\S]*?-->/g;
if (htmlCommentRegex.test(prBody)) {
  console.error('Error: PR body contains unresolved HTML comments or template instructions.');
  process.exit(1);
}

// 3. Verify that the Summary section is not empty or filled with placeholders
// We look for the Summary heading (e.g. ## Summary) and extract content until the next heading (##)
const summaryRegex = /## Summary\s+([\s\S]*?)(?=\n##|$)/i;
const summaryMatch = prBody.match(summaryRegex);
if (!summaryMatch || summaryMatch[1].trim() === '' || summaryMatch[1].trim().length < 10) {
  console.error('Error: The "Summary" section is empty, missing, or too short (must be at least 10 characters).');
  process.exit(1);
}

// 4. Verify that critical checkboxes are checked
// We check that at least one checkbox is checked in the Scope section,
// and checkboxes in Validation/Safety are addressed
const scopeRegex = /## Scope\s+([\s\S]*?)(?=\n##|$)/i;
const scopeMatch = prBody.match(scopeRegex);
if (scopeMatch) {
  const checkboxes = scopeMatch[1].match(/- \[[xX]\]/g);
  if (!checkboxes || checkboxes.length === 0) {
    console.error('Error: At least one checkbox must be checked in the "Scope" section.');
    process.exit(1);
  }
} else {
  console.error('Error: "Scope" section is missing.');
  process.exit(1);
}

const validationRegex = /## Validation\s+([\s\S]*?)(?=\n##|$)/i;
const validationMatch = prBody.match(validationRegex);
if (validationMatch) {
  const uncheckedValidation = validationMatch[1].match(/- \[\s\]/g);
  if (uncheckedValidation && uncheckedValidation.length > 0) {
    console.warn('Warning: Some validation steps are left unchecked.');
  }
}

console.log('PR body quality gate passed successfully.');
process.exit(0);
