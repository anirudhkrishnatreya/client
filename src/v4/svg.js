// Item drawings arrive as SVG text. They are shown through <img src="data:…"> and never injected into the page, so even
// a corrupted drawing could not run script in the student's session.
export const svgToDataUri = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
