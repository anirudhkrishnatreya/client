// Perceptual speed: are the two codes exactly the same? Two big buttons; the answer is the option index (0 = Same, 1 = Different).
export default function PairItem({ item, value, onChange }) {
  return (
    <fieldset className="v4-item" id={`item-${item.id}`}>
      <legend>{item.text}</legend>
      <div className="v4-pair" aria-label={`Code one: ${item.pair[0].split('').join(' ')}. Code two: ${item.pair[1].split('').join(' ')}.`}>
        <span aria-hidden="true">{item.pair[0]}</span><span aria-hidden="true">{item.pair[1]}</span>
      </div>
      <div className="v4-bigchoices" role="radiogroup" aria-label="Same or different">
        {item.options.map((label, i) => (
          <button key={label} type="button" role="radio" aria-checked={value === i} className={`v4-btn${value === i ? '' : ' secondary'}`} onClick={() => onChange(i)}>{label}</button>
        ))}
      </div>
    </fieldset>
  );
}
