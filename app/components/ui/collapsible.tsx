import { useState } from "react"

export interface CollapsibleProps {
  defaultOpen?: boolean
  header: React.ReactNode
  children: React.ReactNode
}

export function Collapsible({ defaultOpen = false, header, children }: CollapsibleProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div
      style={{
        border: "1px solid #eaeaea",
        borderRadius: "8px",
        backgroundColor: "#fff",
        overflow: "hidden",
        transition: "box-shadow 0.15s ease",
        boxShadow: isOpen ? "0 4px 14px rgba(0, 0, 0, 0.06)" : "0 2px 4px rgba(0, 0, 0, 0.04)",
      }}
    >
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: "flex",
          alignItems: "center",
          width: "100%",
          padding: "20px 24px",
          border: "none",
          backgroundColor: "transparent",
          cursor: "pointer",
          textAlign: "left",
          fontFamily: "inherit",
          gap: "16px",
          outline: "none",
        }}
      >
        <div style={{ flex: 1 }}>{header}</div>
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          style={{
            flexShrink: 0,
            transition: "transform 0.2s ease",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            color: "#888",
          }}
        >
          <path
            d="M5 7.5L10 12.5L15 7.5"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {isOpen && (
        <div
          style={{
            padding: "0 24px 24px 24px",
            borderTop: "1px solid #eaeaea",
          }}
        >
          <div style={{ paddingTop: "20px" }}>{children}</div>
        </div>
      )}
    </div>
  )
}
