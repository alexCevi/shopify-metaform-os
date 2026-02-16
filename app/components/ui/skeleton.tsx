import { borderRadius, colors } from "../../styles/design-tokens"

export interface SkeletonProps {
  height?: string
  width?: string
  borderRadius?: string
}

export function Skeleton({ height = "20px", width = "100%", borderRadius: radius = "4px" }: SkeletonProps) {
  return (
    <div
      style={{
        height,
        width,
        borderRadius: radius,
        background: `linear-gradient(90deg, ${colors.bg.subdued} 0px, ${colors.bg.hover} 40px, ${colors.bg.subdued} 80px)`,
        backgroundSize: "600px",
        animation: "shimmer 1.5s infinite",
      }}
    />
  )
}

export function SkeletonText({ lines = 1, width = "100%" }: { lines?: number; width?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "8px", width }}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="16px" width={i === lines - 1 ? "80%" : "100%"} />
      ))}
    </div>
  )
}
