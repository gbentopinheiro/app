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
          navy: '#183B5B',
          'navy-light': '#102E49',
          'navy-lighter': '#EAF1F6',
          blue: '#183B5B',
          cyan: '#EAF1F6',
          purple: '#FFF1E3',
          dark: '#102E49',
          secondary: '#556C86',
          border: '#DCE4EA',
          primary: '#B85E00',
          'primary-hover': '#AF5A00',
          background: '#F6F8FA',
          surface: '#FFFFFF',
          success: '#1F7A45',
          warning: '#B7791F',
          danger: '#B42318',
          info: '#1D4ED8',
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
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
