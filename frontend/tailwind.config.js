/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#062c22', // Deep Forest Green
          dark: '#041f18',
        },
        canvas: {
          DEFAULT: '#f6f5f0', // Soft Cream
          dark: '#062c22',    // Inverse
        },
        alert: {
          DEFAULT: '#e88b56', // Safety Coral
          hover: '#d07848',
        },
        ink: {
          DEFAULT: '#111111', // Charcoal/Black
          muted: '#444444',
          inverse: '#f6f5f0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], 
        mono: ['JetBrains Mono', 'monospace'],     
      },
      borderWidth: {
        '1': '1px',
      }
    },
  },
  plugins: [],
}
