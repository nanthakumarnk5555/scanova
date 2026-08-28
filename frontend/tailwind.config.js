/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Medical Platinum & Slate Gray Spectrum (NO Black, NO Blue)
        space: {
          950: '#181C26', // Rich Medical Slate Gray (replaces pitch-black)
          900: '#222836', // Mid Slate Gray Card Surface
          850: '#2B3345', // Elevated Card / Modal / Popover Gray
          800: '#364057', // Interactive Pill Gray
          700: '#4B5878', // Refined Border & Divider Gray
          600: '#64748B', // Cool Muted Gray
          500: '#94A3B8', // Platinum Gray Icon Tint
          400: '#CBD5E1', // Silver Gray
          300: '#E2E8F0', // Light Platinum Gray
          200: '#F1F5F9', // Frost White-Gray
          100: '#F8FAFC', // Pearl White
          50:  '#FFFFFF', // Stark Pure White
        },
        // Solar Core (Warm Radiant Gold & Amber Accents - Zero Blue)
        solar: {
          sun: '#FFFBEB',
          light: '#FEF3C7',
          gold: '#FBBF24',
          amber: '#F59E0B',
          flare: '#FFB800',
          deep: '#D97706',
          dusk: '#B45309',
        },
        // Lumina Blanco (Stark Pure Luminescent Whites & Silvers)
        blanco: {
          pure: '#FFFFFF',
          pearl: '#F8FAFC',
          frost: '#F1F5F9',
          platinum: '#E2E8F0',
          silver: '#CBD5E1',
          slate: '#94A3B8',
          charcoal: '#334155',
        },
        // Clinical Status Semantics
        clinical: {
          mint: '#10B981',   // Concordant / Healthy
          emerald: '#059669',
          coral: '#F43F5E',  // Acute Pathology / Incident
          rose: '#FB7185',
          amber: '#F59E0B',  // Statistical Drift / Watch
          gold: '#FBBF24',
        },
        // Backwards compatibility mappings ensuring zero blue, zero pitch-black
        laser: {
          cyan: '#FFFFFF',    // Shifted to Pure White
          sky: '#FBBF24',     // Shifted to Solar Gold
          blue: '#F59E0B',    // Shifted to Solar Amber
        },
        neural: {
          violet: '#FBBF24',
          purple: '#F59E0B',
          indigo: '#FFFFFF',
        },
        bio: {
          950: '#181C26',
          900: '#222836',
          850: '#2B3345',
          800: '#364057',
          700: '#4B5878',
        }
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', '"Inter"', 'system-ui', 'sans-serif'],
        display: ['"Outfit"', '"Cabinet Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      boxShadow: {
        'glow-white': '0 0 30px rgba(255, 255, 255, 0.45)',
        'glow-solar': '0 0 35px rgba(245, 158, 11, 0.45)',
        'glow-gold': '0 0 30px rgba(251, 191, 36, 0.50)',
        'glow-subtle': '0 0 20px rgba(255, 255, 255, 0.20)',
        'glass-slate': '0 20px 45px -10px rgba(15, 23, 42, 0.50), inset 0 1px 0 rgba(255, 255, 255, 0.25)',
      },
      animation: {
        'scan-beam': 'laser-sweep 2.8s ease-in-out infinite',
        'radar': 'radar-sweep 4s linear infinite',
        'reticle': 'reticle-spin 12s linear infinite',
        'pulse-glow': 'pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'waveform': 'waveform 1.5s ease-in-out infinite',
      },
      keyframes: {
        'laser-sweep': {
          '0%': { transform: 'translateY(-100%)', opacity: '0.9' },
          '50%': { transform: 'translateY(100%)', opacity: '1' },
          '100%': { transform: 'translateY(-100%)', opacity: '0.9' },
        },
        'radar-sweep': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'reticle-spin': {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(0.97)' },
        },
        'waveform': {
          '0%, 100%': { transform: 'scaleY(0.4)' },
          '50%': { transform: 'scaleY(1.0)' },
        }
      }
    },
  },
  plugins: [],
}
