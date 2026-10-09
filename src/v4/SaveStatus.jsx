// Tells the student whether their answers are safe. Offline is reassuring, not alarming: nothing is lost.
export default function SaveStatus({ queue }) {
  const { state, pending } = queue;
  if (state === 'retrying') return <span className="v4-status warn" role="status">Offline — your answers are kept and will be sent when you reconnect ({pending} waiting)</span>;
  if (state === 'auth') return <span className="v4-status warn" role="status">Please sign in again to save your answers ({pending} waiting)</span>;
  if (state === 'saving' || pending > 0) return <span className="v4-status" role="status">Saving…</span>;
  return <span className="v4-status" role="status">All answers saved</span>;
}
