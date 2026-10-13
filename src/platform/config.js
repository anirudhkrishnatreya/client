// The learning-platform dashboards are off unless the build says VITE_PLATFORM=on, so a deploy cannot expose sample data by accident.
export const PLATFORM_ENABLED = import.meta.env.VITE_PLATFORM === 'on';
