import { Card, Icon, PageHead } from '../ui/kit';

/** A tidy placeholder for the parts of the platform that are still being built. Says what is coming, with no made-up numbers. */
export default function ComingSoon({ eyebrow, title, intro, points = [], icon = 'sparkles' }) {
  return (
    <>
      <PageHead eyebrow={eyebrow} title={title}>{intro}</PageHead>
      <Card ai>
        <span className="tag"><Icon name={icon} size={14} />Coming soon</span>
        <p style={{ margin: '8px 0 10px' }}>This part of iMenteo is being built. Here is what it will do:</p>
        <ul className="pf-list">{points.map(p => <li key={p} style={{ borderColor: '#F3E3B8' }}><Icon name="check" size={16} />{p}</li>)}</ul>
      </Card>
    </>
  );
}
