/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/flowbite/**/*.js",
  ],
  darkMode: ['class', "class"],
  theme: {
  	extend: {
  		fontFamily: {
  			sans: ['Inter', 'system-ui', 'sans-serif'],
  		},
  		fontSize: {
  			'xs': ['0.75rem', { lineHeight: '1rem' }],
  			'sm': ['0.875rem', { lineHeight: '1.25rem' }],
  			'base': ['1rem', { lineHeight: '1.5rem' }],
  			'lg': ['1.125rem', { lineHeight: '1.75rem' }],
  			'xl': ['1.25rem', { lineHeight: '1.75rem' }],
  			'2xl': ['1.5rem', { lineHeight: '2rem' }],
  			'3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  			'4xl': ['2.25rem', { lineHeight: '2.5rem' }],
  			'5xl': ['3rem', { lineHeight: '1' }],
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)',
  			'2xl': '1rem', // 16px - CS2 Style
  			'3xl': '1.5rem', // 24px - CS2 Style
  		},
		colors: {
			// CS2 Skin Tracker - Unified Brand Colors
			brand: {
				// Primary Celadon Palette
				celadon: {
					50: '#F0FDF4',
					100: '#DCFCE7',
					200: '#BBF7D0',
					300: '#86EFAC',
					400: '#A1E8AF',  // Base
					500: '#94C595',  // Medium
					600: '#7FB87F',
					700: '#6A9B6A',
					800: '#557E55',
					900: '#406140',
					DEFAULT: '#A1E8AF',
					dark: '#94C595',
					light: '#86EFAC'
				},
				// Slate Gray Palette
				slate: {
					50: '#F8FAFC',
					100: '#F1F5F9',
					200: '#E2E8F0',
					300: '#CBD5E1',
					400: '#94A3B8',
					500: '#747C92',  // Base
					600: '#64748B',
					700: '#475569',
					800: '#334155',
					900: '#1E293B',
					DEFAULT: '#747C92'
				},
				// Purple Palette
				purple: {
					50: '#FAF5FF',
					100: '#F3E8FF',
					200: '#E9D5FF',
					300: '#D8B4FE',
					400: '#C084FC',
					500: '#3A2449',  // Base
					600: '#9333EA',
					700: '#7C3AED',
					800: '#6B21A8',
					900: '#581C87',
					DEFAULT: '#3A2449'
				},
				// Midnight Blue
				midnight: '#372772',
				
				// Legacy Support
				green: '#94C595',
				'green-dark': '#7FB87F',
				'green-light': '#A1E8AF',
				blue: '#747C92',
				'blue-dark': '#64748B',
				'blue-light': '#94A3B8',
				orange: '#F59E0B',
				'orange-dark': '#D97706',
				'orange-light': '#FBBF24',
			},
  			background: 'hsl(var(--background))',
  			foreground: 'hsl(var(--foreground))',
  			card: {
  				DEFAULT: 'hsl(var(--card))',
  				foreground: 'hsl(var(--card-foreground))'
  			},
  			popover: {
  				DEFAULT: 'hsl(var(--popover))',
  				foreground: 'hsl(var(--popover-foreground))'
  			},
  			primary: {
  				DEFAULT: 'hsl(var(--primary))',
  				foreground: 'hsl(var(--primary-foreground))'
  			},
  			secondary: {
  				DEFAULT: 'hsl(var(--secondary))',
  				foreground: 'hsl(var(--secondary-foreground))'
  			},
  			muted: {
  				DEFAULT: 'hsl(var(--muted))',
  				foreground: 'hsl(var(--muted-foreground))'
  			},
  			accent: {
  				DEFAULT: 'hsl(var(--accent))',
  				foreground: 'hsl(var(--accent-foreground))'
  			},
  			destructive: {
  				DEFAULT: 'hsl(var(--destructive))',
  				foreground: 'hsl(var(--destructive-foreground))'
  			},
  			border: 'hsl(var(--border))',
  			input: 'hsl(var(--input))',
  			ring: 'hsl(var(--ring))',
  			chart: {
  				'1': 'hsl(var(--chart-1))',
  				'2': 'hsl(var(--chart-2))',
  				'3': 'hsl(var(--chart-3))',
  				'4': 'hsl(var(--chart-4))',
  				'5': 'hsl(var(--chart-5))'
  			}
  		}
  	}
  },
  plugins: [require("tailwindcss-animate"), require("flowbite/plugin"), require("@tailwindcss/typography")],
};