// The learning loop (career goal, roadmap, weekly plan) is off unless the build says VITE_LOOP=on, and it only works once the
// server runs LEARNING_LOOP=on. Until then the old goal page and the "coming soon" plan page stay.
export const LOOP_ENABLED = import.meta.env.VITE_LOOP === 'on';
