// The career explorer is off unless the build says VITE_REC=on, and it only works once the server runs REC_ENGINE=v5.
// Until then the server answers V5_DISABLED and these pages show a plain "coming soon" instead of an error.
export const REC_ENABLED = import.meta.env.VITE_REC === 'on';
