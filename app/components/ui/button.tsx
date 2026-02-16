import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"

export interface ButtonProps {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "tertiary" | "destructive"
  size?: "small" | "medium" | "large"
  disabled?: boolean
  loading?: boolean
  fullWidth?: boolean
  type?: "button" | "submit" | "reset"
  icon?: React.ReactNode
}

export function Button({
  children,
  onClick,
  variant = "primary",
  size = "medium",
  disabled,
  loading,
  fullWidth,
  type = "button",
  icon,
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      data-ui="button"
      data-variant={variant}
      data-size={size}
      className="btn"
      style={{
        ...styles.base,
        ...styles[variant],
        ...styles[`size-${size}`],
        ...(fullWidth ? styles.fullWidth : {}),
        ...(isDisabled ? styles.disabled : {}),
      }}
    >
      {loading && (
        <span style={styles.spinner}>
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={styles.spinnerSvg}
          >
            <circle
              cx="8"
              cy="8"
              r="6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="37.7"
              strokeDashoffset="28.3"
            />
          </svg>
        </span>
      )}
      <span style={loading ? styles.contentHidden : styles.content}>
        {icon && <span style={styles.icon}>{icon}</span>}
        {children}
      </span>
    </button>
  )
}

const styles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.base,
    border: "none",
    cursor: "pointer",
    transition: transitions.fast,
    fontFamily: "inherit",
    lineHeight: typography.lineHeight.normal,
    position: "relative" as const,
    boxSizing: "border-box" as const,
    minHeight: "32px",
  },
  primary: {
    backgroundColor: colors.interactive.primary,
    color: "white",
  },
  secondary: {
    backgroundColor: colors.bg.surface,
    color: colors.text.primary,
    border: `1px solid ${colors.border.base}`,
  },
  tertiary: {
    backgroundColor: "transparent",
    color: colors.interactive.primary,
  },
  destructive: {
    backgroundColor: colors.interactive.critical,
    color: "white",
  },
  "size-small": {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.sm,
  },
  "size-medium": {
    padding: `${spacing.sm} ${spacing.base}`,
    fontSize: typography.fontSize.base,
  },
  "size-large": {
    padding: `${spacing.base} ${spacing.lg}`,
    fontSize: typography.fontSize.lg,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  spinner: {
    position: "absolute" as const,
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  spinnerSvg: {
    animation: "spin 1s linear infinite",
  },
  contentHidden: {
    opacity: 0,
  },
  content: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
}
