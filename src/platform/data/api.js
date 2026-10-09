// The only place the screens get their data. Today it returns the sample data in mock.js; when the real API exists, these
// functions call it instead and nothing else changes.
import { buildStudent, buildMentor, buildParent } from './mock';

const BUILD = { student: buildStudent, mentor: buildMentor, parent: buildParent };
const delay = ms => new Promise(r => setTimeout(r, ms));

export async function loadBundle(role, { latency = 120 } = {}) {
  if (!BUILD[role]) throw new Error(`unknown role ${role}`);
  await delay(latency);
  return BUILD[role]();
}
