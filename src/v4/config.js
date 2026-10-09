// The v4 assessment is off unless the build says otherwise (VITE_V4=on), so a deploy cannot expose it by accident.
export const V4_ENABLED = import.meta.env.VITE_V4 === 'on';
