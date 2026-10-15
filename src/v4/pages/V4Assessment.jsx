import { useNavigate } from 'react-router-dom';
import Player from '../Player';
import { useAuth } from '../../context/AuthContext';
import { homeRouteFor } from '../../utils/homeRoute';

// The route for taking the test. When the server says the test is finished, go back to the student's own dashboard, which
// says the test is done and links to the report. (Students on the learning platform land on their Reports page.)
export default function V4Assessment() {
  const nav = useNavigate();
  const { user } = useAuth();
  return <Player onFinished={id => {
    const home = homeRouteFor(user);
    nav(home.startsWith('/platform/student') ? '/platform/student/reports' : home === '/login' ? `/v4/results/${id}` : home, { replace: true, state: { justFinished: id } });
  }} />;
}
