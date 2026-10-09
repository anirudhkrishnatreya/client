import { Navigate, Route, Routes, Link } from 'react-router-dom';
import Icon from './ui/Icon';
import AppShell from './shell/AppShell';
import { PlatformProvider } from './data/store';
import './theme/platform.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/400.css';
import '@fontsource/fraunces/600.css';
import logo from '../assets/imenteo_logo.png';
import StudentOverview from './student/Overview';
import StudentGoal from './student/Goal';
import StudentPlan from './student/Plan';
import StudentTasks from './student/Tasks';
import StudentAssessments from './student/Assessments';
import StudentLibrary from './student/Library';
import StudentReports from './student/Reports';
import StudentMentor from './student/Mentor';
import StudentCoach from './student/Coach';
import MentorOverview from './mentor/Overview';
import MentorStudents from './mentor/Students';
import MentorSessions from './mentor/Sessions';
import MentorTasks from './mentor/Tasks';
import MentorInsights from './mentor/Insights';
import ParentOverview from './parent/Overview';
import ParentProgress from './parent/Progress';
import ParentTasks from './parent/Tasks';
import ParentReports from './parent/Reports';
import ParentMentor from './parent/Mentor';

const ROLES = [
  { id: 'student', icon: 'cap', title: 'Student', text: 'Your goal, your week, your tasks, your assessments and your mentor, in one place.', color: 'var(--indigo)' },
  { id: 'mentor', icon: 'users', title: 'Mentor', text: 'Every student you guide: who needs you this week, what they are working on, and how they are growing.', color: 'var(--leaf)' },
  { id: 'parent', icon: 'heart', title: 'Parent', text: 'See how your child is doing, what has been set, how they scored, and what their mentor says.', color: 'var(--coral)' }
];

function Chooser() {
  return (
    <div className="pf" style={{ display: 'grid', placeItems: 'center', padding: 24 }}>
      <div style={{ maxWidth: 980, width: '100%' }}>
        <div className="pf-row" style={{ marginBottom: 28 }}><img src={logo} alt="iMenteo" style={{ height: 30 }} /><span className="pf-pill gold">Preview</span></div>
        <div className="pf-eyebrow">The learning platform</div>
        <h1 style={{ fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 400, lineHeight: 1.05, margin: '6px 0 12px' }}>Choose a dashboard to preview</h1>
        <p className="pf-muted" style={{ maxWidth: '58ch', marginBottom: 28 }}>Three views of the same journey: the student who is working towards a goal, the mentor who guides them every week, and the parent who follows along. Everything here uses sample students.</p>
        <div className="pf-grid g3">
          {ROLES.map(r => (
            <Link key={r.id} to={`/platform/${r.id}`} className="pf-role-card">
              <span className="pf-pill" style={{ width: 52, height: 52, borderRadius: 16, justifyContent: 'center', padding: 0, background: r.color, color: '#fff' }}><Icon name={r.icon} size={26} /></span>
              <h3 style={{ fontSize: 24, margin: '16px 0 6px' }}>{r.title}</h3><p className="pf-muted" style={{ marginBottom: 14 }}>{r.text}</p>
              <span style={{ fontWeight: 600, color: 'var(--indigo)', display: 'inline-flex', gap: 6, alignItems: 'center' }}>Open dashboard <Icon name="chevronRight" size={16} /></span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

const Role = ({ role, children }) => <PlatformProvider key={role} role={role}>{children}</PlatformProvider>;

export default function PlatformApp() {
  return (
    <Routes>
      <Route index element={<Chooser />} />
      <Route path="student" element={<Role role="student"><AppShell role="student" /></Role>}>
        <Route index element={<StudentOverview />} /><Route path="goal" element={<StudentGoal />} /><Route path="plan" element={<StudentPlan />} /><Route path="tasks" element={<StudentTasks />} />
        <Route path="assessments" element={<StudentAssessments />} /><Route path="library" element={<StudentLibrary />} /><Route path="reports" element={<StudentReports />} /><Route path="mentor" element={<StudentMentor />} /><Route path="coach" element={<StudentCoach />} />
      </Route>
      <Route path="mentor" element={<Role role="mentor"><AppShell role="mentor" /></Role>}>
        <Route index element={<MentorOverview />} /><Route path="students" element={<MentorStudents />} /><Route path="sessions" element={<MentorSessions />} /><Route path="tasks" element={<MentorTasks />} /><Route path="insights" element={<MentorInsights />} />
      </Route>
      <Route path="parent" element={<Role role="parent"><AppShell role="parent" /></Role>}>
        <Route index element={<ParentOverview />} /><Route path="progress" element={<ParentProgress />} /><Route path="tasks" element={<ParentTasks />} /><Route path="reports" element={<ParentReports />} /><Route path="mentor" element={<ParentMentor />} />
      </Route>
      <Route path="*" element={<Navigate to="/platform" replace />} />
    </Routes>
  );
}
