import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "../../packages/ui/src/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ── Base surfaces ───────────────────────────────────────────────
        bg:            '#070710',
        bgDeep:        '#040408',
        surface:       '#0E0E1A',
        surfaceRaised: '#151523',
        surfaceOverlay:'#1C1C2E',
        surfaceHover:  '#1E1E32',

        // ── Borders ──────────────────────────────────────────────────────
        border:        '#1E1E35',
        borderSubtle:  '#141428',
        borderFocus:   '#7C5CFC',
        borderHover:   '#2E2E4A',

        // ── Primary / Brand ──────────────────────────────────────────────
        primary:       '#7C5CFC',
        primaryLight:  '#9D7DFF',
        primaryDark:   '#5B3FD4',
        primaryGlow:   'rgba(124,92,252,0.15)',
        primaryFaint:  'rgba(124,92,252,0.06)',

        // ── Semantic ──────────────────────────────────────────────────────
        success:       '#10D9A0',
        successLight:  '#34EDB8',
        successMuted:  'rgba(16,217,160,0.12)',
        warning:       '#F5A623',
        warningMuted:  'rgba(245,166,35,0.12)',
        danger:        '#F04F54',
        dangerMuted:   'rgba(240,79,84,0.12)',
        info:          '#4F9BFF',
        infoMuted:     'rgba(79,155,255,0.12)',

        // ── Text ──────────────────────────────────────────────────────────
        textPrimary:   '#F0F0FC',
        textSecondary: '#7E7EA0',
        textMuted:     '#3E3E5A',
        textInverse:   '#070710',
        textAccent:    '#9D7DFF',

        // ── Accent palette (Linear/Arc inspired) ──────────────────────────
        violet:  '#8B5CF6',
        indigo:  '#6366F1',
        cyan:    '#06B6D4',
        emerald: '#10B981',
        rose:    '#F43F5E',
        amber:   '#F59E0B',
      },

      fontFamily: {
        display: ['Outfit', 'sans-serif'],
        body:    ['Inter', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },

      fontSize: {
        '2xs': ['10px', { lineHeight: '14px' }],
      },

      borderRadius: {
        sm:   '4px',
        md:   '8px',
        lg:   '12px',
        xl:   '16px',
        '2xl':'20px',
        '3xl':'28px',
      },

      boxShadow: {
        // Elevation
        'xs':  '0 1px 2px rgba(0,0,0,0.4)',
        'sm':  '0 2px 4px rgba(0,0,0,0.5)',
        'md':  '0 4px 12px rgba(0,0,0,0.5)',
        'lg':  '0 8px 24px rgba(0,0,0,0.6)',
        'xl':  '0 16px 48px rgba(0,0,0,0.7)',
        '2xl': '0 24px 64px rgba(0,0,0,0.8)',
        // Colored glows
        'glow':         '0 0 20px rgba(124,92,252,0.25)',
        'glow-sm':      '0 0 10px rgba(124,92,252,0.15)',
        'glow-lg':      '0 0 40px rgba(124,92,252,0.35)',
        'glow-success': '0 0 20px rgba(16,217,160,0.25)',
        'glow-danger':  '0 0 20px rgba(240,79,84,0.25)',
        // Inset
        'inner-sm':     'inset 0 1px 2px rgba(0,0,0,0.4)',
        'inner':        'inset 0 2px 8px rgba(0,0,0,0.5)',
        // Card border highlight
        'card':         '0 0 0 1px rgba(255,255,255,0.04), 0 4px 16px rgba(0,0,0,0.5)',
        'card-hover':   '0 0 0 1px rgba(124,92,252,0.2), 0 8px 32px rgba(0,0,0,0.6)',
      },

      backgroundImage: {
        // Gradient mesh backgrounds
        'mesh-primary':  'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(124,92,252,0.15) 0%, transparent 100%)',
        'mesh-success':  'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(16,217,160,0.12) 0%, transparent 100%)',
        'mesh-danger':   'radial-gradient(ellipse 60% 40% at 50% -10%, rgba(240,79,84,0.12) 0%, transparent 100%)',
        // Card gradients
        'card-violet':   'linear-gradient(135deg, #2D1B69 0%, #1A1030 100%)',
        'card-indigo':   'linear-gradient(135deg, #1E1B4B 0%, #0F0E1A 100%)',
        'card-cyan':     'linear-gradient(135deg, #0C2340 0%, #071018 100%)',
        'card-emerald':  'linear-gradient(135deg, #064E3B 0%, #042520 100%)',
        // Nav active
        'nav-active':    'linear-gradient(90deg, rgba(124,92,252,0.15) 0%, rgba(124,92,252,0.04) 100%)',
      },

      animation: {
        'fade-in':      'fadeIn 0.2s ease-out',
        'fade-up':      'fadeUp 0.3s ease-out',
        'slide-in-r':   'slideInRight 0.25s ease-out',
        'scale-in':     'scaleIn 0.2s ease-out',
        'shimmer':      'shimmer 2s linear infinite',
        'pulse-ring':   'pulseRing 2s cubic-bezier(0.4,0,0.6,1) infinite',
        'spin-slow':    'spin 3s linear infinite',
        'bounce-sm':    'bounceSm 1s ease-in-out infinite',
        'glow-pulse':   'glowPulse 2s ease-in-out infinite',
      },

      keyframes: {
        fadeIn: {
          '0%':   { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeUp: {
          '0%':   { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInRight: {
          '0%':   { opacity: '0', transform: 'translateX(16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        scaleIn: {
          '0%':   { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        pulseRing: {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(124,92,252,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(124,92,252,0)' },
        },
        bounceSm: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%':      { transform: 'translateY(-3px)' },
        },
        glowPulse: {
          '0%, 100%': { boxShadow: '0 0 12px rgba(124,92,252,0.2)' },
          '50%':      { boxShadow: '0 0 24px rgba(124,92,252,0.4)' },
        },
      },

      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
    },
  },
  plugins: [],
};

export default config;
