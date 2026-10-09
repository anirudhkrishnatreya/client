// Interface icons: simple line shapes on a 24-unit grid, drawn for this platform. One component, one table.
const P = {
  home: 'M3 11l9-8 9 8M5 10v10h5v-6h4v6h5V10',
  grid: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  target: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zM12 11a1 1 0 1 0 0 2 1 1 0 0 0 0-2z',
  calendar: 'M5 5h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2zM3 10h18M8 3v4M16 3v4',
  tasks: 'M5 3.5h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-13a2 2 0 0 1 2-2zM7.5 12l2.5 2.5 5-5.5',
  clipboard: 'M9 3h6v4H9zM8 5H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M8 12h8M8 16h5',
  book: 'M12 6c-2-1.5-5-2-8-2v14c3 0 6 .5 8 2 2-1.5 5-2 8-2V4c-3 0-6 .5-8 2zM12 6v14',
  chart: 'M4 20h16M7 20v-7M12 20V6M17 20v-10',
  user: 'M12 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM4.5 20c.8-4 3.6-6 7.5-6s6.7 2 7.5 6',
  users: 'M9 5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7zM2.5 20c.6-3.6 3-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 5.5a3 3 0 0 1 0 6M18 14.8c2 .5 3.200 2.200 3.500 5.200',
  message: 'M4 5h16v11H9l-5 4z',
  bell: 'M6 9a6 6 0 0 1 12 0c0 6 2 7 2 7H4s2-1 2-7M10 20a2 2 0 0 0 4 0',
  search: 'M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM16 16l5 5',
  settings: 'M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM12 3v2.500M12 18.500V21M3 12h2.500M18.500 12H21M5.600 5.600l1.800 1.800M16.600 16.600l1.800 1.800M18.400 5.600l-1.800 1.800M7.400 16.600l-1.800 1.800',
  sparkles: 'M11 3l1.800 5.200L18 10l-5.200 1.800L11 17l-1.800-5.200L4 10l5.200-1.800zM19 15l.7 1.800 1.800.7-1.800.7L19 20l-.7-1.800-1.800-.7 1.800-.7z',
  flag: 'M6 21V4M6 5h11l-2 4 2 4H6',
  clock: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 7v5l3 2',
  award: 'M12 3a6 6 0 1 0 0 12 6 6 0 0 0 0-12zM8.500 14L7 21l5-3 5 3-1.500-7',
  trend: 'M3 17l6-6 4 4 8-9M15 6h6v6',
  file: 'M7 3h7l5 5v13H7zM14 3v5h5M10 13h6M10 17h6',
  video: 'M4 6h12a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zM17 10l4-3v10l-4-3',
  link: 'M10 14a4 4 0 0 0 5.700 0l3-3a4 4 0 0 0-5.700-5.700l-1 1M14 10a4 4 0 0 0-5.700 0l-3 3a4 4 0 0 0 5.700 5.700l1-1',
  plus: 'M12 5v14M5 12h14',
  chevronRight: 'M9 6l6 6-6 6',
  chevronLeft: 'M15 6l-6 6 6 6',
  chevronDown: 'M6 9l6 6 6-6',
  menu: 'M4 7h16M4 12h16M4 17h16',
  logout: 'M15 17l5-5-5-5M20 12H9M12 4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h6',
  star: 'M12 3l2.700 5.600 6.100.9-4.400 4.300 1 6.100L12 17l-5.400 2.900 1-6.100L3.200 9.500l6.100-.9z',
  flame: 'M12 3c1 4 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3 2-4 0 2 1 3 2 3 0-3-1-5 1-9z',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  bulb: 'M12 3a6 6 0 0 0-3.500 10.900c.6.5 1 1.200 1 2.100h5c0-.9.4-1.600 1-2.100A6 6 0 0 0 12 3zM9.500 18.500h5M10.500 21h3',
  heart: 'M12 20s-7-4.400-7-10a4 4 0 0 1 7-2.500A4 4 0 0 1 19 10c0 5.600-7 10-7 10z',
  shield: 'M12 3l7 3v5c0 5-3 8.500-7 10-4-1.500-7-5-7-10V6zM9 12l2 2 4-4',
  lock: 'M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1zM8 11V8a4 4 0 0 1 8 0v3',
  filter: 'M3 5h18l-7 8v6l-4 2v-8z',
  download: 'M12 4v11M7 11l5 5 5-5M5 20h14',
  play: 'M8 5l11 7-11 7z',
  send: 'M21 3L3 11l7 3 3 7zM10 14l4-4',
  mail: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zM3 7l9 6 9-6',
  eye: 'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12zM12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  edit: 'M4 20l1-4L16 5l3 3L8 19zM14 7l3 3',
  x: 'M6 6l12 12M18 6L6 18',
  check: 'M5 12l4 4 10-10',
  info: 'M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18zM12 11v6M12 7.500h.01',
  alert: 'M12 4l9 16H3zM12 10v4M12 17h.01',
  cap: 'M2 9l10-5 10 5-10 5zM6 11.500V16c3 2 9 2 12 0v-4.500',
  layers: 'M12 3l9 5-9 5-9-5zM3 13l9 5 9-5',
  repeat: 'M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3',
  brain: 'M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1zM15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1V5a3 3 0 0 1 3-1z',
  code: 'M8 8l-4 4 4 4M16 8l4 4-4 4M13.500 6l-3 12',
  more: 'M5 12h.01M12 12h.01M19 12h.01',
  pin: 'M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11zM12 7.500a2.500 2.500 0 1 0 0 5 2.500 2.500 0 0 0 0-5z',
  sun: 'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.500 1.500M17.500 17.500L19 19M19 5l-1.500 1.500M6.500 17.500L5 19',
  moon: 'M20 14A8 8 0 0 1 10 4a8 8 0 1 0 10 10z',
  trophy: 'M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1.500A3 3 0 0 0 8 10.500M16 6h3v1.500a3 3 0 0 1-3 3M12 13v4M9 20h6M10 17h4'
};

export default function Icon({ name, size = 20, stroke = 1.7, className = '', ...rest }) {
  const d = P[name];
  return (
    <svg className={`pf-icon ${className}`} viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth={stroke} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...rest}>
      {d ? <path d={d} /> : null}
    </svg>
  );
}
export const ICON_NAMES = Object.keys(P);
