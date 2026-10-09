// A plain-language summary of what happens to a student's information. Every statement here is something the system
// actually does (see server/docs/COMPLIANCE.md). It is NOT the legal terms, which are still to be written with counsel.
export default function PrivacySummary() {
  return (
    <details className="v4-card" style={{ padding: 16 }}>
      <summary style={{ cursor: 'pointer', fontWeight: 600 }}>What we do with your information</summary>
      <ul style={{ margin: '12px 0 0 18px', fontSize: 14, lineHeight: 1.7 }}>
        <li>We keep your name, email and date of birth, your answers, and the results we work out from them.</li>
        <li>We use them only to make your career guidance report. We do not sell them or use them for advertising.</li>
        <li>Your school can see your individual report only if you (or, if you are under 18, your parent or guardian) agree. The default is no.</li>
        <li>If your school uses iMenteo, its counsellor sees who has finished and summaries of the whole class, never a list of your answers.</li>
        <li>You can withdraw at any time and ask for your information to be deleted.</li>
      </ul>
      <p className="v4-muted" style={{ marginTop: 10 }}>This is a short summary. The full terms are being finalised.</p>
    </details>
  );
}
