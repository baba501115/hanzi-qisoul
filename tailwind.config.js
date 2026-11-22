/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
    },
    extend: {
      colors: {
        paper: {
          DEFAULT: "#f4efe4",
          2: "#ece3d2",
          3: "#e2d7c2",
        },
        ink: {
          DEFAULT: "#1c1a17",
          soft: "#3a4a52",
          faint: "#6b6459",
        },
        ash: "#8a8578",
        cinnabar: {
          DEFAULT: "#b23a2e",
          deep: "#8f2b22",
        },
        gold: "#c9a227",
        jade: "#4a6b52",
      },
      fontFamily: {
        display: ["Fraunces", "Noto Serif SC", "ui-serif", "serif"],
        sans: [
          "Noto Sans",
          "Noto Sans Thai",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "sans-serif",
        ],
        hanzi: ["Noto Serif SC", "Ma Shan Zheng", "Songti SC", "serif"],
      },
      boxShadow: {
        paper:
          "0 1px 2px rgba(28,26,23,0.06), 0 10px 34px -14px rgba(28,26,23,0.28)",
        seal: "0 6px 18px -8px rgba(178,58,46,0.7)",
      },
      borderRadius: {
        card: "14px",
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "seal-pop": {
          "0%": { opacity: "0", transform: "scale(1.35) rotate(-8deg)" },
          "60%": { opacity: "1", transform: "scale(0.94) rotate(-2deg)" },
          "100%": { opacity: "1", transform: "scale(1) rotate(-3deg)" },
        },
        "ink-reveal": {
          "0%": { opacity: "0", filter: "blur(6px)" },
          "100%": { opacity: "1", filter: "blur(0)" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(178,58,46,0.45)" },
          "100%": { boxShadow: "0 0 0 14px rgba(178,58,46,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "seal-pop": "seal-pop 0.5s cubic-bezier(0.16,1,0.3,1) both",
        "ink-reveal": "ink-reveal 0.6s ease-out both",
        "pulse-ring": "pulse-ring 1.6s ease-out infinite",
      },
    },
  },
  plugins: [],
};
