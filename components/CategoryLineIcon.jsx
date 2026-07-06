'use client'

import React from "react";

const categoryPaths = {
  Fashion: "M8 4 5 6.5 3 11l3 1.5V20h12v-7.5l3-1.5-2-4.5L16 4l-2 2h-4L8 4Z",
  "Beauty & Cosmetics": "M9 14.5 16.5 7a2.1 2.1 0 0 1 3 3L12 17.5 8 18.5l1-4ZM5 20h14M6 8h5M7 4h3v10H7V4Z",
  "Health & Personal Care": "M12 21s7-4.4 7-11a4 4 0 0 0-7-2.6A4 4 0 0 0 5 10c0 6.6 7 11 7 11ZM12 8v6M9 11h6",
  "Home & Living": "M4 11.5 12 5l8 6.5M6.5 10v9h11v-9M10 19v-5h4v5",
  "Phones & Tablets": "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
  "Computers & Electronics": "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
  Audio: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
  "Watches & Wearables": "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
  Accessories: "M8 7V5a2 2 0 0 1 4 0v2m4 0V5a2 2 0 0 1 4 0v2M7 7h14v6a5 5 0 0 1-5 5h-4a5 5 0 0 1-5-5V7ZM4 12h3",
  Appliances: "M7 4h10v16H7V4Zm2 3h6m-5 10h4m-5-6h6v4H9v-4Z",
  "Baby Products": "M8 10a4 4 0 0 1 8 0v2h1.5A2.5 2.5 0 0 1 20 14.5V19H4v-4.5A2.5 2.5 0 0 1 6.5 12H8v-2Zm2 7h.1M14 17h.1M10 9h4",
  "Office & Stationery": "M5 19l4-1 10-10-3-3L6 15l-1 4Zm10-13 3 3M5 5h6M5 9h3",
  "Sports & Outdoors": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Zm0-18v18M4.5 8h15M4.5 16h15",
  Automotive: "M5 17h14l-1.2-5.2A3 3 0 0 0 14.9 9H9.1a3 3 0 0 0-2.9 2.8L5 17Zm2 0v2m10-2v2M7.5 13h9",
  "Books & Learning": "M5 5.5A2.5 2.5 0 0 1 7.5 3H20v16H7.5A2.5 2.5 0 0 0 5 21V5.5Zm0 0A2.5 2.5 0 0 0 7.5 8H20",
  "Construction & Tools": "m14 6 4 4M4 20l8.5-8.5m2-6.5 4.5 4.5-3 3-4.5-4.5 3-3ZM5 7l4 4",
  Smartphone: "M8 3h8a1.3 1.3 0 0 1 1.3 1.3v15.4A1.3 1.3 0 0 1 16 21H8a1.3 1.3 0 0 1-1.3-1.3V4.3A1.3 1.3 0 0 1 8 3Zm3 15h2",
  Laptop: "M5 6h14v9H5V6Zm-2 12h18M9 18l1-3m5 3-1-3",
  Camera: "M5 7h3l1.5-2h5L16 7h3v12H5V7Zm7 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z",
  Headphone: "M5 14v-2a7 7 0 0 1 14 0v2M5 14h3v5H5v-5Zm11 0h3v5h-3v-5Z",
  Earphone: "M8 5h4v7a4 4 0 0 1-8 0V9a4 4 0 0 1 4-4Zm8 0a4 4 0 0 1 4 4v3a4 4 0 0 1-8 0V5h4Z",
  Watch: "M9 3h6l1 4a6 6 0 0 1 0 10l-1 4H9l-1-4A6 6 0 0 1 8 7l1-4Zm3 5v4l2.5 1.5",
};

const CategoryLineIcon = ({ category, className = "h-5 w-5" }) => (
  <svg className={className} aria-hidden="true" viewBox="0 0 24 24" fill="none">
    <path
      d={categoryPaths[category] || categoryPaths.Accessories}
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export default CategoryLineIcon;
