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
        vocaloid: {
          purple: '#6B21A8',
          cyan: '#06B6D4',
          pink: '#EC4899',
        },
      },
    },
  },
  plugins: [],
};
