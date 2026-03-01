/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        body:    ['"Tenor Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  'hsl(40, 33%, 97%)',
          100: 'hsl(40, 30%, 93%)',
          200: 'hsl(35, 40%, 85%)',
          300: 'hsl(152, 35%, 65%)',
          400: 'hsl(152, 35%, 50%)',
          500: 'hsl(152, 35%, 38%)',
          600: 'hsl(152, 38%, 30%)',
          700: 'hsl(152, 40%, 22%)',
        },
      },
    },
  },
  plugins: [],
}
