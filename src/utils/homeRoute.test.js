import { describe, it, expect, beforeEach, vi } from 'vitest';

// Covers the bug where revisiting /login while already signed in always sent every account to /dashboard
// (the old v3 page), regardless of role — blank or wrong for mentors, parents and v4 students alike.
describe('homeRouteFor', () => {
  beforeEach(() => vi.resetModules());

  it('sends each platform role to its own dashboard when the platform is enabled', async () => {
    vi.doMock('../platform/config', () => ({ PLATFORM_ENABLED: true }));
    vi.doMock('../v4/config', () => ({ V4_ENABLED: true }));
    const { homeRouteFor } = await import('./homeRoute');
    expect(homeRouteFor({ role: 'student' })).toBe('/platform/student');
    expect(homeRouteFor({ role: 'mentor' })).toBe('/platform/mentor');
    expect(homeRouteFor({ role: 'parent' })).toBe('/platform/parent');
    expect(homeRouteFor({})).toBe('/platform/student');          // no role on record defaults to student
  });

  it('never sends a platform-role account to the old /dashboard, even with v4 also enabled', async () => {
    vi.doMock('../platform/config', () => ({ PLATFORM_ENABLED: true }));
    vi.doMock('../v4/config', () => ({ V4_ENABLED: true }));
    const { homeRouteFor } = await import('./homeRoute');
    expect(homeRouteFor({ role: 'parent', track: 'senior', assessmentCompleted: true })).toBe('/platform/parent');
  });

  it('falls back to v4 routes, then the old dashboard, when the platform is off', async () => {
    vi.doMock('../platform/config', () => ({ PLATFORM_ENABLED: false }));
    vi.doMock('../v4/config', () => ({ V4_ENABLED: true }));
    const { homeRouteFor } = await import('./homeRoute');
    expect(homeRouteFor({ role: 'counsellor' })).toBe('/v4/school');
    expect(homeRouteFor({ role: 'student', track: 'senior' })).toBe('/v4');
    expect(homeRouteFor({ role: 'student', assessmentCompleted: true })).toBe('/dashboard');
    expect(homeRouteFor({ role: 'student', onboardingCompleted: false })).toBe('/register');
    expect(homeRouteFor({ role: 'student', onboardingCompleted: true })).toBe('/assessment');
  });

  it('sends a signed-out visitor to /login', async () => {
    vi.doMock('../platform/config', () => ({ PLATFORM_ENABLED: true }));
    vi.doMock('../v4/config', () => ({ V4_ENABLED: true }));
    const { homeRouteFor } = await import('./homeRoute');
    expect(homeRouteFor(null)).toBe('/login');
  });
});
