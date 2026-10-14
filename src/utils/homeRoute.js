// Where a signed-in user's own dashboard lives. One place, so a page that only checks "are they logged in?"
// (e.g. redirecting away from /login) sends them to the same place a fresh login would, instead of falling
// back to the old /dashboard for every role.
import { PLATFORM_ENABLED } from '../platform/config';
import { V4_ENABLED } from '../v4/config';

export function homeRouteFor(user) {
  if (!user) return '/login';
  if (PLATFORM_ENABLED && ['student', 'mentor', 'parent'].includes(user.role || 'student')) return `/platform/${user.role || 'student'}`;
  if (V4_ENABLED && user.role === 'counsellor') return '/v4/school';
  if (V4_ENABLED && user.track) return '/v4';
  if (user.assessmentCompleted) return '/dashboard';
  if (!user.onboardingCompleted) return '/register';
  return '/assessment';
}
