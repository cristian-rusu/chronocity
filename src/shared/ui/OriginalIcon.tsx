const paths = {
  home: '<path d="m3 10 9-7 9 7v10H3zM9 20v-7h6v7"/>',
  plan: '<rect x="4" y="5" width="16" height="16" rx="2"/><path d="M8 3v4m8-4v4M4 10h16M8 14h3m2 0h3M8 17h3"/>',
  pulse: '<path d="M2 12h5l3-8 4 16 3-8h5"/>',
  recover: '<path d="M4 5v5a4 4 0 0 0 4 4h8m-4-4 4 4-4 4M4 5l-2 2m2-2 2 2"/>',
  lab: '<path d="M9 3h6m-5 0v7L4 20h16l-6-10V3M7 16h10"/>',
  arrow: '<path d="M4 12h15m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H5m6-6-6 6 6 6"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 4 4 10-10"/>',
  alert: '<path d="M12 3 2 21h20zM12 9v5m0 3h.01"/>',
  edit: '<path d="m4 16 12-12 4 4L8 20H4z"/>',
  trash: '<path d="M4 7h16M9 7V4h6v3m-9 0 1 13h10l1-13"/>',
  play: '<path d="m8 4 12 8-12 8z"/>',
  pause: '<path d="M9 5v14m6-14v14"/>',
  reset: '<path d="M3 12a9 9 0 1 1 3 7M3 5v7h7"/>',
  download: '<path d="M12 3v12m-5-5 5 5 5-5M4 17v4h16v-4"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',
} as const;

export function OriginalIcon({ name }: { name: keyof typeof paths }) {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" dangerouslySetInnerHTML={{ __html: paths[name] }} />;
}
