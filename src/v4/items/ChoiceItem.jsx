import { svgToDataUri } from '../svg';

// A multiple-choice question: aptitude items (text or picture options) and situational-judgement scenarios.
// Pictures are shown through <img> with the server's plain-language alt text; they are never injected as markup.
export default function ChoiceItem({ item, value, onChange, flagged = false }) {
  const figure = item.figure;
  const pictureOptions = figure && figure.options && figure.options.length > 0;
  return (
    <fieldset className={`v4-item${flagged ? ' flagged' : ''}`} id={`item-${item.id}`}>
      <legend>{item.text}</legend>
      {figure && figure.stimulus && <img className="v4-figure" src={svgToDataUri(figure.stimulus.svg)} alt={figure.stimulus.alt} />}
      {pictureOptions ? (
        <div className="v4-images" role="radiogroup" aria-label="Answer options">
          {figure.options.map((o, i) => (
            <label key={i} className="v4-image-choice">
              <input type="radio" name={item.id} value={i} checked={value === i} onChange={() => onChange(i)} />
              <img src={svgToDataUri(o.svg)} alt={o.alt} />
              <strong aria-hidden="true">{'ABCDE'[i]}</strong>
            </label>
          ))}
        </div>
      ) : (
        <div className="v4-choices" role="radiogroup" aria-label="Answer options">
          {item.options.map((text, i) => (
            <label key={i} className="v4-choice">
              <input type="radio" name={item.id} value={i} checked={value === i} onChange={() => onChange(i)} />
              <span>{text}</span>
            </label>
          ))}
        </div>
      )}
      {flagged && <p role="alert" style={{ color: 'var(--red)', fontSize: 13, marginTop: 8 }}>Please choose an answer.</p>}
    </fieldset>
  );
}
