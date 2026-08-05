import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        ink: '#2B2723',
        porcelain: '#FAF7F1',
        sand: '#E9E0CC',
        stone: {
          DEFAULT: '#96897A',
          light: '#C9C0B2',
        },
        moss: {
          50: '#EFF2E9',
          100: '#DCE2D0',
          300: '#9AA684',
          500: '#5F6B4C',
          600: '#4C5640',
          700: '#3A422F',
        },
        clay: {
          50: '#F6EEE2',
          100: '#EAD9C0',
          300: '#C9A374',
          500: '#A67C4D',
          600: '#8A6440',
        },
      },
      fontFamily: {
        display: ['var(--font-fraunces)', 'Georgia', 'serif'],
        body: ['var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'monospace'],
      },
      borderRadius: {
        xl: '0.875rem',
        '2xl': '1.25rem',
      },
      keyframes: {
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.4' },
        },
        auraShift: {
          '0%, 100%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
        },
        float: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(2%, -4%) scale(1.06)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translate(0, 0) scale(1)' },
          '50%': { transform: 'translate(-3%, 3%) scale(1.04)' },
        },
        ctaGlow: {
          '0%, 100%': { transform: 'scale(1)', boxShadow: '0 0 0 0 rgba(95,107,76,0.35)' },
          '50%': { transform: 'scale(1.015)', boxShadow: '0 0 0 12px rgba(95,107,76,0)' },
        },
      },
      animation: {
        pulseSoft: 'pulseSoft 2s ease-in-out infinite',
        auraShift: 'auraShift 40s ease-in-out infinite',
        float: 'float 16s ease-in-out infinite',
        floatSlow: 'floatSlow 22s ease-in-out infinite',
        ctaGlow: 'ctaGlow 3.2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
