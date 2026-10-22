import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Icon from './ui/Icon';
import AppShell from './shell/AppShell';
import { PlatformProvider } from './data/store';
import LiveProvider from './live/LiveProvider';
import ComingSoon from './live/ComingSoon';
import ReportPage from './live/ReportPage';
import LiveStudentOverview from './live/student/Overview';
import LiveGoal from './live/student/Goal';
import LiveAssessments from './live/student/Assessments';
import LiveReports from './live/student/Reports';
import LiveMentor from './live/student/Mentor';
import LiveMentorOverview from './live/mentor/Overview';
import LiveStudents from './live/mentor/Students';
import LiveSessions from './live/mentor/Sessions';
import LiveMentorTasks from './live/mentor/Tasks';
import LiveInsights from './live/mentor/Insights';
import LiveParentOverview from './live/parent/Overview';
import LiveParentProgress from './live/parent/Progress';
import LiveParentTasks from './live/parent/Tasks';
import LiveParentReports from './live/parent/Reports';
import LiveParentMentor from './live/parent/Mentor';
import { REC_ENABLED } from './live/careers/config';
import { LOOP_ENABLED } from './live/loop/config';
import './theme/platform.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/syne/700.css';
import '@fontsource/montserrat/600.css';
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

// The career explorer is loaded only when someone opens it, so it adds nothing to the first load of the dashboards.
const Explore = lazy(() => import('./live/careers/Explore'));
const Occupation = lazy(() => import('./live/careers/Occupation'));
const Matches = lazy(() => import('./live/careers/Matches'));
const Shortlist = lazy(() => import('./live/careers/Shortlist'));
const Situation = lazy(() => import('./live/careers/Situation'));
const LoopGoal = lazy(() => import('./live/loop/LoopGoal'));
const LoopPlan = lazy(() => import('./live/loop/LoopPlan'));
const LoopRoadmap = lazy(() => import('./live/loop/LoopRoadmap'));
const later = el => <Suspense fallback={<p role="status">Loading…</p>}>{el}</Suspense>;

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
            <Link key={r.id} to={`/platform/preview/${r.id}`} className="pf-role-card">
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

// Where each kind of account belongs after signing in.
export const HOME_OF = { student: '/platform/student', mentor: '/platform/mentor', parent: '/platform/parent', counsellor: '/v4/school' };

/** Real dashboards: a signed-in person of the right role, with data from the server. */
function Gate({ role }) {
  const { user, isLoggedIn, loading } = useAuth();
  if (loading) return null;
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const mine = (user.role || 'student');
  if (mine !== role) return <Navigate to={HOME_OF[mine] || '/'} replace />;
  return <LiveProvider key={role} role={role}><AppShell role={role} /></LiveProvider>;
}
function SignedIn() { const { isLoggedIn, loading } = useAuth(); if (loading) return null; return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />; }
function Home() { const { user, isLoggedIn, loading } = useAuth(); if (loading) return null; return <Navigate to={isLoggedIn ? HOME_OF[user.role || 'student'] || '/' : '/login'} replace />; }

const soon = {
  plan: <ComingSoon eyebrow="Weekly plan" title="Your week, planned for you" intro="A study plan built around your goal, your marks and the time you have." points={['A day-by-day plan with the exact sources to study from', 'Changes automatically when a check-in shows a gap', 'Every block explains why it is there']} icon="calendar" />,
  coach: <ComingSoon eyebrow="AI coach" title="Ask anything about your plan" intro="A coach that knows your goal, your plan and your scores." points={['Explains topics in simple words', 'Adjusts your week when time is short', 'Suggests the next best step']} />
};

export default function PlatformApp() {
  return (
    <Routes>
      <Route index element={<Home />} />

      {/* Real dashboards */}
      <Route path="student" element={<Gate role="student" />}>
        <Route index element={<LiveStudentOverview />} />
        {LOOP_ENABLED
          ? <><Route path="goal" element={later(<LoopGoal />)} /><Route path="plan" element={later(<LoopPlan />)} /><Route path="plan/roadmap" element={later(<LoopRoadmap />)} /></>
          : <><Route path="goal" element={<LiveGoal />} /><Route path="plan" element={soon.plan} /></>}
        <Route path="tasks" element={<StudentTasks />} />
        <Route path="assessments" element={<LiveAssessments />} /><Route path="library" element={<StudentLibrary live />} /><Route path="reports" element={<LiveReports />} /><Route path="mentor" element={<LiveMentor />} /><Route path="coach" element={soon.coach} />
        {REC_ENABLED && <>
          <Route path="careers" element={later(<Matches />)} /><Route path="explore" element={later(<Explore />)} /><Route path="explore/:slug" element={later(<Occupation />)} />
          <Route path="shortlist" element={later(<Shortlist />)} /><Route path="situation" element={later(<Situation />)} />
        </>}
      </Route>
      <Route path="mentor" element={<Gate role="mentor" />}>
        <Route index element={<LiveMentorOverview />} /><Route path="students" element={<LiveStudents />} /><Route path="sessions" element={<LiveSessions />} /><Route path="tasks" element={<LiveMentorTasks />} /><Route path="insights" element={<LiveInsights />} />
      </Route>
      <Route path="parent" element={<Gate role="parent" />}>
        <Route index element={<LiveParentOverview />} /><Route path="progress" element={<LiveParentProgress />} /><Route path="tasks" element={<LiveParentTasks />} /><Route path="reports" element={<LiveParentReports />} /><Route path="mentor" element={<LiveParentMentor />} />
      </Route>
      <Route element={<SignedIn />}><Route path="report/:kind/:personId/:assessmentId" element={<ReportPage />} /></Route>

      {/* Preview on made-up data (no sign-in) */}
      <Route path="preview" element={<Chooser />} />
      <Route path="preview/student" element={<Role role="student"><AppShell role="student" preview /></Role>}>
        <Route index element={<StudentOverview />} /><Route path="goal" element={<StudentGoal />} /><Route path="plan" element={<StudentPlan />} /><Route path="tasks" element={<StudentTasks />} />
        <Route path="assessments" element={<StudentAssessments />} /><Route path="library" element={<StudentLibrary />} /><Route path="reports" element={<StudentReports />} /><Route path="mentor" element={<StudentMentor />} /><Route path="coach" element={<StudentCoach />} />
      </Route>
      <Route path="preview/mentor" element={<Role role="mentor"><AppShell role="mentor" preview /></Role>}>
        <Route index element={<MentorOverview />} /><Route path="students" element={<MentorStudents />} /><Route path="sessions" element={<MentorSessions />} /><Route path="tasks" element={<MentorTasks />} /><Route path="insights" element={<MentorInsights />} />
      </Route>
      <Route path="preview/parent" element={<Role role="parent"><AppShell role="parent" preview /></Role>}>
        <Route index element={<ParentOverview />} /><Route path="progress" element={<ParentProgress />} /><Route path="tasks" element={<ParentTasks />} /><Route path="reports" element={<ParentReports />} /><Route path="mentor" element={<ParentMentor />} />
      </Route>
      <Route path="*" element={<Navigate to="/platform" replace />} />
    </Routes>
  );
}
