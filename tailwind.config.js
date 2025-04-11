const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  content: ['./pages/**/*.{js,ts,jsx,tsx}', './components/**/*.{js,ts,jsx,tsx}'],
  safelist: ['animate-star', 'animate-slide-in-out'], // Ensure these classes are not purged
  theme: {
    extend: {
      keyframes: {
        star: {
          '0%': { transform: 'scale(0.5) rotate(0deg)', opacity: '1' },
          '50%': { transform: 'scale(1.5) rotate(45deg)', opacity: '0.8' },
          '100%': { transform: 'scale(0) rotate(90deg)', opacity: '0' },
        },
      },
      animation: {
        star: 'star 2s ease-out forwards',
      },
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', ...fontFamily.mono],
        vt323: ['var(--font-vt323)', 'monospace'],
      },
    },
  },
};