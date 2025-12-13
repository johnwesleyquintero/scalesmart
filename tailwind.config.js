/** @type {import('tailwindcss').Config} */

import typography from '@tailwindcss/typography';
import tailwindcssAnimate from 'tailwindcss-animate';

// Define frequently used color variables as constants
const foregroundColor = 'hsl(var(--foreground))';
const borderColor = 'hsl(var(--border))';
const mutedColor = 'hsl(var(--muted))';
const mutedForegroundColor = 'hsl(var(--muted-foreground))';
const primaryColor = 'hsl(var(--primary))';
const primaryForegroundColor = 'hsl(var(--primary-foreground))';

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
    '*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1rem' }],
        sm: ['0.875rem', { lineHeight: '1.25rem' }],
        base: ['1rem', { lineHeight: '1.5rem' }],
        lg: ['1.125rem', { lineHeight: '1.75rem' }],
        xl: ['1.25rem', { lineHeight: '1.75rem' }],
        '2xl': ['1.5rem', { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],
        '5xl': ['3rem', { lineHeight: '1' }],
        '6xl': ['4rem', { lineHeight: '1' }],
      },
      fontWeight: {
        hairline: '100',
        thin: '200',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },
      colors: {
        border: borderColor,
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: foregroundColor,
        primary: {
          DEFAULT: primaryColor,
          foreground: primaryForegroundColor,
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: mutedColor,
          foreground: mutedForegroundColor,
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: 'hsl(var(--success-foreground))',
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: 'hsl(var(--warning-foreground))',
        },
        info: {
          DEFAULT: 'hsl(var(--info))',
          foreground: 'hsl(var(--info-foreground))',
        },
        'user-bubble': {
          DEFAULT: 'hsl(var(--user-bubble))',
          foreground: 'hsl(var(--user-bubble-foreground))',
        },
        'typing-indicator': {
          DEFAULT: 'hsl(var(--typing-indicator))',
          foreground: 'hsl(var(--typing-indicator-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0 },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: 0 },
        },
        blink: {
          '0%, 100%': { opacity: 1 },
          '50%': { opacity: 0 },
        },
        fadeIn: {
          '0%': { opacity: 0, transform: 'translateY(10px)' },
          '100%': { opacity: 1, transform: 'translateY(0)' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        gradient: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '100% 50%' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
        blink: 'blink 1s step-end infinite',
        fadeIn: 'fadeIn 1s ease-out forwards',
        float: 'float 3s ease-in-out infinite',
        gradient: 'gradient 8s linear infinite alternate',
      },
      transitionProperty: {
        'common': 'background-color, border-color, color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter',
      },
      transitionDuration: {
        'DEFAULT': '200ms',
      },
      transitionTimingFunction: {
        'in-out': 'ease-in-out',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: '100%',
            color: foregroundColor,
            fontSize: '1rem',
            lineHeight: '1.75rem',
            h1: {
              color: foregroundColor,
              fontSize: '2.25rem',
              lineHeight: '2.5rem',
              marginTop: '2rem',
              marginBottom: '1rem',
              fontWeight: '700',
              scrollMarginTop: '2rem',
              '&:first-child': {
                marginTop: '0',
              },
            },
            h2: {
              color: foregroundColor,
              fontSize: '1.875rem',
              lineHeight: '2.25rem',
              marginTop: '2rem',
              marginBottom: '1rem',
              fontWeight: '600',
              scrollMarginTop: '2rem',
              borderBottom: `1px solid ${borderColor}`,
              paddingBottom: '0.5rem',
              '&:first-child': {
                marginTop: '0',
              },
            },
            h3: {
              color: foregroundColor,
              fontSize: '1.5rem',
              lineHeight: '2rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              scrollMarginTop: '2rem',
            },
            h4: {
              color: foregroundColor,
              fontSize: '1.25rem',
              lineHeight: '1.75rem',
              marginTop: '1.5rem',
              marginBottom: '0.75rem',
              fontWeight: '600',
              scrollMarginTop: '2rem',
            },
            p: {
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            ul: {
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            ol: {
              marginTop: '1rem',
              marginBottom: '1rem',
            },
            li: {
              marginTop: '0.25rem',
              marginBottom: '0.25rem',
            },
            blockquote: {
              borderLeftColor: borderColor,
              borderLeftWidth: '4px',
              paddingLeft: '1rem',
              fontStyle: 'italic',
              color: mutedForegroundColor,
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            table: {
              width: '100%',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
              borderCollapse: 'collapse',
              textAlign: 'left',
              fontSize: '0.875rem',
              lineHeight: '1.25rem',
              'th, td': {
                padding: '0.75rem',
                border: `1px solid ${borderColor}`,
              },
              th: {
                backgroundColor: mutedColor,
                fontWeight: '600',
                color: foregroundColor,
              },
              'tbody tr:nth-child(even)': {
                backgroundColor: mutedColor,
              },
            },
            code: {
              color: foregroundColor,
              backgroundColor: mutedColor,
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontWeight: '500',
            },
            'code::before': {
              content: '""',
            },
            'code::after': {
              content: '""',
            },
            pre: {
              backgroundColor: mutedColor,
              color: foregroundColor,
              padding: '1rem',
              borderRadius: '0.375rem',
              overflowX: 'auto',
              marginTop: '1.5rem',
              marginBottom: '1.5rem',
            },
            kbd: {
              backgroundColor: mutedColor,
              color: foregroundColor,
              padding: '0.2em 0.4em',
              borderRadius: '0.25rem',
              fontFamily: 'monospace',
              fontSize: '0.875rem',
            },
            hr: {
              marginTop: '2rem',
              marginBottom: '2rem',
              borderTopWidth: '1px',
              borderColor: borderColor,
            },
          },
        },
        dark: {
          css: {
            color: mutedForegroundColor,
            a: {
              color: primaryColor,
              '&:hover': {
                color: primaryForegroundColor,
              },
            },
            h1: {
              color: foregroundColor,
            },
            h2: {
              color: foregroundColor,
              borderBottomColor: borderColor,
            },
            h3: {
              color: foregroundColor,
            },
            h4: {
              color: foregroundColor,
            },
            blockquote: {
              borderLeftColor: borderColor,
              color: mutedForegroundColor,
            },
            table: {
              'th, td': {
                borderColor: borderColor,
              },
              th: {
                backgroundColor: mutedColor,
                color: foregroundColor,
              },
              'tbody tr:nth-child(even)': {
                backgroundColor: mutedColor,
              },
            },
            code: {
              color: foregroundColor,
              backgroundColor: mutedColor,
            },
            pre: {
              backgroundColor: mutedColor,
              color: foregroundColor,
            },
            kbd: {
              backgroundColor: mutedColor,
              color: foregroundColor,
            },
            hr: {
              borderColor: borderColor,
            },
          },
        },
      },
    },
  },
  plugins: [typography, tailwindcssAnimate, function ({ addVariant }) {
    addVariant('group-hover', '.group:hover &');
  }],
};

export default config;
