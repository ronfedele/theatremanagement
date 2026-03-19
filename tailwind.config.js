/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['Playfair Display', 'Georgia', 'serif'],
        mono: ['"DM Mono"', 'monospace'],
        body: ['"Crimson Pro"', 'Georgia', 'serif'],
      },
      colors: {
        ink: { DEFAULT: '#0e0c08', 2: '#141009', 3: '#1c1610', 4: '#241e12' },
        gold: { DEFAULT: '#c9a84c', lt: '#e8d49a', dk: '#8a6f30' },
        parchment: '#f0ead8',
        cream: '#e6dfc8',
        muted: '#9a8e72',
        dim: '#5a5038',
      },
    },
  },
  plugins: [],
}
