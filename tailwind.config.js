/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        surface2: 'var(--surface-2)',
        ink: 'var(--text)',
        muted: 'var(--muted)',
        line: 'var(--line)',
        brand: {
          DEFAULT: 'var(--brand)',
          soft: 'var(--brand-soft)',
          strong: 'var(--brand-strong)',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(28, 25, 20, 0.04), 0 8px 24px -12px rgba(28, 25, 20, 0.12)',
        float: '0 8px 30px -10px rgba(28, 25, 20, 0.25)',
      },
      borderRadius: {
        '2.5xl': '1.25rem',
        '3xl': '1.5rem',
      },
      fontFamily: {
        sans: [
          'ui-sans-serif',
          '-apple-system',
          'BlinkMacSystemFont',
          '"Segoe UI"',
          '"PingFang SC"',
          '"Hiragino Sans GB"',
          '"Microsoft YaHei"',
          'sans-serif',
        ],
        serif: ['Georgia', '"Times New Roman"', 'Songti SC', 'serif'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(0.92)', opacity: '0.55' },
          '100%': { transform: 'scale(1.6)', opacity: '0' },
        },
        'fade-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        wave: {
          '0%, 100%': { transform: 'scaleY(0.35)' },
          '50%': { transform: 'scaleY(1)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
        'tab-shuttle': {
          '0%': { transform: 'scaleX(0.55)' },
          '55%': { transform: 'scaleX(1.15)' },
          '100%': { transform: 'scaleX(1)' },
        },
        'typing-dot': {
          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: '0.35' },
          '30%': { transform: 'translateY(-4px)', opacity: '1' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.8s cubic-bezier(0.2, 0.6, 0.4, 1) infinite',
        'fade-up': 'fade-up 0.35s ease-out both',
        wave: 'wave 0.9s ease-in-out infinite',
        'tab-shuttle': 'tab-shuttle 0.36s cubic-bezier(0.22, 1, 0.36, 1)',
        'typing-dot': 'typing-dot 1.1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
