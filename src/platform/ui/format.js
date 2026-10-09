const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const parse = s => { const [y, m, d] = String(s).slice(0, 10).split('-').map(Number); return new Date(y, m - 1, d); };
export const fmtDate = s => { const d = parse(s); return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const fmtShort = s => { const d = parse(s); return `${d.getDate()} ${MONTHS[d.getMonth()]}`; };
export const daysFromToday = s => { const t = new Date(); t.setHours(0, 0, 0, 0); return Math.round((parse(s) - t) / 86400000); };
export function dueLabel(s) {
  const n = daysFromToday(s);
  if (n === 0) return { text: 'Due today', tone: 'gold' };
  if (n === 1) return { text: 'Due tomorrow', tone: 'gold' };
  if (n < 0) return { text: `${-n} day${n === -1 ? '' : 's'} ago`, tone: 'grey' };
  return { text: `Due ${fmtDate(s)}`, tone: 'grey' };
}
export const greeting = () => { const h = new Date().getHours(); return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'; };
export const hm = mins => (mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim() : `${mins}m`);
export const TYPE_LABEL = { learn: 'Learn', practice: 'Practice', assess: 'Assessment', project: 'Project', revise: 'Revise', rest: 'Rest' };
