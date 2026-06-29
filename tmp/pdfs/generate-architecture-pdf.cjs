const fs = require('fs');
const path = require('path');

const repoRoot = process.cwd();
const inputPath = path.join(repoRoot, 'docs', 'ARCHITECTURE.md');
const tmpDir = path.join(repoRoot, 'tmp', 'pdfs');
const outputDir = path.join(repoRoot, 'output', 'pdf');
const htmlPath = path.join(tmpDir, 'architecture.html');
const pdfPath = path.join(outputDir, 'architecture.pdf');
const screenshotPath = path.join(tmpDir, 'architecture-preview.png');

fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(outputDir, { recursive: true });

const markdown = fs.readFileSync(inputPath, 'utf8');

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function inlineMarkdown(value) {
  return escapeHtml(value).replace(/`([^`]+)`/g, '<code>$1</code>');
}

function isTableSeparator(line) {
  return /^\|?(\s*:?-{3,}:?\s*\|)+\s*:?-{3,}:?\s*\|?$/.test(line.trim());
}

function renderTable(tableLines) {
  const rows = tableLines
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => line.replace(/^\|/, '').replace(/\|$/, '').split('|').map(cell => cell.trim()));

  if (rows.length < 2) {
    return `<pre><code>${escapeHtml(tableLines.join('\n'))}</code></pre>`;
  }

  const header = rows[0];
  const bodyRows = rows.slice(1).filter((_, index) => !isTableSeparator(tableLines[index + 1] || ''));

  return [
    '<table>',
    '<thead><tr>',
    ...header.map(cell => `<th>${inlineMarkdown(cell)}</th>`),
    '</tr></thead>',
    '<tbody>',
    ...bodyRows.map(row => `<tr>${row.map(cell => `<td>${inlineMarkdown(cell)}</td>`).join('')}</tr>`),
    '</tbody>',
    '</table>',
  ].join('');
}

function renderList(items, ordered) {
  const tag = ordered ? 'ol' : 'ul';
  return `<${tag}>${items.map(item => `<li>${inlineMarkdown(item)}</li>`).join('')}</${tag}>`;
}

function renderParagraph(lines) {
  return `<p>${inlineMarkdown(lines.join(' '))}</p>`;
}

const lines = markdown.replace(/\r\n/g, '\n').split('\n');
const blocks = [];
let i = 0;

while (i < lines.length) {
  const line = lines[i];
  const trimmed = line.trim();

  if (!trimmed) {
    i += 1;
    continue;
  }

  if (trimmed.startsWith('```')) {
    const codeLines = [];
    i += 1;
    while (i < lines.length && !lines[i].trim().startsWith('```')) {
      codeLines.push(lines[i]);
      i += 1;
    }
    i += 1;
    blocks.push(`<pre><code>${escapeHtml(codeLines.join('\n'))}</code></pre>`);
    continue;
  }

  const headingMatch = /^(#{1,4})\s+(.*)$/.exec(trimmed);
  if (headingMatch) {
    const level = headingMatch[1].length;
    blocks.push(`<h${level}>${inlineMarkdown(headingMatch[2])}</h${level}>`);
    i += 1;
    continue;
  }

  if (/^\|.*\|$/.test(trimmed)) {
    const tableLines = [];
    while (i < lines.length && /^\|.*\|$/.test(lines[i].trim())) {
      tableLines.push(lines[i]);
      i += 1;
    }
    blocks.push(renderTable(tableLines));
    continue;
  }

  if (/^[-*]\s+/.test(trimmed)) {
    const items = [];
    while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
      items.push(lines[i].trim().replace(/^[-*]\s+/, ''));
      i += 1;
    }
    blocks.push(renderList(items, false));
    continue;
  }

  if (/^\d+\.\s+/.test(trimmed)) {
    const items = [];
    while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
      items.push(lines[i].trim().replace(/^\d+\.\s+/, ''));
      i += 1;
    }
    blocks.push(renderList(items, true));
    continue;
  }

  const paragraphLines = [trimmed];
  i += 1;
  while (i < lines.length) {
    const nextTrimmed = lines[i].trim();
    if (!nextTrimmed || nextTrimmed.startsWith('```') || /^(#{1,4})\s+/.test(nextTrimmed) || /^\|.*\|$/.test(nextTrimmed) || /^[-*]\s+/.test(nextTrimmed) || /^\d+\.\s+/.test(nextTrimmed)) {
      break;
    }
    paragraphLines.push(nextTrimmed);
    i += 1;
  }
  blocks.push(renderParagraph(paragraphLines));
}

