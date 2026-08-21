// eslint-disable-next-line @typescript-eslint/no-require-imports -- tailwind.config.js is CommonJS; this is Tailwind's own documented pattern for extending defaultTheme
const defaultTheme = require("tailwindcss/defaultTheme");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-nunito)", ...defaultTheme.fontFamily.sans],
      },
      colors: {
        brand: {
          50: "#eef4ff",
          100: "#e0eaff",
          200: "#c7d7fe",
          300: "#a4bcfd",
          400: "#8098f9",
          500: "#6172f3",
          600: "#4750e6",
          700: "#3c3fcb",
          800: "#3336a3",
          900: "#2f3282",
        },
        // Semantic status colors — see DESIGN_SYSTEM.md §1. Use these (not
        // raw green-600/amber-600/red-600) for status badges/states so every
        // screen maps the same status to the same color.
        success: {
          50: "#f0fdf4",
          600: "#16a34a",
          700: "#15803d",
        },
        warning: {
          50: "#fffbeb",
          600: "#d97706",
          700: "#b45309",
        },
        danger: {
          50: "#fef2f2",
          600: "#dc2626",
          700: "#b91c1c",
        },
      },
    },
  },
  plugins: [],
};
