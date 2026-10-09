/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx,vue,svelte,md,mdx}'],
  theme: {
    extend: {
      colors: {
        // 暖白底 + 黑字（现代杂志风）
        bg: {
          DEFAULT: '#FAF7F8',
          elevated: '#FFFFFF',
          dark: '#111111',
          overlay: 'rgba(17, 17, 17, 0.94)',
        },
        ink: {
          DEFAULT: '#111111',
          soft: '#3A3A3A',
          muted: '#7A7A78',
          inverse: '#FAF7F8',
        },
        line: {
          DEFAULT: '#E5E5E2',
          soft: '#EFEFEC',
        },
        accent: {
          DEFAULT: '#111111', // 杂志风不强调彩色，重点用黑
          warm: '#C49B6C', // 保留作为可选 accent
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
        // 杂志风字号尺度
        'caption': ['0.6875rem', { lineHeight: '1.4', letterSpacing: '0.12em' }],
        'meta':    ['0.75rem',   { lineHeight: '1.4', letterSpacing: '0.08em' }],
        'small':   ['0.8125rem', { lineHeight: '1.5' }],
        'body':    ['0.9375rem', { lineHeight: '1.7' }],
        'lg':      ['1.0625rem', { lineHeight: '1.6' }],
        'xl':      ['1.25rem',   { lineHeight: '1.4' }],
        '2xl':     ['1.5rem',    { lineHeight: '1.3' }],
        '3xl':     ['2rem',      { lineHeight: '1.15' }],
        '4xl':     ['2.75rem',   { lineHeight: '1.05' }],
        '5xl':     ['3.75rem',   { lineHeight: '1.0' }],
        '6xl':     ['5rem',      { lineHeight: '1.0' }],
      },
      spacing: {
        'safe-top':    'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'gutter':      'max(20px, calc((100vw - 1100px) / 2))',
      },
      letterSpacing: {
        'wide-meta':  '0.12em',
        'ultra-wide': '0.25em',
      },
      borderRadius: {
        none: '0',
        sm:   '2px',
        DEFAULT: '0',
        md: '2px',
      },
      boxShadow: {
        none: 'none',
        sm: '0 1px 2px rgba(0, 0, 0, 0.04)',
        DEFAULT: '0 2px 12px rgba(0, 0, 0, 0.06)',
        md: '0 8px 32px rgba(0, 0, 0, 0.08)',
        lg: '0 24px 64px rgba(0, 0, 0, 0.14)',
      },
      transitionTimingFunction: {
        'expo':  'cubic-bezier(0.16, 1, 0.3, 1)',
        'ease':  'cubic-bezier(0.4, 0, 0.2, 1)',
        'soft':  'cubic-bezier(0.32, 0.72, 0, 1)',
      },
      transitionDuration: {
        'fast': '180ms',
        'base': '320ms',
        'slow': '560ms',
        'x-slow': '900ms',
      },
      maxWidth: {
        'prose':   '680px',
        'content': '1100px',
        'wide':    '1440px',
      },
    },
  },
  plugins: [],
};