const css = `
  @page {
    size: A4;
    margin: 16mm 14mm 18mm;
  }
  :root {
    color-scheme: light;
    --ink: #14243d;
    --muted: #51657f;
    --line: #d8e1ec;
    --soft: #f4f7fb;
    --accent: #0f4c81;
    --accent-soft: #e7f0fb;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    font-family: "Segoe UI", Arial, sans-serif;
    color: var(--ink);
    background: white;
    font-size: 10.5pt;
    line-height: 1.5;
  }
  main {
    max-width: 180mm;
    margin: 0 auto;
  }
  h1, h2, h3, h4 {
    color: #0e2f57;
    break-after: avoid-page;
    page-break-after: avoid;
    margin-top: 0;
  }
  h1 {
    font-size: 24pt;
    margin-bottom: 14pt;
    padding-bottom: 8pt;
    border-bottom: 2px solid var(--accent);
  }
  h2 {
    font-size: 16pt;
    margin-top: 20pt;
    margin-bottom: 8pt;
    padding: 6pt 8pt;
    background: var(--accent-soft);
    border-left: 4px solid var(--accent);
  }
  h3 {
    font-size: 12.5pt;
    margin-top: 14pt;
    margin-bottom: 6pt;
  }
  h4 {
    font-size: 11pt;
    margin-top: 10pt;
    margin-bottom: 4pt;
  }
  p { margin: 0 0 8pt; }
  ul, ol {
    margin: 0 0 10pt 18pt;
    padding: 0;
  }
  li { margin: 0 0 4pt; }
  code {
    font-family: Consolas, "Courier New", monospace;
    font-size: 9.3pt;
    background: #eef3f8;
    padding: 1pt 3pt;
    border-radius: 3px;
  }
  pre {
    margin: 8pt 0 12pt;
    padding: 10pt 11pt;
    background: #0f1722;
    color: #e8eef6;
    border-radius: 7px;
    overflow: hidden;
    white-space: pre-wrap;
    word-break: break-word;
    page-break-inside: avoid;
  }
  pre code {
    background: transparent;
    color: inherit;
    padding: 0;
    border-radius: 0;
    font-size: 8.9pt;
  }
  table {
    width: 100%;
    border-collapse: collapse;
    margin: 8pt 0 12pt;
    table-layout: fixed;
    page-break-inside: avoid;
  }
  th, td {
    border: 1px solid var(--line);
    padding: 6pt 7pt;
    text-align: left;
    vertical-align: top;
    word-break: break-word;
  }
  th {
    background: var(--soft);
    color: #15375d;
    font-weight: 700;
  }
  .meta {
    margin-bottom: 14pt;
    color: var(--muted);
    font-size: 9pt;
  }
`;

const html = `<!doctype html>
<html lang="pt">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Bentix Architecture</title>
  <style>${css}</style>
</head>
<body>
  <main>
    <div class="meta">Documento gerado a partir de <code>docs/ARCHITECTURE.md</code>.</div>
    ${blocks.join('\n')}
  </main>
</body>
</html>`;

fs.writeFileSync(htmlPath, html, 'utf8');
console.log(JSON.stringify({ inputPath, htmlPath, pdfPath, screenshotPath }, null, 2));
