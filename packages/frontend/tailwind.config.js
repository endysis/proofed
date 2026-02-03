/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: '#e5344e',
        'pastel-pink': '#f4acb7',
        'dusty-mauve': '#9d8189',
        'bg-light': '#f8f6f6',
        'bg-dark': '#211113',
        'card-dark': '#2d1a1d',
      },
      fontFamily: {
        display: ['Space Grotesk', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
    },
  },
  plugins: [],
};
