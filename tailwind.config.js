/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
      '3xl': '1920px',
    },
    extend: {
      colors: {
        kawaii: {
          pink: 'rgba(var(--pink), <alpha-value>)',
          'pink-light': 'rgba(var(--pink-light), <alpha-value>)',
          'pink-pale': 'rgba(var(--pink-pale), <alpha-value>)',
          cyan: 'rgba(var(--cyan), <alpha-value>)',
          'cyan-light': 'rgba(var(--cyan-light), <alpha-value>)',
          'cyan-pale': 'rgba(var(--cyan-pale), <alpha-value>)',
          purple: 'rgba(var(--purple), <alpha-value>)',
          'purple-light': 'rgba(var(--purple-light), <alpha-value>)',
          'purple-pale': 'rgba(var(--purple-pale), <alpha-value>)',
          yellow: 'rgba(var(--yellow), <alpha-value>)',
          'yellow-light': 'rgba(var(--yellow-light), <alpha-value>)',
          mint: 'rgba(var(--mint), <alpha-value>)',
          peach: 'rgba(var(--peach), <alpha-value>)',
          'peach-light': 'rgba(var(--peach-light), <alpha-value>)',
          lavender: 'rgba(var(--lavender), <alpha-value>)',
          surface: 'rgba(var(--surface), <alpha-value>)',
          'surface-hover': 'rgba(var(--surface-hover), <alpha-value>)',
          text: 'rgba(var(--foreground), <alpha-value>)',
          muted: 'rgba(var(--text-muted), <alpha-value>)',
          border: 'rgba(var(--border), <alpha-value>)',
          void: 'rgba(var(--void), <alpha-value>)',
          'hero-void': 'rgba(var(--hero-void), <alpha-value>)',
        },
      },
      fontFamily: {
        rounded: ['"Zen Kaku Gothic New"', '"Noto Sans SC"', 'sans-serif'],
        sans: ['"Zen Kaku Gothic New"', '"Noto Sans SC"', 'sans-serif'],
        display: ['"Shippori Mincho"', '"Noto Serif SC"', 'serif'],
      },
    },
  },
  plugins: [],
};
