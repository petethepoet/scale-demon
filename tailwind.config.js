/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#0A0614',
        void: '#160A2A',
        'demon-purple': {
          DEFAULT: '#6F42C1',
          dark: '#4A2D8A',
          light: '#9B6EE8',
        },
        ember: {
          DEFAULT: '#F28C28',
          hot: '#FF6A1A',
        },
        ice: '#53C8F5',
        ash: '#8A83A6',
        bone: '#F4E8C8',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        ui: ['"Inter"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', '"Fira Code"', 'monospace'],
      },
      borderRadius: {
        card: '12px',
        btn: '8px',
        chip: '6px',
      },
      boxShadow: {
        glow: '0 0 20px rgba(111,66,193,0.25)',
        'glow-ember': '0 0 20px rgba(242,140,40,0.25)',
        'glow-ice': '0 0 14px rgba(83,200,245,0.2)',
        card: '0 2px 16px rgba(0,0,0,0.5)',
      },
      animation: {
        'fade-in': 'fadeIn 0.2s ease-out',
        'slide-up': 'slideUp 0.25s ease-out',
        'pulse-glow': 'pulseGlow 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(8px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 8px rgba(111,66,193,0.2)' },
          '50%': { boxShadow: '0 0 20px rgba(111,66,193,0.45)' },
        },
      },
    },
  },
  plugins: [],
}
