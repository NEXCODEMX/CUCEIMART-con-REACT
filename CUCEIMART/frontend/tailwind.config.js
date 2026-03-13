/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        heading: ['"Syne"', 'sans-serif'],
        body:    ['"DM Sans"', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        primary:   { DEFAULT: '#0052CC', light: '#2684FF', dark: '#003380' },
        accent:    { DEFAULT: '#FF5630', light: '#FF7452', dark: '#DE350B' },
        gold:      { DEFAULT: '#FFAB00', light: '#FFE380', dark: '#FF8B00' },
        surface:   { DEFAULT: '#F4F5F7', dark: '#EBECF0', card: '#FFFFFF' },
        text:      { DEFAULT: '#172B4D', muted: '#6B778C', subtle: '#97A0AF' },
        cucei:     { blue: '#003FA5', green: '#00875A', red: '#DE350B' },
      },
      boxShadow: {
        card:    '0 1px 3px rgba(23,43,77,0.12), 0 4px 16px rgba(23,43,77,0.08)',
        hover:   '0 4px 12px rgba(0,82,204,0.20), 0 8px 32px rgba(0,82,204,0.12)',
        glow:    '0 0 0 3px rgba(0,82,204,0.25)',
        gold:    '0 4px 16px rgba(255,171,0,0.35)',
      },
      borderRadius: {
        xl2: '1.25rem',
        xl3: '1.75rem',
      },
      animation: {
        'fade-up':    'fadeUp 0.5s ease forwards',
        'fade-in':    'fadeIn 0.4s ease forwards',
        'slide-in':   'slideIn 0.4s ease forwards',
        'pulse-gold': 'pulseGold 2s ease-in-out infinite',
        'shimmer':    'shimmer 1.5s linear infinite',
      },
      keyframes: {
        fadeUp:    { from: { opacity: '0', transform: 'translateY(24px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        fadeIn:    { from: { opacity: '0' }, to: { opacity: '1' } },
        slideIn:   { from: { opacity: '0', transform: 'translateX(-24px)' }, to: { opacity: '1', transform: 'translateX(0)' } },
        pulseGold: { '0%,100%': { boxShadow: '0 0 0 0 rgba(255,171,0,0.4)' }, '50%': { boxShadow: '0 0 0 8px rgba(255,171,0,0)' } },
        shimmer:   { '0%': { backgroundPosition: '-200% 0' }, '100%': { backgroundPosition: '200% 0' } },
      },
    },
  },
  plugins: [],
};
