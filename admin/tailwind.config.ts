import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: { DEFAULT: '#001E47', dark: '#001330', light: '#163B6B', 100: '#DCE5F2' },
        gold: { DEFAULT: '#C88B2C', light: '#DCA54C', dark: '#A46E1B', text: '#945F12' },
        mist: '#F8F6F1',
        stone: '#ECE7DE',
        ink: '#0A1626',
        muted: '#536275',
        line: '#D8D2C5',
        danger: '#B3261E',
        success: '#2E7D4F',
      },
      fontFamily: {
        sans: ['Plus Jakarta Sans', 'IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        arabic: ['IBM Plex Sans Arabic', 'system-ui', 'sans-serif'],
        latin: ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config;
