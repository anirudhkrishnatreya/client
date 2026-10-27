/** What people ask before paying: how it works, who pays, and the refund rules. Shown on the price page and on My plan. */
export default function PayFaq() {
  return (
    <section className="pay-faq" aria-label="Questions about paying">
      <h2 className="pay-h">Before you pay</h2>
      <details open><summary>What is the difference between the assessment and a plan?</summary>
        <p>The Career Assessment tells you where you might go: a full test and report with career matches. A plan helps you get there: weekly plans, practice, assessments that adapt, and a one-to-one session with a mentor every week. The 3, 6 and 12-month plans include the assessment.</p></details>
      <details><summary>How long does a plan last, and what happens when it ends?</summary>
        <p>A plan runs for the months you choose from the day you pay. Buying again before it ends adds the new time to the end. We remind you before it ends. After it ends you have 3 more days, then your account becomes read-only: you keep everything you made and can look at it, but cannot plan new weeks until you renew. Nothing is deleted.</p></details>
      <details><summary>Does it renew by itself?</summary>
        <p>No. Plans are paid once, for the time you choose. We will never charge you again without you choosing to.</p></details>
      <details><summary>I am under 18. Who should pay?</summary>
        <p>Please ask a parent or guardian to pay, or to be with you when you pay. The receipt is emailed to the account you pay from.</p></details>
      <details><summary>Is GST added?</summary>
        <p>The price you see is the price you pay. No GST is added at the moment.</p></details>
      <details id="refunds"><summary>Can I get a refund?</summary>
        <p><b>Assessment:</b> a full refund within 7 days of buying, if you have not started the test.</p>
        <p><b>Plans:</b> a full refund within 7 days of buying. After 7 days, we refund whole unused months, minus any mentor sessions already held. A 12-month plan can be cancelled with a pro-rata refund in the first 3 months.</p>
        <p>Write to us to ask. Refunds go back to the way you paid, in 5 to 7 working days, and your access ends when the refund is made.</p></details>
      <details><summary>Which payment methods work?</summary>
        <p>UPI, debit and credit cards, net banking and wallets, through Razorpay. We never see or store your card or UPI details.</p></details>
    </section>
  );
}
