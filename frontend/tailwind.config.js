/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#030712',    // gray-950/almost pure black
        surface: '#0f1322',       // deep space dark blue/gray
        primary: '#8b5cf6',       // violet-500
        primaryHover: '#7c3aed',  // violet-600
        secondary: '#06b6d4',     // cyan-500
        secondaryHover: '#0891b2',// cyan-600
        textMain: '#f8fafc',      // slate-50
        textMuted: '#94a3b8',     // slate-400
        borderLight: '#1e293b',   // slate-800
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        heading: ['"Space Grotesk"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
