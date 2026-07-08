export const motion = {
  duration: {
    instant: 100,   // Toggle feedback
    fast: 200,      // Hover effects
    medium: 300,    // Standard modal opens
    slow: 450,      // Page transitions, custom collapses
    xslow: 700      // Number count ups, reveals
  },
  easing: {
    standard: 'cubic-bezier(0.4, 0, 0.2, 1)',
    decelerate: 'cubic-bezier(0, 0, 0.2, 1)', // Entering animations
    accelerate: 'cubic-bezier(0.4, 0, 1, 1)',  // Exiting animations
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)' // Delightful physics bounce
  }
} as const;
