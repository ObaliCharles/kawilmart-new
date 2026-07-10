/** @type {import('tailwindcss').Config} */
const config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      gridTemplateColumns:{
        'auto': 'repeat(auto-fit, minmax(200px, 1fr))'
      },
      transitionDuration: {
        DEFAULT: "140ms",
        75: "75ms",
        100: "100ms",
        150: "150ms",
        200: "160ms",
        300: "180ms",
        500: "240ms",
        700: "300ms",
        1000: "400ms",
      },
      transitionTimingFunction: {
        DEFAULT: "cubic-bezier(0.22, 1, 0.36, 1)",
        snappy: "cubic-bezier(0.22, 1, 0.36, 1)",
        smooth: "cubic-bezier(0.25, 0.1, 0.25, 1)",
      },
      animation: {
        "page-enter": "page-enter 180ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "fade-in": "fade-in 140ms cubic-bezier(0.22, 1, 0.36, 1) both",
        "scale-in": "scale-in 140ms cubic-bezier(0.22, 1, 0.36, 1) both",
      },
      keyframes: {
        "page-enter": {
          from: { opacity: "0", transform: "translateY(5px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "scale-in": {
          from: { opacity: "0", transform: "scale(0.98)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
