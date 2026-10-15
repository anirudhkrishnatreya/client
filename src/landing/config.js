// Where visitors can write to you. Set VITE_CONTACT_EMAIL at build time; until then the footer shows no address (nothing is invented).
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || '').trim();

/** The hashtags on the landing page: each says something real about what iMenteo does. */
export const TAGS = ['#CareerClarity', '#AIMentor', '#AlwaysOn', '#AgenticAI', '#WeeklyPlan', '#Accountability', '#ParentVisibility', '#Class6ToCollege'];
