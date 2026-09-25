/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#F5F1E8",
        ink: "#111111",
        accent: "#FFD400",
        surface: "#FFFFFF",
        risk: {
          low: "#2E7D32",
          medium: "#E8A400",
          high: "#D7263D",
        },
      },
      fontFamily: {
        heading: ["'Space Grotesk'", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      boxShadow: {
        brutal: "4px 4px 0 #111111",
        "brutal-sm": "2px 2px 0 #111111",
        "brutal-pressed": "1px 1px 0 #111111",
      },
      borderWidth: {
        3: "3px",
      },
    },
  },
  // Keep border-radius deliberately absent from structural components —
  // see docs/DESIGN_SYSTEM.md. Don't add a default rounded scale here.
  plugins: [],
};
