/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        // Fliplet brand-inspired palette
        primary: {
          50: '#f0f5ff',
          100: '#e0ebff',
          200: '#b8d4fe',
          300: '#7ab5fd',
          400: '#3b8ffa',
          500: '#1270eb',
          600: '#0557c9',
          700: '#0646a3',
          800: '#0a3b86',
          900: '#0d336f',
        },
      },
    },
  },
  plugins: [],
};
