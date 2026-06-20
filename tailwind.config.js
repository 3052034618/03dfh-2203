/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1rem",
    },
    extend: {
      colors: {
        cold: {
          900: "#0A1628",
          800: "#0F2A4A",
          700: "#112240",
          600: "#1A3A5C",
          500: "#234E70",
        },
        ice: {
          500: "#00D4FF",
          400: "#33DFFF",
          300: "#66E7FF",
          200: "#99EFFF",
        },
        warning: {
          500: "#FF8A3D",
          400: "#FFA366",
        },
        success: {
          500: "#2DD4A0",
          400: "#57DFB3",
        },
        danger: {
          500: "#FF5757",
          400: "#FF7979",
        },
      },
      fontFamily: {
        display: ["Space Grotesk", "system-ui", "sans-serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "float": "float 6s ease-in-out infinite",
        "glow": "glow 2s ease-in-out infinite alternate",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-10px)" },
        },
        glow: {
          "0%": { boxShadow: "0 0 5px rgba(0, 212, 255, 0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(0, 212, 255, 0.6)" },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
