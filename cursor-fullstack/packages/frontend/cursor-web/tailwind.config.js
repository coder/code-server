/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'cursor-bg': '#1e1e1e',
        'cursor-sidebar': '#252526',
        'cursor-border': '#3c3c3c',
        'cursor-text': '#cccccc',
        'cursor-accent': '#007acc',
        'cursor-hover': '#2a2d2e',
      }
    },
  },
  plugins: [],
}