import test from 'node:test';
import assert from 'node:assert/strict';

/**
 * renderSafeMarkdown — mirrors the implementation in apps/admin/src/app.js.
 * This copy is maintained here for testability in Node.js environments
 * since the admin app.js runs in the browser.
 *
 * IMPORTANT: Any changes to the renderSafeMarkdown function in apps/admin/src/app.js
 * must be reflected here to keep tests accurate.
 */
function renderSafeMarkdown(markdown) {
  if (!markdown || !markdown.trim()) return '';

  function escapeHtml(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  const escaped = escapeHtml(markdown);

  const codeBlocks = [];
  let processed = escaped.replace(/```(?:[a-zA-Z]*)\n([\s\S]*?)```/g, (_, code) => {
    const index = codeBlocks.length;
    codeBlocks.push(`<pre><code>${code.replace(/\n$/, '')}</code></pre>`);
    return `\x00CODEBLOCK_${index}\x00`;
  });

  processed = processed.replace(/`([^`]+)`/g, '<code>$1</code>');
  processed = processed.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  processed = processed.replace(/(?<!\*)\*([^*]+)\*(?!\*)/g, '<em>$1</em>');
  processed = processed.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, text, url) => {
      const trimmedUrl = url.trim();
      if (/^https?:\/\//i.test(trimmedUrl) || /^mailto:/i.test(trimmedUrl)) {
        return `<a href="${trimmedUrl}" rel="noopener noreferrer">${text}</a>`;
      }
      return `${text} (${trimmedUrl})`;
    }
  );

  const lines = processed.split('\n');
  const outputBlocks = [];
  let currentList = null;
  let paragraphLines = [];

  function flushParagraph() {
    if (paragraphLines.length > 0) {
      outputBlocks.push(`<p>${paragraphLines.join('<br>')}</p>`);
      paragraphLines = [];
    }
  }

  function flushList() {
    if (currentList) {
      const tag = currentList.type;
      outputBlocks.push(`<${tag}>${currentList.items.map(i => `<li>${i}</li>`).join('')}</${tag}>`);
      currentList = null;
    }
  }

  for (const line of lines) {
    const trimmed = line.trim();

    const codeMatch = trimmed.match(/^\x00CODEBLOCK_(\d+)\x00$/);
    if (codeMatch) {
      flushParagraph();
      flushList();
      outputBlocks.push(codeBlocks[parseInt(codeMatch[1], 10)]);
      continue;
    }

    const headerMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headerMatch) {
      flushParagraph();
      flushList();
      const level = headerMatch[1].length;
      outputBlocks.push(`<h${level}>${headerMatch[2]}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ul') {
        flushList();
        currentList = { type: 'ul', items: [] };
      }
      currentList.items.push(trimmed.replace(/^[-*]\s+/, ''));
      continue;
    }

    if (/^\d+\.\s+/.test(trimmed)) {
      flushParagraph();
      if (!currentList || currentList.type !== 'ol') {
        flushList();
        currentList = { type: 'ol', items: [] };
      }
      currentList.items.push(trimmed.replace(/^\d+\.\s+/, ''));
      continue;
    }

    if (trimmed === '') {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraphLines.push(trimmed);
  }

  flushParagraph();
  flushList();

  return outputBlocks.join('\n');
}

// ─── XSS Prevention Tests ─────────────────────────────────────────────

test('XSS: <script>alert(1)</script> is escaped and not executable', () => {
  const result = renderSafeMarkdown('<script>alert(1)</script>');
  assert.ok(!result.includes('<script>'), 'Output must not contain raw <script> tags');
  assert.ok(result.includes('&lt;script&gt;'), 'Script tags must be HTML-escaped');
});

test('XSS: <img src=x onerror=alert(1)> is escaped and not executable', () => {
  const result = renderSafeMarkdown('<img src=x onerror=alert(1)>');
  assert.ok(!result.includes('<img'), 'Output must not contain raw <img> tags');
  assert.ok(result.includes('&lt;img'), 'Img tags must be HTML-escaped');
});

