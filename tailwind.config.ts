/**
 * Tailwind CSS Configuration
 *
 * IMPORTANT: Use theme.extend to ADD custom tokens while keeping ALL Tailwind defaults.
 * Never replace theme directly - that breaks default utilities like max-w-lg, shadow-xl, etc.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // EXTEND Tailwind defaults - don't replace them
    extend: {
      // Brand colors - these ADD to Tailwind's default colors
      colors: {
        primary: {
          50: '#FFF5F0',
          100: '#FFE6D9',
          200: '#FFCCB3',
          300: '#FFB38C',
          400: '#FF9966',
          500: '#FF6B35',
          600: '#E85A2B',
          700: '#CC4921',
          800: '#B33817',
          900: '#99270D',
        },
        secondary: {
          50: '#E8F5F0',
          100: '#D1EBE1',
          200: '#A3D7C3',
          300: '#75C3A5',
          400: '#47AF87',
          500: '#2D6A4F',
          600: '#26593F',
          700: '#1F482F',
          800: '#18371F',
          900: '#11260F',
        },
        accent: {
          gold: '#FFB800',
          saffron: '#F77F00',
          cream: '#FFF8F0',
        },
      },

      // Custom font stack
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
      },

      // Additional shadows (Tailwind defaults like shadow-xl are preserved)
      boxShadow: {
        'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
        'medium': '0 4px 25px rgba(0, 0, 0, 0.12)',
        'strong': '0 8px 35px rgba(0, 0, 0, 0.15)',
        'glow': '0 0 20px rgba(255, 107, 53, 0.3)',
        'glow-strong': '0 0 30px rgba(255, 107, 53, 0.5)',
      },

      // Custom animations
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'spin-slow': 'spin 3s linear infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },

      // Custom gradients
      backgroundImage: {
        'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #F77F00 100%)',
        'gradient-green': 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
        'gradient-warm': 'linear-gradient(135deg, #FFB800 0%, #FF6B35 100%)',
      },

      // Custom aspect ratios
      aspectRatio: {
        'food': '4/3',
        'hero': '21/9',
      },
    },
  },
  plugins: [],
};

export default config;
