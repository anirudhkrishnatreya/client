import { Link, useNavigate } from 'react-router-dom';
import { usePlatform } from '../data/store';
import { Avatar, Bars, Card, CardHead, Check, Heat, Icon, Pill, Progress, Radar, Ring, Stat } from '../ui/kit';
import { dueLabel, fmtDate, greeting, hm, TYPE_LABEL } from '../ui/format';
import { iso } from '../data/mock';

export default function Overview() {
  const { data, actions } = usePlatform();
  const nav = useNavigate();
  const todayIso = iso(new Date());
  const todays = data.week.filter(b => b.date === todayIso);
  const open = data.tasks.filter(t => t.status !== 'done').sort((a, b) => a.due.localeCompare(b.due));
  const mins = data.weekMinutes.reduce((n, d) => n + d.value, 0);
  const last = data.assessments.past[0];
  const next = data.assessments.upcoming[0];
  const doneToday = todays.filter(b => b.done).length;
  const dayLabel = data.weekMinutes[(new Date().getDay() + 6) % 7].label;

  return (
    <>
      <Card className="pf-hero" style={{ marginBottom: 18 }}>
        <div className="pf-row pf-wrap" style={{ gap: 28, position: 'relative', zIndex: 1 }}>
          <div className="pf-grow" style={{ minWidth: 260 }}>
            <div className="pf-eyebrow">{greeting()}, {data.me.firstName}</div>
            <h2 style={{ margin: '6px 0 8px' }}>{todays.length ? `${todays.length - doneToday} study block${todays.length - doneToday === 1 ? '' : 's'} left today` : 'A light day. Rest or catch up.'}</h2>
            <p>You are {data.goal.progress}% of the way to becoming an <b style={{ color: '#fff' }}>{data.goal.title}</b>. Keep your {data.me.streak}-day streak going.</p>
            <div className="pf-row pf-wrap" style={{ marginTop: 14 }}>
              <button type="button" className="pf-btn gold" onClick={() => nav('plan')}><Icon name="play" size={16} />Open today’s plan</button>
              <button type="button" className="pf-btn ghost" onClick={() => nav('coach')} style={{ background: 'rgba(255,255,255,.1)', color: '#fff', borderColor: 'rgba(255,255,255,.25)' }}><Icon name="sparkles" size={16} />Ask the AI coach</button>
            </div>
          </div>
          <div className="pf-row" style={{ gap: 20 }}>
            <Ring value={data.goal.progress} size={112} stroke={11} color="#F2A93B" ink="#fff" sub="to goal" />
            <div style={{ textAlign: 'center' }}><div style={{ fontFamily: 'Fraunces, Georgia, serif', fontSize: 40, color: '#fff', lineHeight: 1 }}>{data.me.streak}</div><div className="pf-small" style={{ color: '#C3CAEA' }}><Icon name="flame" size={14} /> day streak</div></div>
          </div>
        </div>
      </Card>

      <div className="pf-grid g4" style={{ marginBottom: 18 }}>
        <Stat label="Study time this week" value={hm(mins)} delta="+18 min on last week" icon="clock" />
        <Stat label="Tasks still open" value={open.length} hint={open[0] ? `Next: ${dueLabel(open[0].due).text.toLowerCase()}` : 'All caught up'} icon="tasks" />
        <Stat label="Latest check-in" value={`${last.score}%`} delta={`${last.score - data.assessments.past[data.assessments.past.length - 1].score >= 0 ? '+' : ''}${last.score - data.assessments.past[data.assessments.past.length - 1].score} since your first`} icon="clipboard" />
        <Stat label="School marks" value="78%" hint="Steady this term" icon="cap" />
      </div>

      <div className="pf-grid g-main" style={{ marginBottom: 18 }}>
        <Card>
          <CardHead title="Today" action="Full week" to="plan" icon="calendar" />
          {todays.length === 0 && <div className="pf-muted">Nothing is planned for today.</div>}
          <ul className="pf-list">
            {todays.map(b => (
              <li key={b.id}>
                <Check on={b.done} onClick={() => actions.toggleBlock(b.id)} label={`Mark ${b.title} as done`} />
                <div className="pf-grow"><div style={{ fontWeight: 600, textDecoration: b.done ? 'line-through' : 'none', color: b.done ? 'var(--faint)' : 'var(--ink)' }}>{b.title}</div><div className="pf-small pf-muted">{b.start}–{b.end} · {b.subject}</div></div>
                <Pill tone={{ learn: 'sky', practice: 'leaf', assess: 'coral', project: 'gold', revise: '', rest: 'grey' }[b.type]}>{TYPE_LABEL[b.type]}</Pill>
              </li>
            ))}
          </ul>
          <div className="pf-divider" />
          <CardHead title="Up next" action="All tasks" to="tasks" icon="tasks" />
          <ul className="pf-list">
            {open.slice(0, 3).map(t => { const d = dueLabel(t.due); return (
              <li key={t.id}><div className="pf-grow"><div style={{ fontWeight: 600 }}>{t.title}</div><div className="pf-small pf-muted">{t.subject} · about {t.est} min · from {t.by}</div></div><Pill tone={d.tone}>{d.text}</Pill></li>
            ); })}
          </ul>
        </Card>

        <div className="pf-grid" style={{ alignContent: 'start' }}>
          <Card ai>
            <span className="tag"><Icon name="sparkles" size={14} />Why your week looks like this</span>
            <ul className="pf-list" style={{ marginTop: 8 }}>{data.aiPlan.why.map(w => <li key={w.text} style={{ alignItems: 'flex-start', borderColor: '#F3E3B8' }}><Icon name={w.icon} size={18} className="pf-faint" /><span className="pf-grow" style={{ fontSize: 14 }}>{w.text}</span></li>)}</ul>
            <Link to="plan" className="pf-btn sm ghost" style={{ marginTop: 6 }}>See the plan</Link>
          </Card>
          <Card>
            <CardHead title="Your mentor" action="Open" to="mentor" icon="users" />
            <div className="pf-row"><Avatar name={data.mentor.name} size={44} /><div className="pf-grow"><b>{data.mentor.name}</b><div className="pf-small pf-muted">{data.mentor.role}</div></div></div>
            <div className="pf-note" style={{ marginTop: 12 }}><b>{fmtDate(data.mentor.next.date)}, {data.mentor.next.time}</b><br />{data.mentor.next.topic}</div>
          </Card>
          <Card>
            <CardHead title="Coming up" action="Assessments" to="assessments" icon="clipboard" />
            {next ? <><b>{next.title}</b><div className="pf-small pf-muted">{fmtDate(next.due)} · {next.mins} min{next.questions ? ` · ${next.questions} questions` : ''}</div></> : <div className="pf-muted">Nothing scheduled.</div>}
          </Card>
        </div>
      </div>

      <div className="pf-grid g3">
        <Card><CardHead title="Study minutes" icon="clock" /><Bars data={data.weekMinutes} highlight={dayLabel} color="#6F7DC6" unit=" min" /></Card>
        <Card><CardHead title="Skills toward your goal" icon="target" /><Radar data={data.skills} size={290} />
          <div className="pf-row pf-small pf-muted" style={{ justifyContent: 'center', gap: 16 }}><span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#2C3566', marginRight: 6 }} />Now</span><span><i style={{ display: 'inline-block', width: 10, height: 10, borderRadius: 3, background: '#F2A93B', marginRight: 6 }} />Target</span></div></Card>
        <Card><CardHead title="Goal pillars" action="My goal" to="goal" icon="layers" />
          {data.pillars.map(p => <div key={p.id} style={{ marginBottom: 12 }}><div className="pf-row pf-between pf-small" style={{ marginBottom: 5 }}><span>{p.label}</span><b className="pf-num">{p.pct}%</b></div><Progress value={p.pct} tone={p.tone} label={p.label} /></div>)}
          <div className="pf-divider" /><div className="pf-small pf-muted" style={{ marginBottom: 6 }}>Last 12 weeks</div><Heat values={data.heat} /></Card>
      </div>
    </>
  );
}
