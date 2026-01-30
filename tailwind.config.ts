import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        p1: '#2563eb',
        p2: '#ec4899',
      },
      borderRadius: {
        'xl': '1rem',
        '2xl': '2rem',
      }
    },
  },
  plugins: [],
} satisfies Config;
