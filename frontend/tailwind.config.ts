import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ashoka: "#0F1E36",
        ink: "#1E293B",
        steel: "#475569",
        canvas: "#F8F9FA",
        hairline: "#E2E8F0",
        terracotta: "#B44610",
        forest: "#166534",
        civic: "#1D4ED8",
        gov: {
          saffron: "#B44610",
          navy: "#0F1E36",
          blue: "#1D4ED8",
          green: "#166534",
          lightGreen: "#F0FDF4",
          cardBg: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          '"Segoe UI"',
          "Roboto",
          '"Noto Sans"',
          '"Noto Sans Devanagari"',
          '"Noto Sans Kannada"',
          "sans-serif",
        ],
      },
      boxShadow: {
        hairline: "0 1px 2px 0 rgba(15, 30, 54, 0.04)",
        panel: "0 1px 3px 0 rgba(15, 30, 54, 0.06), 0 1px 2px -1px rgba(15, 30, 54, 0.04)",
        lifted: "0 4px 6px -1px rgba(15, 30, 54, 0.07), 0 2px 4px -2px rgba(15, 30, 54, 0.05)",
      },
    },
  },
  plugins: [],
};

export default config;
