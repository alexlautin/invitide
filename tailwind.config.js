const { fontFamily } = require('tailwindcss/defaultTheme');

module.exports = {
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-jetbrains-mono)', ...fontFamily.mono],
        vt323: ['var(--font-vt323)', 'monospace'],
      },
    },
  },
};