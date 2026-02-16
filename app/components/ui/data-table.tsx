import { useState } from "react"
import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"
import { EmptyState } from "./empty-state"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  width?: string
  sortable?: boolean
}

export interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  emptyMessage?: string
  striped?: boolean
  hoverable?: boolean
  expandable?: boolean
  renderExpandedContent?: (item: T) => React.ReactNode
}

export function DataTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = "No data available",
  striped = true,
  hoverable = true,
  expandable = false,
  renderExpandedContent,
}: DataTableProps<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const handleSort = (columnKey: string) => {
    if (sortKey === columnKey) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortKey(columnKey)
      setSortDirection("asc")
    }
  }

  const toggleRowExpansion = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  if (data.length === 0) {
    return (
      <div style={styles.emptyContainer}>
        <EmptyState title={emptyMessage} />
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.headerRow}>
            {expandable && <th style={{ ...styles.headerCell, width: "40px" }} />}
            {columns.map((column) => (
              <th
                key={column.key}
                style={{
                  ...styles.headerCell,
                  ...(column.width ? { width: column.width } : {}),
                  ...(column.sortable ? styles.sortableHeader : {}),
                }}
                onClick={() => column.sortable && handleSort(column.key)}
              >
                <div style={styles.headerContent}>
                  {column.header}
                  {column.sortable && sortKey === column.key && (
                    <span style={styles.sortIcon}>
                      {sortDirection === "asc" ? "↑" : "↓"}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, index) => {
            const itemKey = keyExtractor(item)
            const isExpanded = expandedRows.has(itemKey)
            return (
              <>
                <tr
                  key={itemKey}
                  style={{
                    ...styles.bodyRow,
                    ...(striped && index % 2 === 1 ? styles.stripedRow : {}),
                    ...(hoverable || expandable ? styles.hoverableRow : {}),
                  }}
                  onClick={expandable ? () => toggleRowExpansion(itemKey) : undefined}
                >
                  {expandable && (
                    <td style={{ ...styles.bodyCell, ...styles.expandCell }}>
                      <div
                        style={{
                          ...styles.chevron,
                          transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
                        }}
                      >
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                          <path
                            d="M6 4L10 8L6 12"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </td>
                  )}
                  {columns.map((column) => (
                    <td key={column.key} style={styles.bodyCell}>
                      {column.render(item)}
                    </td>
                  ))}
                </tr>
                {expandable && isExpanded && renderExpandedContent && (
                  <tr key={`${itemKey}-expanded`}>
                    <td colSpan={columns.length + 1} style={styles.expandedCell}>
                      <div style={styles.expandedContent}>{renderExpandedContent(item)}</div>
                    </td>
                  </tr>
                )}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

const styles = {
  container: {
    width: "100%",
    overflowX: "auto" as const,
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.surface,
  },
  emptyContainer: {
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bg.surface,
    padding: spacing.xl,
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: typography.fontSize.base,
  },
  headerRow: {
    backgroundColor: colors.bg.subdued,
    borderBottom: `2px solid ${colors.border.base}`,
  },
  headerCell: {
    padding: `${spacing.base} ${spacing.base}`,
    textAlign: "left" as const,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text.primary,
    fontSize: typography.fontSize.sm,
    lineHeight: typography.lineHeight.normal,
  },
  sortableHeader: {
    cursor: "pointer",
    userSelect: "none" as const,
    transition: transitions.fast,
  },
  headerContent: {
    display: "flex",
    alignItems: "center",
    gap: spacing.xs,
  },
  sortIcon: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  bodyRow: {
    borderBottom: `1px solid ${colors.border.subdued}`,
    transition: transitions.fast,
  },
  stripedRow: {
    backgroundColor: colors.bg.subdued,
  },
  hoverableRow: {
    cursor: "pointer",
  },
  bodyCell: {
    padding: `${spacing.base} ${spacing.base}`,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  expandCell: {
    padding: `${spacing.base} ${spacing.sm}`,
    width: "40px",
  },
  chevron: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: colors.text.secondary,
    transition: "transform 200ms ease",
  },
  expandedCell: {
    padding: 0,
    backgroundColor: colors.bg.subdued,
    borderTop: `1px solid ${colors.border.subdued}`,
  },
  expandedContent: {
    padding: spacing.lg,
    animation: "slideDown 200ms ease",
  },
}
