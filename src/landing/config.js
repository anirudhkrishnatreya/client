// Where visitors can write to you. Set VITE_CONTACT_EMAIL at build time; until then the footer shows no address (nothing is invented).
export const CONTACT_EMAIL = (import.meta.env.VITE_CONTACT_EMAIL || '').trim();
