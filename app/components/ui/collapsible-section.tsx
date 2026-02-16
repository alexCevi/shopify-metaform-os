import { useState } from "react"
import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"
import { Card } from "./card"

export interface CollapsibleSectionProps {
  title: string
  description?: string
  defaultExpanded?: boolean
  summaryContent?: React.ReactNode
  children: React.ReactNode
  showBorder?: boolean
}

export function CollapsibleSection({
  title,
  description,
  defaultExpanded = false,
  summaryContent,
  children,
  showBorder = true,
}: CollapsibleSectionProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)

  return (
    <div style={{ marginBottom: spacing.xl }}>
      <div
        style={{
          ...styles.header,
          cursor: "pointer",
          ...(showBorder ? styles.headerBorder : {}),
        }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div style={styles.headerContent}>
          <div style={{ flex: 1 }}>
            <h2 style={styles.title}>{title}</h2>
            {description && !isExpanded && (
              <p style={styles.description}>{description}</p>
            )}
            {summaryContent && !isExpanded && (
              <div style={styles.summary}>{summaryContent}</div>
            )}
          </div>
          <div
            style={{
              ...styles.chevron,
              transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M5 7.5L10 12.5L15 7.5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </div>
        </div>
      </div>
      {isExpanded && <div style={styles.content}>{children}</div>}
    </div>
  )
}

const styles = {
  header: {
    padding: `${spacing.base} 0`,
    userSelect: "none" as const,
    transition: transitions.base,
  },
  headerBorder: {
    paddingBottom: spacing.base,
  },
  headerContent: {
    display: "flex",
    alignItems: "flex-start",
    gap: spacing.base,
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
  summary: {
    marginTop: spacing.sm,
  },
  chevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.text.secondary,
    transition: transitions.base,
    flexShrink: 0,
  },
  content: {
    marginTop: spacing.base,
    animation: "slideDown 200ms ease",
  },
}
