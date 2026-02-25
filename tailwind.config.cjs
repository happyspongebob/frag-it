/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        warm: {
          bg1: '#fbf1e6',
          bg2: '#f8e5d1',
          ink: '#3a2f2a',
          muted: 'rgba(58, 47, 42, 0.62)',
          accent: '#f2b184',
          accent2: '#f7c7a7',
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
