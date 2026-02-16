import { spacing, colors, typography } from "../../styles/design-tokens"

export interface EmptyStateProps {
  icon?: React.ReactNode
  title: string
  description?: string
  action?: React.ReactNode
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div style={styles.container}>
      {icon && <div style={styles.iconWrapper}>{icon}</div>}
      <h3 style={styles.title}>{title}</h3>
      {description && <p style={styles.description}>{description}</p>}
      {action && <div style={styles.action}>{action}</div>}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    textAlign: "center" as const,
    padding: `${spacing.xl} ${spacing.lg}`,
    gap: spacing.base,
  },
  iconWrapper: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.text.secondary,
  },
  title: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    maxWidth: "400px",
    margin: 0,
    lineHeight: typography.lineHeight.relaxed,
  },
  action: {
    marginTop: spacing.sm,
  },
}
