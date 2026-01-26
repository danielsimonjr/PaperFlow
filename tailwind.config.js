/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1E3A5F',
        },
        surface: {
          light: '#ffffff',
          dark: '#1e293b',
        },
        highlight: {
          yellow: '#FFEB3B',
          green: '#4CAF50',
          blue: '#2196F3',
          pink: '#E91E63',
          orange: '#FF9800',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        signature: ['Caveat', 'cursive'],
      },
    },
  },
  plugins: [],
};
