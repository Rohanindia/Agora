import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#080B14",
        panel: "#111113",
        line: "#2a2a2f",
        "agora-violet": "#7C3AED",
        "agora-cyan": "#06B6D4",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        "fade-in": "fade-in 0.5s ease forwards",
        "slide-up": "slide-up 0.4s ease forwards",
        "pulse-slow": "pulse-slow 2s ease-in-out infinite",
        "verdict-in": "verdict-in 0.6s ease forwards",
        "gradient-shift": "gradient-shift 3s ease infinite",
        "orb-drift": "orb-drift 20s ease-in-out infinite alternate",
        "orb-drift-reverse": "orb-drift-reverse 25s ease-in-out infinite alternate",
        "glow-pulse": "glow-pulse 2s ease-in-out infinite",
        "ring-ping": "ring-ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite",
        "stagger-1": "fade-in 0.5s ease 0.05s forwards",
        "stagger-2": "fade-in 0.5s ease 0.1s forwards",
        "stagger-3": "fade-in 0.5s ease 0.15s forwards",
        "stagger-4": "fade-in 0.5s ease 0.2s forwards",
        "stagger-5": "fade-in 0.5s ease 0.25s forwards",
        "stagger-6": "fade-in 0.5s ease 0.3s forwards",
        "stagger-7": "fade-in 0.5s ease 0.35s forwards",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.6" },
        },
        "verdict-in": {
          "0%": { opacity: "0", transform: "scale(0.95)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "gradient-shift": {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
        "orb-drift": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(30px, -50px) scale(1.05)" },
          "66%": { transform: "translate(-20px, 30px) scale(0.95)" },
          "100%": { transform: "translate(10px, -20px) scale(1.02)" },
        },
        "orb-drift-reverse": {
          "0%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(-40px, 30px) scale(1.08)" },
          "66%": { transform: "translate(25px, -40px) scale(0.92)" },
          "100%": { transform: "translate(-15px, 20px) scale(1.03)" },
        },
        "glow-pulse": {
          "0%, 100%": { boxShadow: "0 0 15px 0 var(--glow-color, rgba(124,58,237,0.3))" },
          "50%": { boxShadow: "0 0 25px 5px var(--glow-color, rgba(124,58,237,0.4))" },
        },
        "ring-ping": {
          "0%": { transform: "scale(1)", opacity: "0.6" },
          "100%": { transform: "scale(1.8)", opacity: "0" },
        },
      },
    },
  },
  plugins: [],
};

export default config;
