/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          bg1: '#fbf7f1',
          bg2: '#f3ece2',
          ink: '#3a2f2a',
          muted: 'rgba(58, 47, 42, 0.58)',
          accent: '#e9c6a8',
          accent2: '#f2ddcc',
        },
      },
      borderRadius: {
        xl2: '22px',
      },
      boxShadow: {
        soft: '0 18px 55px rgba(58, 47, 42, 0.10)',
      },
    },
  },
  plugins: [],
}
