/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#00ffff', // Cyan
        background: '#000000', // Black
        card: '#0a0a0a', // Deep dark for cards
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Minimalist tech font
      },
    },
  },
  plugins: [],
}
