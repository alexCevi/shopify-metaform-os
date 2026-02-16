import { useState } from "react"
import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"

export interface TextFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  type?: "text" | "password" | "email" | "url"
  error?: string
  helperText?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  autoComplete?: string
}

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  error,
  helperText,
  placeholder,
  disabled,
  required,
  autoComplete,
}: TextFieldProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasError = !!error

  return (
    <div style={styles.container}>
      <label style={styles.label}>
        {label}
        {required && <span style={styles.required}> *</span>}
      </label>
      <div style={styles.inputWrapper}>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          required={required}
          autoComplete={autoComplete}
          aria-invalid={hasError}
          aria-describedby={error ? `${label}-error` : helperText ? `${label}-helper` : undefined}
          style={{
            ...styles.input,
            ...(hasError ? styles.inputError : {}),
            ...(isFocused && !hasError ? styles.inputFocused : {}),
            ...(disabled ? styles.inputDisabled : {}),
          }}
        />
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
  inputWrapper: {
    position: "relative" as const,
    width: "100%",
  },
  input: {
    width: "100%",
    padding: `${spacing.sm} ${spacing.base}`,
    fontSize: typography.fontSize.base,
    lineHeight: typography.lineHeight.normal,
    color: colors.text.primary,
    backgroundColor: colors.bg.surface,
    border: `1px solid ${colors.border.base}`,
    borderRadius: borderRadius.base,
    transition: transitions.fast,
    outline: "none",
  },
  inputFocused: {
    borderColor: colors.interactive.primary,
    boxShadow: `0 0 0 1px ${colors.interactive.primary}`,
  },
  inputError: {
    borderColor: colors.border.critical,
  },
  inputDisabled: {
    backgroundColor: colors.bg.subdued,
    color: colors.text.disabled,
    cursor: "not-allowed",
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
