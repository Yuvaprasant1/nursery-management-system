/**
 * Responsive utility functions and constants
 */

// Breakpoint values matching Tailwind CSS defaults
export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const

export type Breakpoint = keyof typeof BREAKPOINTS

/**
 * Check if current window width is above a breakpoint
 * Note: This is a client-side utility. Use with caution in SSR contexts.
 */
export function isAboveBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth >= BREAKPOINTS[breakpoint]
}

/**
 * Check if current window width is below a breakpoint
 */
export function isBelowBreakpoint(breakpoint: Breakpoint): boolean {
  if (typeof window === 'undefined') return false
  return window.innerWidth < BREAKPOINTS[breakpoint]
}

/**
 * Get current breakpoint category
 */
export function getCurrentBreakpoint(): 'mobile' | 'tablet' | 'desktop' {
  if (typeof window === 'undefined') return 'desktop'
  
  const width = window.innerWidth
  
  if (width < BREAKPOINTS.md) return 'mobile'
  if (width < BREAKPOINTS.lg) return 'tablet'
  return 'desktop'
}

/**
 * Touch target minimum size (44x44px as per WCAG guidelines)
 */
export const TOUCH_TARGET_SIZE = 44

/**
 * Responsive spacing scales
 */
export const SPACING = {
  mobile: {
    xs: '0.5rem',  // 8px
    sm: '0.75rem', // 12px
    md: '1rem',    // 16px
    lg: '1.5rem',  // 24px
    xl: '2rem',    // 32px
  },
  desktop: {
    xs: '0.75rem', // 12px
    sm: '1rem',    // 16px
    md: '1.5rem',  // 24px
    lg: '2rem',    // 32px
    xl: '3rem',    // 48px
  },
} as const
