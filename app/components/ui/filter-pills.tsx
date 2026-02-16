import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"

export interface FilterPill {
  value: string
  label: string
  count?: number
}

export interface FilterPillsProps {
  options: FilterPill[]
  value: string
  onChange: (value: string) => void
}

export function FilterPills({ options, value, onChange }: FilterPillsProps) {
  return (
    <div style={styles.container}>
      {options.map((option) => {
        const isActive = value === option.value
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            style={{
              ...styles.pill,
              ...(isActive ? styles.pillActive : styles.pillInactive),
            }}
            type="button"
          >
            {option.label}
            {option.count !== undefined && (
              <span
                style={{
                  ...styles.count,
                  ...(isActive ? styles.countActive : styles.countInactive),
                }}
              >
                {option.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexWrap: "wrap" as const,
    gap: spacing.sm,
    alignItems: "center",
  },
  pill: {
    display: "inline-flex",
    alignItems: "center",
    gap: spacing.xs,
    padding: `${spacing.sm} ${spacing.base}`,
    borderRadius: borderRadius.full,
    border: "1.5px solid",
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    fontFamily: "inherit",
    cursor: "pointer",
    transition: transitions.fast,
    lineHeight: typography.lineHeight.tight,
    outline: "none",
    whiteSpace: "nowrap" as const,
  },
  pillActive: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
    color: "white",
    boxShadow: "0 2px 4px rgba(44, 110, 203, 0.2)",
    transform: "translateY(-1px)",
  },
  pillInactive: {
    backgroundColor: colors.bg.surface,
    borderColor: colors.border.base,
    color: colors.text.primary,
  },
  count: {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    minWidth: "20px",
    height: "20px",
    padding: `0 ${spacing.xs}`,
    borderRadius: borderRadius.full,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
    lineHeight: "1",
  },
  countActive: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    color: "white",
  },
  countInactive: {
    backgroundColor: colors.bg.subdued,
    color: colors.text.secondary,
  },
}
