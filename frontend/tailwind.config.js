/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Paleta Drogamais
        drogamais: {
          50:  '#fff0f0',
          100: '#ffd6d6',
          200: '#ffadad',
          300: '#ff7b7b',
          400: '#ff4d4d',
          500: '#e8001c', // Vermelho primário Drogamais
          600: '#cc0018',
          700: '#a80014',
          800: '#87000f',
          900: '#6b000b',
        },
      },
    },
  },
  plugins: [],
}
