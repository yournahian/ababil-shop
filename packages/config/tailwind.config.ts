import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    '../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#00ffff', // Electric Cyan
          light: '#e0ffff',
          dark: '#008b8b',
        },
        secondary: {
          DEFAULT: '#ff007f', // Cyber Pink
          light: '#ffb6c1',
          dark: '#c71585',
        },
        background: '#000000', // Exact legacy Pitch Black
        card: {
          DEFAULT: '#0a0a0a', // Exact legacy Deep Dark
          border: 'rgba(255, 255, 255, 0.08)', // Exact legacy card border
          hover: '#121212',
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Exact legacy tech font
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 255, 255, 0.15)',
        'neon-pink': '0 0 15px rgba(255, 0, 127, 0.15)',
      },
      animation: {
        'spin-slow': 'spin 3s linear infinite',
      },
      backgroundImage: {
        'grid-pattern': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40' viewBox='0 0 40 40'%3E%3Cpath d='M0 40L40 40 40 0' fill='none' stroke='%23111111' stroke-width='1'/%3E%3C/svg%3E\")",
      },
    },
  },
  plugins: [],
};

export default config;
