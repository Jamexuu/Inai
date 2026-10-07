/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: '#FAF7F2',
          dark: '#181715',
        },
        surface: {
          DEFAULT: '#F2ECE4',
          dark: '#252320',
        },
        card: {
          DEFAULT: '#FFFFFF',
          dark: '#2E2A26',
        },
        'card-selected': {
          DEFAULT: '#E8DFD5',
          dark: '#3E3833',
        },
        'subtle-border': {
          DEFAULT: '#E5DED4',
          dark: '#3F3A35',
        },
        charcoal: {
          DEFAULT: '#282522',
          dark: '#FAF7F2',
        },
        umber: {
          DEFAULT: '#6B645D',
          dark: '#C5BFB7',
        },
        'muted-gray': {
          DEFAULT: '#8E867E',
          dark: '#969088',
        },
        sage: {
          DEFAULT: '#3D5A50',
          tint: '#E9F0EC',
          dark: '#6FA18F',
          'dark-tint': '#23332C',
        },
        terracotta: {
          DEFAULT: '#C46849',
          tint: '#FAECE6',
          dark: '#E08569',
          'dark-tint': '#3D251C',
        },
        herbal: {
          DEFAULT: '#2E684D',
          tint: '#E6F2EB',
          dark: '#62B88F',
          'dark-tint': '#1B3327',
        },
        amber: {
          DEFAULT: '#A8631E',
          tint: '#FAF0E3',
          dark: '#DCA15C',
          'dark-tint': '#362816',
        },
        brick: {
          DEFAULT: '#A33B32',
          tint: '#FAECEB',
          dark: '#E87067',
          'dark-tint': '#381C1A',
        },
      },
    },
  },
  plugins: [],
};

