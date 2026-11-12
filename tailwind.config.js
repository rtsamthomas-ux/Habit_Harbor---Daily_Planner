/** @type {import('tailwind.css').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Sea-inspired palette mapped over the greens the UI already uses:
        // "emerald" = deep harbor teal, "teal" = soft aqua.
        emerald: {
          50: '#eef7f5',
          100: '#d6ebe8',
          200: '#aed8d3',
          300: '#7fbdb7',
          400: '#4d9e99',
          500: '#2f837f',
          600: '#1f6a68',
          700: '#1d5656',
          800: '#1c4747',
          900: '#1a3b3c',
        },
        teal: {
          50: '#f0f9f8',
          100: '#daeeec',
          200: '#b5dedb',
          300: '#93d3ce',
          400: '#63bab4',
          500: '#41a09b',
          600: '#2f8683',
          700: '#296d6b',
        },
      },
    },
  },
  plugins: [],
};
