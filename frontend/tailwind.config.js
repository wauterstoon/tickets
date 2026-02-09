/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"] ,
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f5f7ff",
          100: "#e9edff",
          200: "#cfd7ff",
          300: "#aab8ff",
          400: "#7a8cff",
          500: "#4d64ff",
          600: "#3046f2",
          700: "#2536c2",
          800: "#1f2f96",
          900: "#1c2a75"
        }
      },
      boxShadow: {
        soft: "0 10px 30px rgba(15, 23, 42, 0.08)"
      }
    }
  },
  plugins: []
};
