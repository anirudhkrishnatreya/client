import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Card, CardHead, Icon, PageHead } from '../../ui/kit';
import { observeApi, errMessage, saveFile } from '../liveApi';
import { Head360 } from './parts';
import { ObservatoryBody } from './Observatory';

/** "What my mentor sees": the student's own observatory (no private notes), who has looked at it, and a copy of their data. */
export default function MyMentorView() {
  const [sp, setSp] = useSearchParams();
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  const tab = sp.get('tab') || 'overview';
  const load = useCallback(() => observeApi.mine().then(setD).catch(e => setErr(errMessage(e))), []);
  useEffect(() => { load(); }, [load]);
  const download = async () => { try { saveFile(await observeApi.myData(), 'my-imenteo-data.json'); } catch (x) { setErr(errMessage(x)); } };
  if (!d) return <><PageHead eyebrow="Your data" title="What my mentor sees" /><p role={err ? 'alert' : 'status'}>{err || 'Loading…'}</p></>;
  return (
    <>
      <PageHead eyebrow="Your data" title="What my mentor sees" actions={<button type="button" className="pf-btn ghost" onClick={download}><Icon name="download" size={15} />Download my data</button>}>
        This is the same picture your mentor (and your school’s staff) can see, so nothing about you is hidden from you. Your mentor’s private notes are the only thing not shown.
      </PageHead>
      <Head360 h={d.profile.header} />
      <ObservatoryBody p={d.profile} reload={load} tab={tab} setTab={id => setSp(id === 'overview' ? {} : { tab: id }, { replace: true })} />
      <Card style={{ marginTop: 18 }}><CardHead title="Who has looked, in the last 30 days" icon="eye" />
        {d.views.length === 0 ? <p className="pf-small pf-muted" style={{ margin: 0 }}>Nobody yet.</p> :
          <ul className="pf-list">{d.views.slice(0, 20).map((v, i) => <li key={i} className="pf-small"><span className="pf-grow"><b>{v.name}</b> ({v.role}) opened your {v.what}</span><span className="pf-faint">{new Date(v.at).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}</span></li>)}</ul>}
      </Card>
    </>
  );
}
