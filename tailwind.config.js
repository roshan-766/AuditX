/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jcb: {
          yellow: '#FFB800',
          yellowDark: '#E5A500',
          black: '#121212',
          gray: '#242424',
          lightGray: '#F4F5F7',
          border: '#333333'
        }
      }
    },
  },
  plugins: [],
}
