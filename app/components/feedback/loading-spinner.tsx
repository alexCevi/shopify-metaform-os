import { colors } from "../../styles/design-tokens"

export interface LoadingSpinnerProps {
  size?: "small" | "medium" | "large"
  color?: string
}

export function LoadingSpinner({ size = "medium", color = colors.interactive.primary }: LoadingSpinnerProps) {
  const sizeMap = {
    small: 16,
    medium: 24,
    large: 32,
  }

  const dimension = sizeMap[size]

  return (
    <svg
      width={dimension}
      height={dimension}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ animation: "spin 1s linear infinite" }}
    >
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="62.8"
        strokeDashoffset="47.1"
        opacity="0.25"
      />
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="62.8"
        strokeDashoffset="47.1"
      />
    </svg>
  )
}
