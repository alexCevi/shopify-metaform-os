import { useState } from "react"
import { EmptyState } from "./empty-state"

export interface Column<T> {
  key: string
  header: string
  render: (item: T) => React.ReactNode
  width?: string
}

export interface ExpandableTableProps<T> {
  columns: Column<T>[]
  data: T[]
  keyExtractor: (item: T) => string
  renderExpandedContent?: (item: T) => React.ReactNode
  emptyMessage?: string
}

export function ExpandableTable<T>({
  columns,
  data,
  keyExtractor,
  renderExpandedContent,
  emptyMessage = "No data available",
}: ExpandableTableProps<T>) {
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const toggleRow = (key: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  if (data.length === 0) {
    return (
      <div style={styles.empty}>
        <EmptyState title={emptyMessage} />
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <table style={styles.table}>
        <thead>
          <tr>
            {renderExpandedContent && <th style={{ ...styles.th, width: "40px" }} />}
            {columns.map((col) => (
              <th key={col.key} style={{ ...styles.th, ...(col.width ? { width: col.width } : {}) }}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const key = keyExtractor(item)
            const isOpen = expandedRows.has(key)
            return (
              <>
                <tr
                  key={key}
                  style={{
                    ...styles.tr,
                    backgroundColor: isOpen ? "#fafafa" : "transparent",
                  }}
                  onClick={() => renderExpandedContent && toggleRow(key)}
                >
                  {renderExpandedContent && (
                    <td style={styles.chevronTd}>
                      <svg
                        width="14"
                        height="14"
                        viewBox="0 0 16 16"
                        fill="none"
                        style={{
                          transition: "transform 0.15s ease",
                          transform: isOpen ? "rotate(90deg)" : "rotate(0deg)",
                          color: "#999",
                        }}
                      >
                        <path d="M6 4L10 8L6 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} style={styles.td}>{col.render(item)}</td>
                  ))}
                </tr>
                {isOpen && renderExpandedContent && (
                  <tr key={`${key}-exp`}>
                    <td colSpan={columns.length + 1} style={styles.expandedTd}>
                      <div style={styles.expandedInner}>{renderExpandedContent(item)}</div>
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
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    backgroundColor: "#fff",
    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
  },
  empty: {
    border: "1px solid #eaeaea",
    borderRadius: "8px",
    backgroundColor: "#fff",
    padding: "48px 24px",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  th: {
    padding: "12px 16px",
    textAlign: "left" as const,
    fontWeight: 500,
    color: "#999",
    fontSize: "12px",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid #eaeaea",
    backgroundColor: "#fafafa",
  },
  tr: {
    borderBottom: "1px solid #eaeaea",
    cursor: "pointer",
    transition: "background-color 0.1s ease",
  },
  td: {
    padding: "16px 16px",
    color: "#333",
    lineHeight: "1.5",
    verticalAlign: "middle" as const,
  },
  chevronTd: {
    padding: "16px 8px 16px 16px",
    width: "40px",
    verticalAlign: "middle" as const,
  },
  expandedTd: {
    padding: 0,
    backgroundColor: "#fafafa",
    borderBottom: "1px solid #eaeaea",
  },
  expandedInner: {
    padding: "24px 16px 24px 56px",
    borderTop: "1px solid #eaeaea",
  },
}
