// Design tokens for consistent styling across the app
// Based on Polaris design system

export const spacing = {
  none: '0',
  xs: '4px',
  sm: '8px',
  base: '16px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '40px',
  '3xl': '48px',
} as const

export const colors = {
  // Using Polaris CSS variables for theme compatibility
  text: {
    primary: 'var(--s-color-text, #202223)',
    secondary: 'var(--s-color-text-secondary, #6d7175)',
    disabled: 'var(--s-color-text-disabled, #8c9196)',
    critical: 'var(--s-color-text-critical, #d82c0d)',
    success: 'var(--s-color-text-success, #008060)',
    warning: 'var(--s-color-text-warning, #916a00)',
    info: 'var(--s-color-text-info, #0f6cbd)',
  },
  bg: {
    surface: 'var(--s-color-bg-surface, #fff)',
    subdued: 'var(--s-color-bg-surface-subdued, #fafbfb)',
    hover: 'var(--s-color-bg-surface-hover, #f6f6f7)',
    active: 'var(--s-color-bg-surface-active, #f1f2f3)',
    critical: 'var(--s-color-bg-critical, #fed3d1)',
    success: 'var(--s-color-bg-success, #aee9d1)',
    warning: 'var(--s-color-bg-warning, #ffd79d)',
    info: 'var(--s-color-bg-info, #b4e0fa)',
  },
  border: {
    base: 'var(--s-color-border, #c9cccf)',
    subdued: 'var(--s-color-border-subdued, #e1e3e5)',
    hover: 'var(--s-color-border-hover, #adadad)',
    critical: 'var(--s-color-border-critical, #fd5749)',
    success: 'var(--s-color-border-success, #00a47c)',
  },
  interactive: {
    primary: 'var(--s-color-interactive, #2c6ecb)',
    primaryHover: 'var(--s-color-interactive-hover, #1f5199)',
    critical: '#d82c0d',
    criticalHover: '#bf2200',
  },
} as const

export const typography = {
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    md: '14px',
    lg: '16px',
    xl: '20px',
    '2xl': '24px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
  lineHeight: {
    tight: '1.25',
    normal: '1.5',
    relaxed: '1.75',
  },
} as const

export const borderRadius = {
  none: '0',
  sm: '4px',
  base: '8px',
  md: '8px',
  lg: '12px',
  xl: '16px',
  full: '9999px',
} as const

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
} as const

export const transitions = {
  fast: '100ms ease',
  base: '200ms ease',
  slow: '300ms ease',
} as const

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
} as const
