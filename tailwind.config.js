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
        bubblegum: '#FF6B9D',
        cotton: '#FFD6E7',
        mint: '#C8F0D5',
        lavender: '#D4C1F5',
        sunshine: '#FFE082',
        sky: '#B3E5FC',
        cream: '#FFF8F0',
        coral: '#FF8A80',
        softpink: '#FCE4EC',
        softblue: '#E3F2FD',
        tama: {
          yellow: '#FFF3C4',
          blue: '#4A90D9',
          pink: '#FF6B9D',
          purple: '#9B59B6',
          green: '#2ECC71',
        }
      },
      fontFamily: {
        cute: ['Nunito', 'sans-serif'],
        display: ['Fredoka One', 'cursive'],
      },
      borderRadius: {
        'xl2': '1.5rem',
        'xl3': '2rem',
        'bubble': '50% 50% 50% 50% / 60% 60% 40% 40%',
      },
      animation: {
        'bounce-slow': 'bounce 2s infinite',
        'float': 'float 3s ease-in-out infinite',
        'wiggle': 'wiggle 1s ease-in-out infinite',
        'heartbeat': 'heartbeat 1.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        wiggle: {
          '0%, 100%': { transform: 'rotate(-5deg)' },
          '50%': { transform: 'rotate(5deg)' },
        },
        heartbeat: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.15)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      boxShadow: {
        'cute': '0 4px 15px rgba(255, 107, 157, 0.3)',
        'soft': '0 8px 32px rgba(0,0,0,0.08)',
        'bubble': '0 10px 40px rgba(255, 107, 157, 0.2)',
      }
    },
  },
  plugins: [],
}
