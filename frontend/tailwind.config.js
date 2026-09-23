/** @type {import('tailwindcss').Config} */
export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#dbe6fe",
          200: "#bfd3fe",
          300: "#93b5fd",
          400: "#6090fa",
          500: "#3b6ff2",
          600: "#2851e6",
          700: "#213fd1",
          800: "#2135a8",
          900: "#1f3184",
        },
      },
    },
  },
  plugins: [],
};
