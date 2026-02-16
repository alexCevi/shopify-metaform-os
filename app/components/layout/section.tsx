import { spacing, colors, typography } from "../../styles/design-tokens"

export interface SectionProps {
  title?: string
  description?: string
  children: React.ReactNode
  spacing?: "small" | "medium" | "large"
}

export function Section({ title, description, children, spacing: spacingSize = "large" }: SectionProps) {
  const spacingMap = {
    small: spacing.base,
    medium: spacing.lg,
    large: spacing.xl,
  }

  return (
    <section style={{ marginBottom: spacingMap[spacingSize] }}>
      {(title || description) && (
        <div style={styles.header}>
          {title && <h2 style={styles.title}>{title}</h2>}
          {description && <p style={styles.description}>{description}</p>}
        </div>
      )}
      {children}
    </section>
  )
}

const styles = {
  header: {
    marginBottom: spacing.base,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.tight,
  },
  description: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    margin: 0,
    lineHeight: typography.lineHeight.normal,
  },
}
