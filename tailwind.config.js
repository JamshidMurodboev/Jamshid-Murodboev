/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        cream: { 50: '#fefdf8', 100: '#fdf8ed', 200: '#faf0d7', 300: '#f5e4b8' },
        midnight: { 800: '#1e2a3a', 900: '#111827', 950: '#0a0f1a' },
      },
      fontFamily: { sans: ['Inter', 'system-ui', 'sans-serif'] },
    },
  },
  plugins: [],
}
