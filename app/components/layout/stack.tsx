import { spacing } from "../../styles/design-tokens"

export interface StackProps {
  children: React.ReactNode
  direction?: "horizontal" | "vertical"
  gap?: "none" | "xs" | "sm" | "base" | "md" | "lg" | "xl"
  align?: "start" | "center" | "end" | "stretch"
  justify?: "start" | "center" | "end" | "space-between" | "space-around"
  wrap?: boolean
}

export function Stack({
  children,
  direction = "vertical",
  gap = "base",
  align = "stretch",
  justify = "start",
  wrap = false,
}: StackProps) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: direction === "vertical" ? "column" : "row",
        gap: spacing[gap],
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap ? "wrap" : "nowrap",
      }}
    >
      {children}
    </div>
  )
}
