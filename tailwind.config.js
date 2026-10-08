/* Site-wide green theme, matching the home page (#2eff7b accent).
   The old blue/indigo/purple families are remapped onto it so every page follows. */
const themeGreen = {
  50: '#edfff4',
  100: '#d3ffe3',
  200: '#a6ffc6',
  300: '#6bffa1',
  400: '#2eff7b',
  500: '#27d968',
  600: '#1d8a49',
  700: '#176b3a',
  800: '#14582f',
  900: '#0e3a24',
  950: '#072014',
};

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-canvas': '#060507',
        'midnight-surface': '#0b0f0d',
        'deep-indigo': '#121614',
        'lilac-white': '#ecf1ee',
        'pearl': '#ffffff',
        'ash': '#a6b1ab',
        'fog': '#8a958f',
        'steel': '#52525b',
        'mercury': '#d4d4d8',
        'dusk': '#3f3f46',
        'lavender-accent': '#2eff7b',
        'iris': '#1d8a49',
        indigo: themeGreen,
        purple: themeGreen,
        violet: themeGreen,
        blue: themeGreen,
        pink: themeGreen,
        fuchsia: themeGreen,
        emerald: themeGreen,
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
        sans: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"Geist Variable"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono Variable"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
    },
  },
  plugins: [],
}
