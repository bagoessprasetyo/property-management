import type { Config } from "tailwindcss";

const config: Config = {
    darkMode: ["class"],
    content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
  	extend: {
  		colors: {
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
  			},
  			// Indonesian hospitality color palette
  			'warm-brown': {
  				'50': '#faf8f5',
  				'100': '#f0ebe1',
  				'200': '#e6d4c2',
  				'300': '#d4b896',
  				'400': '#c29968',
  				'500': '#b8834a',
  				'600': '#aa6f3e',
  				'700': '#8d5835',
  				'800': '#724830',
  				'900': '#5d3c29',
  				'950': '#321f15',
  			},
  			'terracotta': {
  				'50': '#fef7f3',
  				'100': '#feede5',
  				'200': '#fcd8cc',
  				'300': '#f9baa8',
  				'400': '#f59174',
  				'500': '#ee6d47',
  				'600': '#dc5228',
  				'700': '#b8401e',
  				'800': '#94361d',
  				'900': '#78301d',
  				'950': '#41160b',
  			},
  			'gold': {
  				'50': '#fffef7',
  				'100': '#fffbeb',
  				'200': '#fff6d3',
  				'300': '#ffecab',
  				'400': '#ffdd78',
  				'500': '#ffc834',
  				'600': '#ffb020',
  				'700': '#cc8b07',
  				'800': '#a16b0d',
  				'900': '#86580f',
  				'950': '#4d3104',
  			}
  		},
  		borderRadius: {
  			lg: 'var(--radius)',
  			md: 'calc(var(--radius) - 2px)',
  			sm: 'calc(var(--radius) - 4px)'
  		},
  		fontFamily: {
  			sans: ['var(--font-geist-sans)', 'system-ui', 'sans-serif'],
  			mono: ['var(--font-geist-mono)', 'Menlo', 'monospace'],
  		},
  		animation: {
  			'fade-in': 'fadeIn 0.5s ease-in-out',
  			'slide-up': 'slideUp 0.3s ease-out',
  			'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
  		},
  		keyframes: {
  			fadeIn: {
  				'0%': { opacity: '0' },
  				'100%': { opacity: '1' },
  			},
  			slideUp: {
  				'0%': { transform: 'translateY(10px)', opacity: '0' },
  				'100%': { transform: 'translateY(0)', opacity: '1' },
  			},
  			pulseSoft: {
  				'0%, 100%': { opacity: '1' },
  				'50%': { opacity: '0.7' },
  			},
  		}
  	}
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
