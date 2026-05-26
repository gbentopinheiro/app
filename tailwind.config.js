/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        bentix: {
          navy: '#071226',
          'navy-light': '#0B1F46',
          'navy-lighter': '#0a1a38',
          blue: '#006DFF',
          cyan: '#22C7FF',
          purple: '#5B35FF',
          dark: '#111827',
          secondary: '#64748B',
          border: '#D8E1EE',
        },
      },
      borderRadius: {
        '3xl': '24px',
      },
      boxShadow: {
        'lg-custom': '0 28px 76px rgba(2, 6, 23, 0.34)',
        'card': '0 12px 26px rgba(15, 23, 42, 0.05)',
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', '-apple-system', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
