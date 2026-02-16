import { spacing, colors, borderRadius, shadows } from "../../styles/design-tokens"

export interface CardProps {
  children: React.ReactNode
  padding?: "none" | "small" | "medium" | "large"
  shadow?: boolean
}

export function Card({ children, padding = "medium", shadow = true }: CardProps) {
  return (
    <div
      style={{
        ...styles.card,
        ...styles[`padding-${padding}`],
        ...(shadow ? styles.shadow : {}),
      }}
    >
      {children}
    </div>
  )
}

const styles = {
  card: {
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.lg,
  },
  "padding-none": {
    padding: 0,
  },
  "padding-small": {
    padding: spacing.base,
  },
  "padding-medium": {
    padding: spacing.lg,
  },
  "padding-large": {
    padding: spacing.xl,
  },
  shadow: {
    boxShadow: shadows.sm,
  },
}
