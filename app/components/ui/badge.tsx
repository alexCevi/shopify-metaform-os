import { spacing, colors, borderRadius, typography } from "../../styles/design-tokens"

export interface BadgeProps {
  children: React.ReactNode
  tone?: "success" | "warning" | "critical" | "info" | "neutral"
  size?: "small" | "medium" | "large"
  icon?: React.ReactNode
  variant?: "default" | "outline" | "muted"
}

export function Badge({ children, tone = "neutral", size = "medium", icon, variant = "default" }: BadgeProps) {
  const variantStyles = variant === "outline" ? styles.outline : variant === "muted" ? styles.muted : styles[tone]
  const sizeStyle = variant === "muted" ? styles["size-muted"] : styles[`size-${size}` as keyof typeof styles]
  return (
    <span style={{ ...styles.base, ...variantStyles, ...sizeStyle }}>
      {icon && <span style={styles.icon}>{icon}</span>}
      {children}
    </span>
  )
}

const styles = {
  base: {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing.xs,
    fontWeight: typography.fontWeight.medium,
    borderRadius: borderRadius.base,
    lineHeight: typography.lineHeight.tight,
    whiteSpace: "nowrap" as const,
  },
  "size-small": {
    padding: `2px ${spacing.xs}`,
    fontSize: "11px",
  },
  "size-muted": {
    padding: `1px 6px`,
    fontSize: "11px",
  },
  "size-medium": {
    padding: `${spacing.xs} ${spacing.sm}`,
    fontSize: typography.fontSize.xs,
  },
  "size-large": {
    padding: `${spacing.sm} ${spacing.base}`,
    fontSize: typography.fontSize.sm,
  },
  icon: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  success: {
    backgroundColor: colors.bg.success,
    color: colors.text.success,
  },
  warning: {
    backgroundColor: colors.bg.warning,
    color: colors.text.warning,
  },
  critical: {
    backgroundColor: colors.bg.critical,
    color: colors.text.critical,
  },
  info: {
    backgroundColor: colors.bg.info,
    color: colors.text.info,
  },
  neutral: {
    backgroundColor: colors.bg.subdued,
    color: colors.text.secondary,
  },
  outline: {
    backgroundColor: "#fff",
    border: "1px solid #eaeaea",
    color: "#666",
  },
  muted: {
    backgroundColor: "#f5f5f5",
    border: "1px solid #ebebeb",
    color: "#888",
  },
}
