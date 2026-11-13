/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#f0f4f9',
          100: '#e1e9f2',
          200: '#c3d3e6',
          300: '#95b4d4',
          400: '#608ebf',
          500: '#3c6ea6',
          600: '#2b5589',
          700: '#23446f',
          800: '#1b3457',
          900: '#0f1f38',
          950: '#0a1426',
        },
        corporate: {
          blue: '#1e40af',
          light: '#f8fafc',
          accent: '#3b82f6',
        },
      },
    },
  },
  plugins: [],
};

