import { spacing, colors, borderRadius, typography, shadows } from "../../styles/design-tokens"
import { Card } from "./card"

export interface StatCardProps {
  label: string
  value: string | number
  icon?: React.ReactNode
  trend?: {
    value: string
    direction: "up" | "down" | "neutral"
  }
  action?: React.ReactNode
}

export function StatCard({ label, value, icon, trend, action }: StatCardProps) {
  return (
    <Card padding="medium" shadow>
      <div style={styles.container}>
        <div style={styles.header}>
          {icon && <div style={styles.icon}>{icon}</div>}
          <span style={styles.label}>{label}</span>
        </div>
        <div style={styles.value}>{value}</div>
        {trend && (
          <div style={styles.trend}>
            <span
              style={{
                ...styles.trendValue,
                color:
                  trend.direction === "up"
                    ? colors.text.success
                    : trend.direction === "down"
                    ? colors.text.critical
                    : colors.text.secondary,
              }}
            >
              {trend.direction === "up" && "↑ "}
              {trend.direction === "down" && "↓ "}
              {trend.value}
            </span>
          </div>
        )}
        {action && <div style={styles.action}>{action}</div>}
      </div>
    </Card>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.sm,
  },
  header: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  },
  icon: {
    display: "flex",
    alignItems: "center",
    color: colors.text.secondary,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    fontWeight: typography.fontWeight.medium,
  },
  value: {
    fontSize: typography.fontSize["2xl"],
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.tight,
  },
  trend: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  },
  trendValue: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  action: {
    marginTop: spacing.xs,
  },
}
