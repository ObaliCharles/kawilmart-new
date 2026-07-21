import React from "react";

// Shared professional line-icon set (Lucide-style 24px stroke paths) used
// across admin, seller, and rider dashboards — replaces the emoji glyphs that
// previously stood in for navigation and stat icons.
const ICON_PATHS = {
  dashboard: "M4 13h6V4H4v9Zm0 7h6v-5H4v5Zm10 0h6v-9h-6v9Zm0-16v5h6V4h-6Z",
  orders: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0",
  products: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0",
  bag: "M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4H6ZM3 6h18M16 10a4 4 0 0 1-8 0",
  categories: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  users: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Zm10 14v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  settings: "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm7.4-3a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z",
  billing: "M4 4h16a1 1 0 0 1 1 1v14l-3-2-3 2-3-2-3 2-3-2-3 2V5a1 1 0 0 1 1-1Zm3 5h10M7 13h6",
  promotions: "m3 11 18-5v12L3 15v-4Zm4 1v5a2 2 0 0 0 4 0M20 10v4",
  tags: "M20.6 13.4 12 22l-9-9V4a1 1 0 0 1 1-1h9l7.6 8.6a1 1 0 0 1 0 1.8ZM7 7h.01",
  brands: "M12 2 3 7v6c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7l-9-5Zm0 6v4m0 4h.01",
  analytics: "M3 3v18h18M8 15l3-4 3 3 4-6",
  shield: "M12 2 3 7v6c0 5 3.8 8.4 9 9 5.2-.6 9-4 9-9V7l-9-5Z",
  store: "M4 9V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v3M4 9l1.5 11h13L20 9M4 9h16M9 13h6",
  home: "m3 11 9-8 9 8M6 10v10h12V10M10 20v-6h4v6",
  verified: "M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
  truck: "M10 17h4V5H2v12h3m5 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm10 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm-6 0h2m4 0h1v-5l-3-4h-4v9",
  wallet: "M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2M21 7h-4a2 2 0 0 0 0 4h4v-4Z",
  package: "m21 8-9-5-9 5m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8m-9-13v8l9 5",
  revenue: "M12 2v20m5-16H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6",
  chart: "M3 3v18h18M18 9l-5 5-3-3-4 4",
  clock: "M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Zm0-16v6l4 2",
  refresh: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
  menu: "M4 6h16M4 12h16M4 18h16",
  grid: "M4 4h6v6H4V4Zm10 0h6v6h-6V4ZM4 14h6v6H4v-6Zm10 0h6v6h-6v-6Z",
  buyer: "M20 21a8 8 0 0 0-16 0m12-13a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  rider: "M18.5 19a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Zm-13 0a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5ZM5.5 14l2-6h5l3 4h1.5M9 8V5h3",
  admin: "M12 2 4 5v6c0 4.5 3.1 8.7 8 10 4.9-1.3 8-5.5 8-10V5l-8-3Zm-1 11-2-2m0 0 4-4",
};

const DashIcon = ({ name, className = "h-5 w-5", strokeWidth = 1.7 }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d={ICON_PATHS[name] || ICON_PATHS.grid}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default DashIcon;
