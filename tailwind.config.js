/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'void-canvas': '#030014',
        'midnight-surface': '#060317',
        'deep-indigo': '#10093a',
        'lilac-white': '#f4f0ff',
        'pearl': '#ffffff',
        'ash': '#a8a6b7',
        'fog': '#918ea0',
        'steel': '#54525f',
        'mercury': '#cdccd0',
        'dusk': '#72707b',
        'lavender-accent': '#9382ff',
        'iris': '#5046e4',
      },
      borderRadius: {
        'btn': '5px',
        'input': '5px',
        'card': '16px',
        'badge': '32px',
        'navpill': '999px',
        'feature': '24px',
      },
      boxShadow: {
        'rim-card': 'rgba(255, 255, 255, 0.04) 0px 0px 24px 0px inset',
        'rim-card-bright': 'rgba(255, 255, 255, 0.06) 0px 0px 24px 0px inset',
        'badge-glow': 'rgba(164, 143, 255, 0.12) 0px -7px 11px 0px inset',
        'cosmic-glow': '0 0 30px rgba(147, 130, 255, 0.15)',
      },
      fontFamily: {
        sans: ['"Inter"', 'ui-sans-serif', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        display: ['"AeonikPro"', '"Inter"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
