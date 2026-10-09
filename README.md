# iMenteo client

React 18 · Vite 5 · react-router 6 (`HashRouter`, so it works on GitHub Pages) · axios. Talks to the API in the `server/` repo.

## Quick start
```bash
npm install
npm run dev        # http://localhost:5173 (proxies /api to http://localhost:5001)
npm test           # vitest + Testing Library, ~120 tests, no server needed
npm run build      # production build in dist/
```
To see the v4 assessment locally, run the server with `ASSESSMENT_V4=on` and start the client with `VITE_V4=on npm run dev`.

## Configuration (build time)
| Variable | Purpose |
|---|---|
| `VITE_API_URL` | API base URL. Unset in development (Vite proxy). Set for a deployed build |
| `VITE_PLATFORM` | `on` adds the student, mentor and parent dashboards at `#/platform`. Signed-in people go to their own (`/platform/student`, `/mentor`, `/parent`), backed by the server (`src/platform/live/`). `#/platform/preview` shows the same screens on made-up sample data, with no sign-in |
| `VITE_V4` | `on` includes the v4 assessment screens and routes. Off by default: with it off, the bundle is the same as before v4 existed |

## Two assessments live side by side
- **v3** (original, 110 questions): `src/pages/*`, unchanged.
- **v4** (three tracks, five dimensions): `src/v4/*`, enabled by `VITE_V4=on`. After signing in, a student with a v4 track goes to `/v4`.

### v4 routes
`/v4/register` · `/v4` (dashboard) · `/v4/test` (the test) · `/v4/results/:id` · `/guardian-consent/:token` (public, opened from the guardian's email)

### v4 code map (`src/v4`)
| File | Role |
|---|---|
| `Player.jsx` | the test: blocks in order, resume, server-clock timers, closing a block safely |
| `answerQueue.js` | batches answers, saves them offline in `localStorage`, retries, never loses an answer |
| `clock.js` | countdowns follow the **server's** deadline, not the device clock |
| `items/` | Likert, multiple choice (text or picture options), same/different renderers |
| `pages/` | register, guardian consent, dashboard, results |
| `api.js` | the `/api/v2` calls |
| `testServer.js` | a small fake of the server, used only by tests |

Drawings arrive as SVG text and are shown through `<img src="data:…">`, never injected as markup.

## Sessions and cookies
By default the token is kept in `localStorage` (as before). If the server runs with `COOKIE_AUTH=on|only`, it also sets an httpOnly session cookie; the client then sends credentials and echoes the `im_csrf` cookie in `X-CSRF-Token` on writes (`src/api/index.js`). In cookie-only mode the stored token is the marker `cookie`. Cookie mode needs the site and API to share a registrable domain, or `COOKIE_SAMESITE=none` over HTTPS (some browsers block that): see `server/middleware/session.js`.

## Deploying
`npm run deploy` builds and publishes `dist/` to the `gh-pages` branch (see `package.json`). Builds are static; there is nothing to configure on the host beyond the variables above at build time. Check the build you publish: `VITE_V4` is baked in.

## Rules
- A timed block ends when the server says so. Do not add client-side deadlines.
- Never show an answer key (there is none on the client: the server sends no keys).
- Every screen must work with a keyboard and a screen reader; new screens need a test that finds elements by role and label.
