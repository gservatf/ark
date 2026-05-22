import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: "#071426",
          900: "#0b1b32",
          800: "#102545"
        },
        brand: {
          600: "#2563eb",
          700: "#1d4ed8"
        },
        construction: {
          400: "#f6c44f",
          500: "#f59e0b"
        }
      },
      boxShadow: {
        soft: "0 16px 45px rgba(15, 23, 42, 0.06)"
      }
    }
  },
  plugins: []
};

export default config;
