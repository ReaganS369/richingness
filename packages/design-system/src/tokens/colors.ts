export const colors = {
  // Backgrounds
  bg: '#08080F',             // Midnight primary background
  surface: '#111118',        // Secondary card background
  surfaceRaised: '#191924',  // Elevated panels, sheets
  surfaceOverlay: '#21212E', // Dropdowns and tooltip layers

  // Borders
  border: '#252535',
  borderSubtle: '#1A1A28',
  borderFocus: '#7C5CFC',

  // Brand - Rich Violet
  primary: '#7C5CFC',
  primaryLight: '#A78BFA',
  primaryDark: '#5B3FD4',
  primaryGlow: 'rgba(124, 92, 252, 0.15)',
  primaryGlowLg: 'rgba(124, 92, 252, 0.08)',

  // Semantic Status
  success: '#22D3A5',       // Growth, positive balances
  successMuted: 'rgba(34, 211, 165, 0.12)',
  warning: '#F59E0B',       // Upcoming, notifications
  warningMuted: 'rgba(245, 158, 11, 0.12)',
  danger: '#EF4444',        // Overspent, overdue bills
  dangerMuted: 'rgba(239, 68, 68, 0.12)',
  info: '#3B82F6',          // Informational alerts
  infoMuted: 'rgba(59, 130, 246, 0.12)',

  // Text
  textPrimary: '#EDEDF8',
  textSecondary: '#8B8BA7',
  textMuted: '#4A4A60',
  textInverse: '#08080F',

  // Category palette placeholders
  categoryAccents: [
    '#7C5CFC', '#22D3A5', '#F59E0B', '#EF4444', '#3B82F6',
    '#EC4899', '#8B5CF6', '#06B6D4', '#F97316', '#84CC16'
  ]
} as const;
