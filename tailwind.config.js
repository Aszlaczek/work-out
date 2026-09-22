/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-outfit)', 'Outfit', 'sans-serif'],
        display: ['var(--font-barlow)', 'Barlow Condensed', 'sans-serif'],
        mono: ['var(--font-jetbrains)', 'JetBrains Mono', 'monospace'],
      },
      colors: {
        gym: {
          darkBg: '#07071a',
          darkSurface: '#0d0d24',
          darkCard: '#11112a',
          darkBorder: '#1c1c3a',
          darkDim: '#252548',
          orange: '#ff5500',
          orangeHover: '#ff6e26',
          violet: '#7c3aed',
          cyan: '#22d3ee',
          darkText: '#e8e8f4',
          darkMuted: '#5a5a82',
          danger: '#ef4444',

          lightBg: '#f0eff6',
          lightSurface: '#ffffff',
          lightCard: '#f7f6fc',
          lightBorder: '#e2e0ee',
          lightDim: '#ebebf5',
          lightOrange: '#e84a00',
          lightViolet: '#6d28d9',
          lightCyan: '#0284c7',
          lightText: '#0d0c1e',
          lightMuted: '#6b6989',
          lightDanger: '#dc2626',
        },
      },
      animation: {
        'pulse-dot': 'pulse-dot 1.4s ease-in-out infinite',
        'slide-up': 'slide-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) forwards',
      },
      keyframes: {
        'pulse-dot': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.4', transform: 'scale(0.7)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