test('XSS: javascript: protocol in links is not rendered as href', () => {
  const result = renderSafeMarkdown('[click me](javascript:alert(1))');
  assert.ok(!result.includes('href="javascript:'), 'Output must not contain javascript: protocol links');
  // The link text should still appear but not as a clickable dangerous link
  assert.ok(result.includes('click me'), 'Link text should still be visible');
});

test('XSS: data: protocol in links is not rendered as href', () => {
  const result = renderSafeMarkdown('[click](data:text/html,<script>alert(1)</script>)');
  assert.ok(!result.includes('href="data:'), 'Output must not contain data: protocol links');
});

test('XSS: nested HTML injection via markdown is escaped', () => {
  const result = renderSafeMarkdown('**<script>alert(1)</script>**');
  assert.ok(!result.includes('<script>'), 'Nested HTML in bold must be escaped');
  assert.ok(result.includes('&lt;script&gt;'), 'Nested script must be HTML-escaped');
});

test('XSS: event handler attributes are escaped', () => {
  const result = renderSafeMarkdown('<div onmouseover="alert(1)">hover me</div>');
  assert.ok(!result.includes('<div'), 'Raw div tags must not appear in output');
  assert.ok(result.includes('&lt;div'), 'Div tags must be HTML-escaped');
  assert.ok(!result.includes('<div onmouseover'), 'Event handler must not be in an executable context');
});

// ─── Markdown Rendering Tests ──────────────────────────────────────────

test('Markdown: headers render correctly', () => {
  const result = renderSafeMarkdown('# Hello\n\n## World');
  assert.ok(result.includes('<h1>Hello</h1>'), 'H1 should render');
  assert.ok(result.includes('<h2>World</h2>'), 'H2 should render');
});

test('Markdown: paragraphs render correctly', () => {
  const result = renderSafeMarkdown('First paragraph\n\nSecond paragraph');
  assert.ok(result.includes('<p>First paragraph</p>'), 'First paragraph should render');
  assert.ok(result.includes('<p>Second paragraph</p>'), 'Second paragraph should render');
});

test('Markdown: bold and italic render correctly', () => {
  const result = renderSafeMarkdown('**bold** and *italic*');
  assert.ok(result.includes('<strong>bold</strong>'), 'Bold should render');
  assert.ok(result.includes('<em>italic</em>'), 'Italic should render');
});

test('Markdown: inline code renders correctly', () => {
  const result = renderSafeMarkdown('Use `console.log()` here');
  assert.ok(result.includes('<code>console.log()</code>'), 'Inline code should render');
});

test('Markdown: safe links render correctly', () => {
  const result = renderSafeMarkdown('[Visit](https://example.com)');
  assert.ok(result.includes('href="https://example.com"'), 'HTTPS links should render');
  assert.ok(result.includes('rel="noopener noreferrer"'), 'Links should have noopener');
});

test('Markdown: mailto links render correctly', () => {
  const result = renderSafeMarkdown('[Email](mailto:test@example.com)');
  assert.ok(result.includes('href="mailto:test@example.com"'), 'Mailto links should render');
});

test('Markdown: unordered lists render correctly', () => {
  const result = renderSafeMarkdown('- Item 1\n- Item 2\n- Item 3');
  assert.ok(result.includes('<ul>'), 'UL tag should render');
  assert.ok(result.includes('<li>Item 1</li>'), 'List items should render');
});

test('Markdown: ordered lists render correctly', () => {
  const result = renderSafeMarkdown('1. First\n2. Second');
  assert.ok(result.includes('<ol>'), 'OL tag should render');
  assert.ok(result.includes('<li>First</li>'), 'Ordered list items should render');
});

test('Markdown: empty input returns empty string', () => {
  assert.equal(renderSafeMarkdown(''), '');
  assert.equal(renderSafeMarkdown('   '), '');
  assert.equal(renderSafeMarkdown(null), '');
  assert.equal(renderSafeMarkdown(undefined), '');
});

test('Markdown: fenced code blocks render correctly', () => {
  const result = renderSafeMarkdown('```js\nconst x = 1;\n```');
  assert.ok(result.includes('<pre><code>'), 'Code block should render');
  assert.ok(result.includes('const x = 1;'), 'Code content should be preserved');
});
