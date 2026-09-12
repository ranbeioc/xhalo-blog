export function nowIso() {
  return new Date().toISOString();
}

export function parseDraftMarkdownDocument(raw) {
  const normalized = raw.replace(/\r\n/g, '\n');
  const parts = normalized.split('\n---\n');
  if (parts.length < 2) {
    const alternativeParts = normalized.split('---\n');
    if (alternativeParts.length >= 3) {
      const fmText = alternativeParts[1];
      const bodyText = alternativeParts.slice(2).join('---\n');
      return { frontmatter: parseYamlFrontmatter(fmText), body: bodyText.trim() };
    }
    throw new Error('Invalid Markdown document structure (missing frontmatter separators).');
  }

  let fmText = parts[0];
  if (fmText.startsWith('---\n')) {
    fmText = fmText.slice(4);
  } else if (fmText.startsWith('---')) {
    fmText = fmText.slice(3);
  }
  const bodyText = parts.slice(1).join('\n---\n');
  return { frontmatter: parseYamlFrontmatter(fmText), body: bodyText.trim() };
}

export function parseYamlFrontmatter(text) {
  const lines = text.split('\n');
  const result = {
    title: '',
    date: '',
    updated: '',
    tags: [],
    categories: [],
    summary: '',
    status: 'draft'
  };

  let currentKey = null;

  for (let index = 0; index < lines.length; index++) {
    const line = lines[index];
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed.startsWith('-') && currentKey) {
      const val = trimmed.slice(1).trim().replace(/^['"]|['"]$/g, '');
      if (Array.isArray(result[currentKey])) {
        result[currentKey].push(val);
      }
      continue;
    }

    const colonIdx = line.indexOf(':');
    if (colonIdx === -1) continue;

    const key = line.slice(0, colonIdx).trim();
    let val = line.slice(colonIdx + 1).trim();

    currentKey = key;

    if (val === '[]') {
      result[key] = [];
    } else if (val === '""' || val === "''") {
      result[key] = '';
    } else if (val.startsWith('-')) {
      result[key] = [];
    } else if (val) {
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        try {
          val = JSON.parse(val);
        } catch {
          val = val.slice(1, -1);
        }
      }
      if (key === 'tags' || key === 'categories') {
        result[key] = [val];
      } else {
        result[key] = val;
      }
    } else {
      if (key === 'tags' || key === 'categories') {
        result[key] = [];
      } else {
        result[key] = '';
      }
    }
  }

  return result;
}

export function generateUnifiedDiff(oldStr, newStr, filename = 'post.md') {
  const normalizedOld = String(oldStr || '').replace(/\r\n/g, '\n');
  const normalizedNew = String(newStr || '').replace(/\r\n/g, '\n');

  if (normalizedOld === normalizedNew) {
    const lines = normalizedOld ? normalizedOld.split('\n') : [];
    const diffLines = [
      `--- a/${filename}`,
      `+++ b/${filename}`,
      ...lines.map((l) => ` ${l}`)
    ];
    return {
      diffText: diffLines.join('\n'),
      addedLines: 0,
      removedLines: 0,
      frontmatterChanged: false,
      bodyChanged: false
    };
  }

  const oldLines = normalizedOld.split('\n');
  const newLines = normalizedNew.split('\n');

  // Find common prefix
  let prefix = 0;
  while (prefix < oldLines.length && prefix < newLines.length && oldLines[prefix] === newLines[prefix]) {
    prefix++;
  }

  // Find common suffix
  let suffix = 0;
  while (
    suffix < (oldLines.length - prefix) &&
    suffix < (newLines.length - prefix) &&
    oldLines[oldLines.length - 1 - suffix] === newLines[newLines.length - 1 - suffix]
  ) {
    suffix++;
  }

  const midOld = oldLines.slice(prefix, oldLines.length - suffix);
  const midNew = newLines.slice(prefix, newLines.length - suffix);

  const n = midOld.length;
  const m = midNew.length;

  let midResult = [];
  // Guard against Worker CPU / memory exhaustion
  if (n * m > 1_000_000) {
    for (const line of midOld) {
      midResult.push({ type: 'removed', line });
    }
    for (const line of midNew) {
      midResult.push({ type: 'added', line });
    }
  } else {
    const dp = Array.from({ length: n + 1 }, () => Array(m + 1).fill(0));
    for (let i = 1; i <= n; i++) {
      for (let j = 1; j <= m; j++) {
        if (midOld[i - 1] === midNew[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1] + 1;
        } else {
          dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
        }
      }
    }

    let i = n, j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && midOld[i - 1] === midNew[j - 1]) {
        midResult.unshift({ type: 'common', line: midOld[i - 1] });
        i--;
        j--;
      } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
        midResult.unshift({ type: 'added', line: midNew[j - 1] });
        j--;
      } else if (i > 0 && (j === 0 || dp[i][j - 1] < dp[i - 1][j])) {
        midResult.unshift({ type: 'removed', line: midOld[i - 1] });
        i--;
      }
    }
  }

  const diffLines = [`--- a/${filename}`, `+++ b/${filename}`];
  let addedLines = 0;
  let removedLines = 0;

  // Append prefix common lines
  for (let k = 0; k < prefix; k++) {
    diffLines.push(` ${oldLines[k]}`);
  }

  // Append middle diff lines
  for (const item of midResult) {
    if (item.type === 'added') {
      diffLines.push(`+${item.line}`);
      addedLines++;
    } else if (item.type === 'removed') {
      diffLines.push(`-${item.line}`);
      removedLines++;
    } else {
      diffLines.push(` ${item.line}`);
    }
  }

  // Append suffix common lines
  for (let k = oldLines.length - suffix; k < oldLines.length; k++) {
    diffLines.push(` ${oldLines[k]}`);
  }

  let frontmatterChanged = false;
  let bodyChanged = false;
  try {
    const oldParsed = parseDraftMarkdownDocument(oldStr);
    const newParsed = parseDraftMarkdownDocument(newStr);
    frontmatterChanged = JSON.stringify(oldParsed.frontmatter) !== JSON.stringify(newParsed.frontmatter);
    bodyChanged = oldParsed.body !== newParsed.body;
  } catch (err) {
    frontmatterChanged = true;
    bodyChanged = true;
  }

  return {
    diffText: diffLines.join('\n'),
    addedLines,
    removedLines,
    frontmatterChanged,
    bodyChanged
  };
}
