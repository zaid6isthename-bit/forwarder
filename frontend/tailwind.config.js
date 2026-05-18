/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          orange: '#F97316',     // Primary Orange
          orangeDark: '#EA580C', // Hover Orange
          cream: '#FFF8F0',      // Main Background Cream
          creamLight: '#FFFBF5', // Subtly lighter cream
          creamDark: '#FFF1E0',  // Slightly darker cream for highlights
          surface: '#FFFFFF',    // Card white surfaces
          divider: '#FFE5CC',    // Light orange accent borders
          textHead: '#1C1009',   // Deep brown-black for headings
          textBody: '#4B3A2A',   // Deep brown for body
          textMuted: '#8C7560',  // Muted brown for secondary labels
        }
      },
      fontFamily: {
        sans: ['Inter', 'Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'brand': '0 8px 24px -4px rgba(249, 115, 22, 0.06), 0 2px 8px -2px rgba(249, 115, 22, 0.04)',
        'brand-hover': '0 16px 32px -4px rgba(249, 115, 22, 0.12), 0 4px 12px -2px rgba(249, 115, 22, 0.06)',
        'orange-glow': '0 0 15px 2px rgba(249, 115, 22, 0.15)',
      },
      borderRadius: {
        'card': '16px',
        'inner': '12px',
      }
    },
  },
  plugins: [],
}
