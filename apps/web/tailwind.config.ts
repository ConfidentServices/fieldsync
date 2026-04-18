import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // FieldSync dark theme
        bg: {
          primary: '#0a0a0f',
          secondary: '#12121a',
          card: '#1a1a24',
          elevated: '#22222e',
        },
        accent: {
          green: '#22c55e',
          'green-dim': '#16a34a',
          red: '#ef4444',
          'red-dim': '#dc2626',
          yellow: '#eab308',
          blue: '#3b82f6',
          purple: '#a855f7',
        },
        text: {
          primary: '#f8fafc',
          secondary: '#94a3b8',
          muted: '#475569',
        },
        border: {
          default: '#1e1e2e',
          subtle: '#2a2a3a',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
    },
  },
  plugins: [],
}

export default config
