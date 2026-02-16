import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"

export interface CheckboxProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  helperText?: string
}

export function Checkbox({ label, checked, onChange, disabled, helperText }: CheckboxProps) {
  return (
    <div style={styles.container}>
      <label style={{ ...styles.label, ...(disabled ? styles.labelDisabled : {}) }}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          style={styles.hiddenCheckbox}
        />
        <span
          style={{
            ...styles.customCheckbox,
            ...(checked ? styles.customCheckboxChecked : {}),
            ...(disabled ? styles.customCheckboxDisabled : {}),
          }}
        >
          {checked && (
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 3L4.5 8.5L2 6"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </span>
        <span style={styles.labelText}>{label}</span>
      </label>
      {helperText && <span style={styles.helperText}>{helperText}</span>}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.xs,
  },
  label: {
    display: "flex",
    alignItems: "center",
    gap: spacing.sm,
    cursor: "pointer",
    userSelect: "none" as const,
  },
  labelDisabled: {
    cursor: "not-allowed",
    opacity: 0.6,
  },
  hiddenCheckbox: {
    position: "absolute" as const,
    opacity: 0,
    width: 0,
    height: 0,
  },
  customCheckbox: {
    width: "18px",
    height: "18px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: `2px solid ${colors.border.base}`,
    borderRadius: borderRadius.sm,
    backgroundColor: colors.bg.surface,
    transition: transitions.fast,
    flexShrink: 0,
  },
  customCheckboxChecked: {
    backgroundColor: colors.interactive.primary,
    borderColor: colors.interactive.primary,
  },
  customCheckboxDisabled: {
    backgroundColor: colors.bg.subdued,
    borderColor: colors.border.subdued,
  },
  labelText: {
    fontSize: typography.fontSize.base,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    marginLeft: "26px",
    lineHeight: typography.lineHeight.normal,
  },
}
