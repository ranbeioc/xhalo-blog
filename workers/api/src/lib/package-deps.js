// Dependency edits to a target site's package.json must travel with its lockfile: the site builds with
// `npm ci`, which refuses a package.json/lockfile mismatch. The Worker cannot run npm to regenerate a
// lockfile, so config saves may change anything in package.json except the dependency sections.

export const DEPENDENCY_SECTIONS = ['dependencies', 'devDependencies', 'optionalDependencies', 'peerDependencies'];

export const LOCKFILE_PATHS = ['package-lock.json', 'npm-shrinkwrap.json', 'pnpm-lock.yaml', 'yarn.lock'];

function sectionOf(pkg, section) {
  const value = pkg && typeof pkg === 'object' ? pkg[section] : null;
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

// Returns one entry per added, removed or re-specified package, e.g. "dependencies:hexo-filter-mathjax".
export function changedDependencies(currentText, nextText) {
  let current;
  let next;
  try {
    current = JSON.parse(currentText || '{}');
  } catch {
    current = {};
  }
  try {
    next = JSON.parse(nextText || '{}');
  } catch {
    return [];
  }
  const changes = [];
  for (const section of DEPENDENCY_SECTIONS) {
    const before = sectionOf(current, section);
    const after = sectionOf(next, section);
    for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
      if (before[name] !== after[name]) changes.push(`${section}:${name}`);
    }
  }
  return changes.sort();
}

// First lockfile present on the branch, or '' when the site has none (then `npm install` resolves freshly).
// The contents API omits the body of files over 1 MB, which getFileContentFromBranch reports as a 404 with
// code FILE_CONTENT_EMPTY; a large lockfile still exists.
export async function findLockfile(readFile) {
  for (const filePath of LOCKFILE_PATHS) {
    try {
      await readFile(filePath);
      return filePath;
    } catch (err) {
      if (err?.code === 'FILE_CONTENT_EMPTY') return filePath;
      if (err?.status !== 404) throw err;
    }
  }
  return '';
}
