import { Fragment } from 'react';

// The little formatting the coach may use: **bold**, *italic*, `code`, "- " lists and "1. " lists, paragraphs. Everything is
// built as React elements, so nothing the model writes is ever treated as HTML.
function inline(text) {
  const out = []; const re = /(\*\*[^*\n]+\*\*|`[^`\n]+`|\*[^*\s][^*\n]*\*)/g;
  let last = 0; let m; let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    out.push(t.startsWith('**') ? <b key={k++}>{t.slice(2, -2)}</b> : t.startsWith('`') ? <code key={k++}>{t.slice(1, -1)}</code> : <em key={k++}>{t.slice(1, -1)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

const BULLET = /^\s*[-*•]\s+/, NUMBER = /^\s*\d+[.)]\s+/;

export default function Markdown({ text }) {
  const out = [];
  let para = [], list = null;
  const flushPara = () => { if (para.length) out.push(<p key={out.length}>{para.map((l, j) => <Fragment key={j}>{j > 0 && <br />}{inline(l)}</Fragment>)}</p>); para = []; };
  const flushList = () => { if (list) { const L = list.ordered ? 'ol' : 'ul'; out.push(<L key={out.length}>{list.items.map((l, j) => <li key={j}>{inline(l)}</li>)}</L>); list = null; } };
  for (const line of String(text || '').split('\n')) {
    if (!line.trim()) { flushPara(); flushList(); continue; }
    const ordered = NUMBER.test(line), bullet = BULLET.test(line);
    if (ordered || bullet) {
      flushPara();
      if (list && list.ordered !== ordered) flushList();
      if (!list) list = { ordered, items: [] };
      list.items.push(line.replace(ordered ? NUMBER : BULLET, ''));
    } else { flushList(); para.push(line); }
  }
  flushPara(); flushList();
  return <div className="pf-md">{out}</div>;
}
