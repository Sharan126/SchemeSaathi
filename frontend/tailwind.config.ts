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
        gov: {
          saffron: "#F58220",
          navy: "#0A2540",
          blue: "#0D6EFD",
          green: "#0B8246",
          lightGreen: "#EBF8F2",
          cardBg: "#FFFFFF",
          border: "#E2E8F0",
        },
      },
      fontFamily: {
        sans: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "Noto Sans", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
