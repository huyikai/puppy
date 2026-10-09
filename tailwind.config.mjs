/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      colors: {
        // Aperture palette: warm off-white, deep ink, sparse burgundy accent
        bg: {
          DEFAULT: '#F2EFE9',
          paper: '#FFFFFF',
          dark: '#0A0A0A',
          scrim: 'rgba(10, 10, 10, 0.94)',
        },
        ink: {
          DEFAULT: '#0A0A0A',
          soft: '#3A3A38',
          muted: '#7A7874',
          faint: '#A8A6A2',
          inverse: '#F2EFE9',
        },
        line: {
          DEFAULT: '#C8C5BF',
          soft: '#DDDAD4',
        },
        accent: {
          DEFAULT: '#8B2C2C',
          deep: '#6E2222',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          'PingFang SC',
          'Hiragino Sans GB',
          'Microsoft YaHei',
          'Helvetica Neue',
          'sans-serif',
        ],
        serif: [
          'Songti SC',
          'STSong',
          'ui-serif',
          'Georgia',
          'serif',
        ],
        mono: [
          'ui-monospace',
          'SFMono-Regular',
          'Menlo',
          'Monaco',
          'Consolas',
          'monospace',
        ],
      },
      fontSize: {
        '2xs': ['0.6875rem', { lineHeight: '1.4' }],   // 11
        'xs':  ['0.75rem',   { lineHeight: '1.5' }],   // 12
        'sm':  ['0.8125rem', { lineHeight: '1.6' }],   // 13
        'base':['0.875rem',  { lineHeight: '1.65' }],  // 14 (editorial body)
        'lg':  ['1rem',      { lineHeight: '1.55' }],  // 16
        'xl':  ['1.125rem',  { lineHeight: '1.45' }],  // 18
        '2xl': ['1.375rem',  { lineHeight: '1.3' }],   // 22
        '3xl': ['1.75rem',   { lineHeight: '1.15' }],   // 28
        '4xl': ['2.25rem',   { lineHeight: '1.05' }],   // 36
        '5xl': ['3rem',      { lineHeight: '1.0' }],    // 48
        '6xl': ['4rem',      { lineHeight: '0.95' }],   // 64
        '7xl': ['5.5rem',    { lineHeight: '0.9' }],    // 88
        '8xl': ['7rem',      { lineHeight: '0.9' }],    // 112
        '9xl': ['9rem',      { lineHeight: '0.85' }],   // 144
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
      },
      letterSpacing: {
        'wide-meta': '0.08em',
        'wide-extra': '0.14em',
      },
      borderRadius: {
        none: '0',
        sm: '2px',
      },
      boxShadow: {
        none: 'none',
      },
      transitionTimingFunction: {
        'expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'soft': 'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        'fast': '180ms',
        'base': '320ms',
        'slow': '600ms',
        'x-slow': '900ms',
      },
      maxWidth: {
        'prose': '640px',
        'content': '1280px',
        'wide': '1480px',
        'plate': '1640px',
      },
    },
  },
  plugins: [],
};