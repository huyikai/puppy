/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: {
          base: '#FAF7F2',
          elevated: '#FFFDF8',
          overlay: 'rgba(40, 30, 20, 0.72)',
        },
        accent: {
          DEFAULT: '#C49B6C',
          soft: '#E8D5BC',
        },
        warm: {
          DEFAULT: '#E8A87C',
          soft: '#F4D9C0',
        },
        text: {
          strong: '#2E2A26',
          body: '#4A4540',
          muted: '#8C847B',
          faint: '#B5ADA3',
        },
        border: {
          soft: '#EDE6DA',
        },
      },
      fontFamily: {
        serif: [
          'Songti SC',
          'STSong',
          'Source Han Serif SC',
          'Noto Serif SC',
          'serif',
        ],
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'sans-serif',
        ],
      },
      fontSize: {
        xs: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.05em' }],
        sm: ['0.875rem', { lineHeight: '1.5' }],
        base: ['1rem', { lineHeight: '1.65' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        xl: ['1.375rem', { lineHeight: '1.4' }],
        '2xl': ['1.75rem', { lineHeight: '1.3' }],
        '3xl': ['2.25rem', { lineHeight: '1.2' }],
        '4xl': ['3rem', { lineHeight: '1.1' }],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '20px',
      },
      boxShadow: {
        sm: '0 1px 2px rgba(60, 40, 20, 0.06)',
        md: '0 4px 16px rgba(60, 40, 20, 0.08)',
        lg: '0 12px 32px rgba(60, 40, 20, 0.12)',
      },
      transitionTimingFunction: {
        'ease-out-soft': 'cubic-bezier(0.2, 0.8, 0.2, 1)',
        'ease-in-out-soft': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '250ms',
        slow: '400ms',
      },
      maxWidth: {
        prose: '720px',
        content: '1100px',
      },
    },
  },
  plugins: [],
};