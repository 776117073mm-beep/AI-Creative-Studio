export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        surface: {
          DEFAULT: '#1a1a1f',
          elevated: '#252529',
          overlay: 'rgba(0, 0, 0, 0.8)',
        },
        border: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          hover: 'rgba(255, 255, 255, 0.12)',
        },
        canvas: {
          DEFAULT: '#0d0d11',
          grid: 'rgba(255, 255, 255, 0.03)',
        },
        accent: {
          cyan: '#06b6d4',
          orange: '#f97316',
          green: '#22c55e',
          red: '#ef4444',
          blue: '#3b82f6',
          yellow: '#eab308',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Menlo', 'monospace'],
      },
      spacing: {
        panel: '280px',
        toolbar: '48px',
        timeline: '200px',
      },
      zIndex: {
        canvas: 0,
        layers: 10,
        timeline: 20,
        panels: 30,
        toolbar: 40,
        floating: 50,
        modal: 60,
        tooltip: 70,
        command: 80,
      },
    },
  },
  plugins: [],
};
