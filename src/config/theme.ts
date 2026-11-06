/** Low-saturation briefing palette. Only accents are bright. */
export const THEME = {
  background: '#0a1217',
  ink: '#d9d4c3',
  inkDim: 'rgba(217,212,195,0.55)',
  line: 'rgba(190,200,190,0.35)',
  accent: '#d8a24a', // brass / amber: markers, routes
  alert: '#c8453b', // muted red: fronts, threats
  cold: '#8fb3c4', // steel blue: naval routes, HUD
  highlight: '#f1e3b8',
  fonts: {
    display: '"Barlow Condensed", "Arial Narrow", sans-serif',
    mono: '"IBM Plex Mono", monospace',
  },
} as const;
