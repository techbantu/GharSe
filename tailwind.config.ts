/**
 * NEW FILE: Tailwind CSS Configuration
 * 
 * Purpose: Extends Tailwind with custom design tokens, animations, and utilities
 * specifically crafted for Bantu's Kitchen brand identity.
 * 
 * Strategy: Creates a scalable design system that maintains consistency across
 * all components while allowing for easy theme modifications.
 */

import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    // Custom Color Palette - Brand-aligned colors for Indian cuisine
    colors: {
      inherit: "inherit",
      current: "currentColor",
      transparent: "transparent",
      white: "#FFFFFF",
      black: "#000000",
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
      status: {
        success: '#10B981',
        warning: '#F59E0B',
        error: '#EF4444',
        info: '#3B82F6',
      },
      gray: {
        50: '#F9FAFB',
        100: '#F3F4F6',
        200: '#E5E7EB',
        300: '#D1D5DB',
        400: '#9CA3AF',
        500: '#6B7280',
        600: '#4B5563',
        700: '#374151',
        800: '#1F2937',
        900: '#111827',
      },
    },
    
    // Typography - Professional font stack
    fontFamily: {
      sans: ['-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica Neue', 'Arial', 'sans-serif'],
    },
    
    // Spacing - Consistent rhythm across layouts
    spacing: {
      '0': '0',
      '1': '0.25rem',
      '2': '0.5rem',
      '3': '0.75rem',
      '4': '1rem',
      '5': '1.25rem',
      '6': '1.5rem',
      '7': '1.75rem',
      '8': '2rem',
      '9': '2.25rem',
      '10': '2.5rem',
      '11': '2.75rem',
      '12': '3rem',
      '14': '3.5rem',
      '16': '4rem',
      '18': '4.5rem',
      '20': '5rem',
      '22': '5.5rem',
      '24': '6rem',
      '26': '6.5rem',
      '28': '7rem',
      '30': '7.5rem',
      '32': '8rem',
      '36': '9rem',
      '40': '10rem',
      '44': '11rem',
      '48': '12rem',
      '52': '13rem',
      '56': '14rem',
      '60': '15rem',
      '64': '16rem',
      '72': '18rem',
      '80': '20rem',
      '96': '24rem',
    },
    
    // Border Radius - Smooth, modern corners
    borderRadius: {
      'none': '0',
      'sm': '0.125rem',
      'base': '0.25rem',
      'md': '0.375rem',
      'lg': '0.5rem',
      'xl': '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      '4xl': '2rem',
      '5xl': '2.5rem',
      'full': '9999px',
    },
    
    // Box Shadows - Depth and elevation system
    boxShadow: {
      'none': 'none',
      'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      'base': '0 1px 3px 0 rgb(0 0 0 / 0.1)',
      'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      'soft': '0 2px 15px rgba(0, 0, 0, 0.08)',
      'medium': '0 4px 25px rgba(0, 0, 0, 0.12)',
      'strong': '0 8px 35px rgba(0, 0, 0, 0.15)',
      'glow': '0 0 20px rgba(255, 107, 53, 0.3)',
      'glow-strong': '0 0 30px rgba(255, 107, 53, 0.5)',
    },
    
    // Custom Animations - Smooth, professional motion
    animation: {
      'fade-in': 'fadeIn 0.6s ease-in forwards',
      'slide-up': 'slideUp 0.6s ease-out forwards',
      'slide-down': 'slideDown 0.6s ease-out forwards',
      'slide-left': 'slideLeft 0.6s ease-out forwards',
      'slide-right': 'slideRight 0.6s ease-out forwards',
      'scale-in': 'scaleIn 0.4s ease-out forwards',
      'bounce-subtle': 'bounceSubtle 2s infinite',
      'pulse-soft': 'pulseSoft 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      'shimmer': 'shimmer 2s linear infinite',
      'float': 'float 3s ease-in-out infinite',
      'spin-slow': 'spin 3s linear infinite',
    },
    
    // Keyframes - Animation definitions
    keyframes: {
      fadeIn: {
        '0%': { opacity: '0' },
        '100%': { opacity: '1' },
      },
      slideUp: {
        '0%': { opacity: '0', transform: 'translateY(30px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      slideDown: {
        '0%': { opacity: '0', transform: 'translateY(-30px)' },
        '100%': { opacity: '1', transform: 'translateY(0)' },
      },
      slideLeft: {
        '0%': { opacity: '0', transform: 'translateX(30px)' },
        '100%': { opacity: '1', transform: 'translateX(0)' },
      },
      slideRight: {
        '0%': { opacity: '0', transform: 'translateX(-30px)' },
        '100%': { opacity: '1', transform: 'translateX(0)' },
      },
      scaleIn: {
        '0%': { opacity: '0', transform: 'scale(0.95)' },
        '100%': { opacity: '1', transform: 'scale(1)' },
      },
      bounceSubtle: {
        '0%, 100%': { transform: 'translateY(0)' },
        '50%': { transform: 'translateY(-10px)' },
      },
      pulseSoft: {
        '0%, 100%': { opacity: '1' },
        '50%': { opacity: '0.8' },
      },
      shimmer: {
        '0%': { backgroundPosition: '-1000px 0' },
        '100%': { backgroundPosition: '1000px 0' },
      },
      float: {
        '0%, 100%': { transform: 'translateY(0px)' },
        '50%': { transform: 'translateY(-20px)' },
      },
    },
    
    // Background Images - Gradient presets
    backgroundImage: {
      'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      'gradient-orange': 'linear-gradient(135deg, #FF6B35 0%, #F77F00 100%)',
      'gradient-green': 'linear-gradient(135deg, #2D6A4F 0%, #1B4332 100%)',
      'gradient-warm': 'linear-gradient(135deg, #FFB800 0%, #FF6B35 100%)',
    },
    
    // Z-Index - Layering system
    zIndex: {
      'auto': 'auto',
      '0': '0',
      '10': '10',
      '20': '20',
      '30': '30',
      '40': '40',
      '50': '50',
      '60': '60',
      '70': '70',
      '80': '80',
      '90': '90',
      '100': '100',
    },
    
    // Container - Responsive max-widths
    container: {
      center: true,
      padding: {
        DEFAULT: '1rem',
        sm: '2rem',
        lg: '4rem',
        xl: '5rem',
        '2xl': '6rem',
      },
    },
    
    // Aspect Ratios - Image and media constraints
    aspectRatio: {
      'auto': 'auto',
      'square': '1 / 1',
      'video': '16 / 9',
      'food': '4/3',
      'hero': '21/9',
    },
  },
  plugins: [
    // Add custom plugin for container queries if needed in future
  ],
};

export default config;

