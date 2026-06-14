import { readFileSync } from 'fs';

function fail(message) {
  console.error(message);
  process.exit(1);
}

// Retrieve the PR body from the environment variable
const rawPrBody = process.env.PR_BODY;

if (rawPrBody === undefined) {
  console.log('PR_BODY environment variable is not defined. Skipping validation (assuming local non-PR execution).');
  process.exit(0);
}

if (!rawPrBody || rawPrBody.trim() === '') {
  fail('Error: PR body is empty.');
}

// Normalize newlines to avoid cross-platform matching issues
const prBody = rawPrBody.replace(/\r\n/g, '\n');

// 1. Helper function to extract section text
function getSection(body, name) {
  const regex = new RegExp(`##\\s+${name}\\s*\\n([\\s\\S]*?)(?=\\n##|\\n#|$)`, 'i');
  const match = body.match(regex);
  return match ? match[1].trim() : null;
}

// 2. Helper function to parse checkboxes in section
function getCheckboxes(sectionText) {
  if (!sectionText) return [];
  const lines = sectionText.split('\n');
  const results = [];
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('- [') || trimmed.startsWith('* [') || trimmed.startsWith('[')) {
      const isChecked = /^[-*]?\s*\[[xX]\]/.test(trimmed);
      const isUnchecked = /^[-*]?\s*\[\s\]/.test(trimmed);
      if (isChecked || isUnchecked) {
        results.push({
          line: trimmed,
          checked: isChecked,
          text: trimmed.replace(/^[-*]?\s*\[[xX\s]\]\s*/, '')
        });
      }
    }
  }
  return results;
}

// 3. Check for specific forbidden template placeholders and patterns (case-insensitive)
const forbiddenPatterns = [
  'Explain what this PR changes and why.',
  'Choose one:',
  'Link evidence docs or write `N/A`.',
  'Link evidence docs or write N/A.',
  'Any reviewer context.',
  'Valid body.',
  /\bplaceholder\b/i,
  /\btodo\b/i,
  /\btbd\b/i,
  'npm test output here',
  'Additional Notes',
  '<!--',
  '-->',
  '<replace with concise summary>',
  '<replace with docs path, PR link, or N/A with reason>',
  '<replace with reviewer context or N/A>'
];

const lowerPrBody = prBody.toLowerCase();
for (const pattern of forbiddenPatterns) {
  if (pattern instanceof RegExp) {
    if (pattern.test(prBody)) {
      fail(`Error: PR body contains forbidden template placeholder or text matching pattern: ${pattern}`);
    }
  } else {
    if (lowerPrBody.includes(pattern.toLowerCase())) {
      fail(`Error: PR body contains forbidden template placeholder or text: "${pattern}"`);
    }
  }
}

// 4. Check for unresolved HTML comments
const htmlCommentRegex = /<!--[\s\S]*?-->/g;
if (htmlCommentRegex.test(prBody)) {
  fail('Error: PR body contains unresolved HTML comments or template instructions.');
}

// 5. Verify Summary section
const summaryText = getSection(prBody, 'Summary');
if (summaryText === null) {
  fail('Error: "Summary" section is missing.');
}
if (summaryText === '' || summaryText.length < 10) {
  fail('Error: The "Summary" section is empty or too short (must be at least 10 characters).');
}

// 6. Verify Scope section
const scopeText = getSection(prBody, 'Scope');
if (scopeText === null) {
  fail('Error: "Scope" section is missing.');
}
const scopeBoxes = getCheckboxes(scopeText);
if (scopeBoxes.length === 0) {
  fail('Error: No checkboxes found in "Scope" section.');
}
const checkedScopeCount = scopeBoxes.filter(b => b.checked).length;
if (checkedScopeCount === 0) {
  fail('Error: At least one checkbox must be checked in the "Scope" section.');
}

// 7. Verify Production Impact section
const prodImpactText = getSection(prBody, 'Production Impact');
if (prodImpactText === null) {
  fail('Error: "Production Impact" section is missing.');
}
const prodImpactBoxes = getCheckboxes(prodImpactText);
if (prodImpactBoxes.length === 0) {
  fail('Error: No checkboxes found in "Production Impact" section.');
}
const checkedProdImpact = prodImpactBoxes.filter(b => b.checked);
if (checkedProdImpact.length !== 1) {
  fail(`Error: Exactly one option must be checked in the "Production Impact" section (found ${checkedProdImpact.length}).`);
}

// 8. Determine if production-impacting
const checkedScopeTexts = scopeBoxes.filter(b => b.checked).map(b => b.text.toLowerCase());
const checkedProdImpactTexts = checkedProdImpact.map(b => b.text.toLowerCase());

const prodImpactingTerms = [
  'production read-only verification',
  'production dry-run',
  'production shadow-mode',
  'production pr trial',
  'production live-write trial',
  'production-impacting workflow'
];

let isProductionImpacting = false;
for (const term of prodImpactingTerms) {
  if (checkedScopeTexts.some(t => t.includes(term)) || checkedProdImpactTexts.some(t => t.includes(term))) {
    isProductionImpacting = true;
    break;
  }
}

// 9. Verify Safety section
const safetyText = getSection(prBody, 'Safety');
if (safetyText !== null) {
  const safetyBoxes = getCheckboxes(safetyText);
  for (const box of safetyBoxes) {
    if (!box.checked) {
      const hasNA = /\bn\/?a\b/i.test(box.line);
      if (!hasNA) {
        fail(`Error: Safety checkbox is unchecked and has no N/A reason: "${box.line.trim()}"`);
      }
    }
  }
}

// 10. Verify Validation section
const validationText = getSection(prBody, 'Validation');
if (validationText === null) {
  fail('Error: "Validation" section is missing.');
}
const validationBoxes = getCheckboxes(validationText);
if (validationBoxes.length === 0) {
  fail('Error: No checkboxes found in "Validation" section.');
}
for (const box of validationBoxes) {
  if (!box.checked) {
    if (isProductionImpacting) {
      fail(`Error: Production-impacting PR does not allow skipping core validation: "${box.line.trim()}"`);
    } else {
      const hasNA = /\bn\/?a\b/i.test(box.line);
      if (!hasNA) {
        fail(`Error: Validation checkbox is unchecked and has no N/A reason: "${box.line.trim()}"`);
      }
    }
  }
}

// 11. Verify Evidence section
const evidenceText = getSection(prBody, 'Evidence');
if (isProductionImpacting) {
  if (!evidenceText || evidenceText.trim() === '') {
    fail('Error: Production-impacting PR requires evidence, but "Evidence" section is empty.');
  }
  const cleanEvidence = evidenceText.trim().toLowerCase();
  if (cleanEvidence === 'n/a' || cleanEvidence.includes('link evidence docs or write n/a')) {
    fail('Error: Production-impacting PR requires concrete evidence; cannot be "N/A" or placeholder.');
  }
  const hasDocsPath = /docs\/[a-zA-Z0-9_\-\.\/]+/.test(evidenceText);
  const hasGitHubLink = /github\.com\/[a-zA-Z0-9_\-\.\/]+/.test(evidenceText) || /https?:\/\/github\.com/.test(evidenceText);
  if (!hasDocsPath && !hasGitHubLink) {
    fail('Error: Production-impacting PR evidence must contain at least one "docs/" path or GitHub link.');
  }
}

console.log('PR body quality gate passed successfully.');
process.exit(0);
