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
        // existing CSS-var based (kept from bootstrap)
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Hydra dark/modern design tokens (see .claude/specs/global-tokens.md)
        "bg-primary": "#0a0a0f",
        "bg-card": "#13131a",
        "bg-nav": "#1a1a2e",
        "accent-purple": "#7c3aed",
        "accent-cyan": "#06b6d4",
        "text-primary": "#f9fafb",
        "text-secondary": "#9ca3af",
        "text-muted": "#6b7280",
        "border-default": "#1f2937",
      },
      borderRadius: {
        sm: "4px",
        md: "8px",
        lg: "16px",
        xl: "24px",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "Inter", "system-ui", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
      keyframes: {
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeInUp: "fadeInUp 0.6s ease-out both",
      },
    },
  },
  plugins: [],
};
export default config;
