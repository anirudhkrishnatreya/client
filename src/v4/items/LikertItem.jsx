// One statement answered on a 5-point scale. `labels` come from the block (agreement, like/dislike or importance).
export default function LikertItem({ item, labels, value, onChange, flagged = false }) {
  return (
    <fieldset className={`v4-item${flagged ? ' flagged' : ''}`} id={`item-${item.id}`} aria-invalid={flagged || undefined}>
      <legend>{item.text}</legend>
      <div className="v4-likert" role="radiogroup" aria-label={item.text}>
        {labels.map((label, i) => (
          <label key={label}>
            <input type="radio" name={item.id} value={i + 1} checked={value === i + 1} onChange={() => onChange(i + 1)} />
            <span>{label}</span>
          </label>
        ))}
      </div>
      {flagged && <p className="v4-err" role="alert" style={{ color: 'var(--red)', fontSize: 13, marginTop: 6 }}>Please choose an answer.</p>}
    </fieldset>
  );
}
