/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#1F1D2B', // Main Background
          800: '#252836', // Card/Sidebar Background
          700: '#2D303E', // Input/Hover
        },
        accent: {
          DEFAULT: '#EA7C69', // Orange/Red Accent
          hover: '#E56A55',
        },
        text: {
          primary: '#FFFFFF',
          secondary: '#ABBBC2',
          muted: '#889898',
        }
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'], // Or 'Barlow', if we install it later
      }
    },
  },
  plugins: [],
}