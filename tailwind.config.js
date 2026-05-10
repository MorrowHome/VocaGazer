/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        kawaii: {
          pink: '#FF6B9D',
          'pink-light': '#FFD6E3',
          'pink-pale': '#FFF0F5',
          cyan: '#39BEB9',
          'cyan-light': '#B8E8E6',
          'cyan-pale': '#E8F8F7',
          purple: '#B388FF',
          'purple-light': '#DCC8FF',
          'purple-pale': '#F3ECFF',
          yellow: '#F7C94C',
          'yellow-light': '#FCE8A0',
          mint: '#A8D14B',
          peach: '#FFB08C',
          'peach-light': '#FFE0D0',
          lavender: '#E8E0F0',
          surface: '#F8F4FF',
          'surface-hover': '#F0ECFF',
          text: '#2D2D3A',
          muted: '#9A9AB0',
          border: '#E0D8EC',
        },
      },
      fontFamily: {
        rounded: ['"M PLUS Rounded 1c"', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
