import { usePlatform } from '../../data/store';
import { Card, Empty, PageHead } from '../../ui/kit';

/** A parent with several children picks one here; every parent page shows the picker and the chosen child. */
export function ChildPicker() {
  const { data, actions } = usePlatform();
  if (data.children.length < 2) return null;
  return (
    <label className="pf-small pf-muted" style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>Child
      <select className="pf-select" style={{ width: 'auto' }} aria-label="Choose child" value={data.child ? data.child.id : ''} onChange={e => actions.selectChild(e.target.value)}>{data.children.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
  );
}

/** Wraps a parent page: shows a friendly note when no child is linked yet. */
export function WithChild({ eyebrow, title, intro, children }) {
  const { data } = usePlatform();
  if (!data.child) return <><PageHead eyebrow={eyebrow} title={title}>{intro}</PageHead><Card><Empty icon="users" title="No child linked yet">When your child’s account is confirmed, you will see their progress here.</Empty></Card></>;
  return <><PageHead eyebrow={eyebrow} title={typeof title === 'function' ? title(data.child) : title} actions={<ChildPicker />}>{typeof intro === 'function' ? intro(data.child) : intro}</PageHead>{children(data)}</>;
}
