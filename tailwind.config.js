/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gov: {
          navy: '#0B3B60',       // Official UP Tourism Dark Navy
          navyLight: '#144B77',
          gold: '#C49746',       // Accent Gold
          saffron: '#D97706',    // Subtle Saffron indicator
          emerald: '#059669',    // Positive progress
          crimson: '#DC2626',    // Risk / Overdue
          amber: '#D97706',      // Attention required
          slate: '#334155',
          surface: '#FFFFFF',
          page: '#F8FAFC'
        }
      }
    },
  },
  plugins: [],
}
