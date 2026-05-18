import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        background: "#000000",
        foreground: "#ffffff",
        primary: "#4850E0",
      },
      borderRadius: {
        "magic-in": "15px",
        "magic-out": "20px",
      },
    },
  },
  plugins: [],
};

export default config;
