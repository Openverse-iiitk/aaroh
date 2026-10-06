/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-canvas': '#09090b',
        'midnight-surface': '#121215',
        'deep-indigo': '#18181b',
        'lilac-white': '#f4f4f5',
        'pearl': '#ffffff',
        'ash': '#a1a1aa',
        'fog': '#71717a',
        'steel': '#52525b',
        'mercury': '#d4d4d8',
        'dusk': '#3f3f46',
        'lavender-accent': '#60a5fa',
        'iris': '#2563eb',
      },
      borderRadius: {
        'btn': '6px',
        'input': '6px',
        'card': '10px',
        'badge': '6px',
        'navpill': '8px',
        'feature': '10px',
      },
      boxShadow: {
        'rim-card': 'none',
        'rim-card-bright': 'none',
        'badge-glow': 'none',
        'cosmic-glow': 'none',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
