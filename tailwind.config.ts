import type { Config } from "tailwindcss";

export default {
  darkMode: "class",
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}", "./components/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          500: "rgb(16 185 129)"
        },
        "islamic-green": {
          500: "rgb(0 101 0)"
        }
      }
    }
  },
  plugins: []
} satisfies Config;

