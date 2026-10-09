import { useNavigate } from 'react-router-dom';
import Player from '../Player';

// The route for taking the test. When the server says the test is finished, go to the results.
export default function V4Assessment() {
  const nav = useNavigate();
  return <Player onFinished={id => nav(`/v4/results/${id}`, { replace: true })} />;
}
