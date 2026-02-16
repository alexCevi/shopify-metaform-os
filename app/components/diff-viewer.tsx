import { useState } from "react"
import { Stack, Badge, Card } from "./index"
import { spacing, colors, borderRadius, typography } from "../styles/design-tokens"
import type { SnapshotDiff } from "../types/definitions"
import { isMetafieldDef, isMetaobjectDef } from "../types/definitions"
import type { MetafieldDefRecord, MetaobjectDefRecord } from "../types/definitions"

export interface DiffViewerProps {
  diff: SnapshotDiff
  showDeletions?: boolean
  collapsible?: boolean
}

export function DiffViewer({ diff, showDeletions = true, collapsible = true }: DiffViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    added: false,
    modified: false,
    removed: false,
  })

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }))
  }

  const hasAdded = diff.added.length > 0
  const hasModified = diff.modified.length > 0
  const hasRemoved = diff.removed.length > 0

  if (!hasAdded && !hasModified && !hasRemoved) {
    return (
      <Card padding="large">
        <div style={styles.emptyState}>
          <span style={styles.emptyIcon}>✓</span>
          <h3 style={styles.emptyTitle}>Everything is up to date</h3>
          <p style={styles.emptyDescription}>No changes detected between local and remote definitions.</p>
        </div>
      </Card>
    )
  }

  return (
    <Stack direction="vertical" gap="base">
      {hasAdded && (
        <DiffSection
          title="Added"
          count={diff.added.length}
          tone="success"
          expanded={expandedSections.added}
          onToggle={() => toggleSection("added")}
          collapsible={collapsible}
        >
          <Stack direction="vertical" gap="sm">
            {diff.added.map((entry) => (
              <DiffItem key={entry.key} entry={entry} type="added" />
            ))}
          </Stack>
        </DiffSection>
      )}

      {hasModified && (
        <DiffSection
          title="Modified"
          count={diff.modified.length}
          tone="warning"
          expanded={expandedSections.modified}
          onToggle={() => toggleSection("modified")}
          collapsible={collapsible}
        >
          <Stack direction="vertical" gap="sm">
            {diff.modified.map((entry) => (
              <DiffItem key={entry.key} entry={entry} type="modified" />
            ))}
          </Stack>
        </DiffSection>
      )}

      {showDeletions && hasRemoved && (
        <DiffSection
          title="Removed"
          count={diff.removed.length}
          tone="critical"
          expanded={expandedSections.removed}
          onToggle={() => toggleSection("removed")}
          collapsible={collapsible}
        >
          <Stack direction="vertical" gap="sm">
            {diff.removed.map((entry) => (
              <DiffItem key={entry.key} entry={entry} type="removed" />
            ))}
          </Stack>
        </DiffSection>
      )}
    </Stack>
  )
}

interface DiffSectionProps {
  title: string
  count: number
  tone: "success" | "warning" | "critical"
  expanded: boolean
  onToggle: () => void
  collapsible: boolean
  children: React.ReactNode
}

function DiffSection({ title, count, tone, expanded, onToggle, collapsible, children }: DiffSectionProps) {
  return (
    <Card padding="none">
      <div
        style={{
          ...styles.sectionHeader,
          cursor: collapsible ? "pointer" : "default",
        }}
        onClick={collapsible ? onToggle : undefined}
      >
        <Stack direction="horizontal" gap="base" align="center">
          <Badge tone={tone}>
            {count} {title}
          </Badge>
          {collapsible && (
            <span style={styles.toggleIcon}>{expanded ? "▼" : "▶"}</span>
          )}
        </Stack>
      </div>
      {(!collapsible || expanded) && <div style={styles.sectionContent}>{children}</div>}
    </Card>
  )
}

interface DiffItemProps {
  entry: { key: string; source: any }
  type: "added" | "modified" | "removed"
}

function DiffItem({ entry, type }: DiffItemProps) {
  const isMetafield = isMetafieldDef(entry.source)
  const isMetaobject = isMetaobjectDef(entry.source)

  const iconMap = {
    added: "+",
    modified: "~",
    removed: "-",
  }

  const colorMap = {
    added: colors.text.success,
    modified: colors.text.warning,
    removed: colors.text.critical,
  }

  return (
    <div style={styles.item}>
      <Stack direction="horizontal" gap="base" align="start">
        <span
          style={{
            ...styles.icon,
            color: colorMap[type],
          }}
        >
          {iconMap[type]}
        </span>
        <div style={{ flex: 1 }}>
          {isMetafield && <MetafieldItem def={entry.source as MetafieldDefRecord} />}
          {isMetaobject && <MetaobjectItem def={entry.source as MetaobjectDefRecord} />}
        </div>
      </Stack>
    </div>
  )
}

function MetafieldItem({ def }: { def: MetafieldDefRecord }) {
  return (
    <Stack direction="vertical" gap="xs">
      <div style={styles.itemTitle}>{def.name}</div>
      <div style={styles.itemMeta}>
        <code style={styles.code}>
          {def.namespace}.{def.key}
        </code>
        <span style={styles.separator}>•</span>
        <Badge tone="neutral">{formatOwnerType(def.ownerType)}</Badge>
        <span style={styles.separator}>•</span>
        <span style={styles.type}>{formatType(def.type)}</span>
      </div>
      {def.description && <div style={styles.description}>{def.description}</div>}
    </Stack>
  )
}

function MetaobjectItem({ def }: { def: MetaobjectDefRecord }) {
  return (
    <Stack direction="vertical" gap="xs">
      <div style={styles.itemTitle}>{def.name}</div>
      <div style={styles.itemMeta}>
        <code style={styles.code}>{def.type}</code>
        <span style={styles.separator}>•</span>
        <span style={styles.type}>{def.fieldDefinitions.length} fields</span>
      </div>
      {def.description && <div style={styles.description}>{def.description}</div>}
    </Stack>
  )
}

function formatOwnerType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function formatType(type: string) {
  return type
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

const styles = {
  sectionHeader: {
    padding: spacing.base,
    borderBottom: `1px solid ${colors.border.subdued}`,
    userSelect: "none" as const,
  },
  toggleIcon: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginLeft: "auto",
  },
  sectionContent: {
    padding: spacing.base,
  },
  item: {
    padding: spacing.sm,
    backgroundColor: colors.bg.subdued,
    borderRadius: borderRadius.base,
    border: `1px solid ${colors.border.subdued}`,
  },
  icon: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    width: "24px",
    textAlign: "center" as const,
    flexShrink: 0,
  },
  itemTitle: {
    fontSize: typography.fontSize.base,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
  },
  itemMeta: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
  },
  code: {
    fontFamily: "monospace",
    fontSize: typography.fontSize.xs,
    backgroundColor: colors.bg.surface,
    padding: "2px 4px",
    borderRadius: borderRadius.sm,
    border: `1px solid ${colors.border.base}`,
  },
  separator: {
    color: colors.text.disabled,
  },
  type: {
    fontSize: typography.fontSize.sm,
  },
  description: {
    fontSize: typography.fontSize.sm,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
  emptyState: {
    textAlign: "center" as const,
    padding: `${spacing.xl} ${spacing.base}`,
  },
  emptyIcon: {
    display: "block",
    fontSize: "48px",
    color: colors.text.success,
    marginBottom: spacing.base,
  },
  emptyTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    margin: 0,
    marginBottom: spacing.xs,
  },
  emptyDescription: {
    fontSize: typography.fontSize.base,
    color: colors.text.secondary,
    margin: 0,
  },
}
