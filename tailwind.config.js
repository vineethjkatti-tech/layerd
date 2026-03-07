/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          black: "#0A0A0A",
          purple: "#9B87F5",
          gray: "#8E9196",
          darker: "#050505",
        }
      }
    },
  },
  plugins: [],
}
