import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"

export interface SelectOption {
  value: string
  label: string
  disabled?: boolean
}

export interface SelectProps {
  label: string
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  error?: string
  helperText?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
}

export function Select({
  label,
  value,
  onChange,
  options,
  error,
  helperText,
  placeholder,
  disabled,
  required,
}: SelectProps) {
  const hasError = !!error

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      <div style={styles.selectWrapper}>
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          required={required}
          aria-invalid={hasError}
          aria-describedby={error ? `${label}-error` : helperText ? `${label}-helper` : undefined}
          style={{
            ...styles.select,
            ...(hasError ? styles.selectError : {}),
            ...(disabled ? styles.selectDisabled : {}),
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} disabled={option.disabled}>
              {option.label}
            </option>
          ))}
        </select>
        <svg
          style={styles.icon}
          width="16"
          height="16"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M4 6L8 10L12 6"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
      {error && (
        <span id={`${label}-error`} style={styles.errorText}>
          {error}
        </span>
      )}
      {helperText && !error && (
        <span id={`${label}-helper`} style={styles.helperText}>
          {helperText}
        </span>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column" as const,
    gap: spacing.xs,
    width: "100%",
  },
  label: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: colors.text.primary,
    lineHeight: typography.lineHeight.normal,
  },
  required: {
    color: colors.text.critical,
  },
  selectWrapper: {
    position: "relative" as const,
    width: "100%",
  },
  select: {
    width: "100%",
    padding: `${spacing.sm} ${spacing.xl} ${spacing.sm} ${spacing.base}`,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.base,
    transition: transitions.fast,
    outline: "none",
    appearance: "none" as const,
    cursor: "pointer",
  },
  selectError: {
    borderColor: colors.border.critical,
  },
  selectDisabled: {
    backgroundColor: colors.bg.subdued,
    color: colors.text.disabled,
    cursor: "not-allowed",
  },
  icon: {
    position: "absolute" as const,
    right: spacing.base,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none" as const,
    color: colors.text.secondary,
  },
  errorText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.critical,
    lineHeight: typography.lineHeight.normal,
  },
  helperText: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
    lineHeight: typography.lineHeight.normal,
  },
}
