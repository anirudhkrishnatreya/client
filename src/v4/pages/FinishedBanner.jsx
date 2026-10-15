import { Link, useLocation } from 'react-router-dom';

/** Shown once, right after a student finishes the test: it says what happened and where the report is. */
export default function FinishedBanner({ className = 'v4-alert info', style }) {
  const { state } = useLocation();
  const id = state && state.justFinished;
  if (!id) return null;
  return (
    <div className={className} style={style} role="status">
      <strong>You have finished the test. Well done!</strong> Your report is ready, and we are emailing you a PDF copy.{' '}
      <Link to={`/v4/results/${id}`}><b>Open my report</b></Link>
    </div>
  );
}
