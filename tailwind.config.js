/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./{app,components,libs,pages,hooks}/**/*.{html,js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // REPLACE #007bff WITH YOUR ACTUAL BRAND CSS COLOR
        brand: {
          DEFAULT: '#007bff', 
          50: '#f0f7ff',
          100: '#e0effe',
          200: '#bae0fd',
          300: '#7cc8fc',
          400: '#36aff9',
          500: '#1E88E5', // Main brand color
          600: '#0062cc',
          700: '#004da3',
          800: '#003675',
          900: '#001d3d',
        },
      },
    },
  },
  plugins: [],
}