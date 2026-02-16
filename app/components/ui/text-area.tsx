import { useState } from "react"
import { spacing, colors, borderRadius, typography, transitions } from "../../styles/design-tokens"

export interface TextAreaProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  rows?: number
  maxLength?: number
  showCharacterCount?: boolean
}

export function TextArea({
  label,
  value,
  onChange,
  error,
  helperText,
  placeholder,
  disabled,
  required,
  rows = 4,
  maxLength,
  showCharacterCount,
}: TextAreaProps) {
  const [isFocused, setIsFocused] = useState(false)
  const hasError = !!error
  const characterCount = value.length

  return (
    <div style={styles.container}>
      <div style={styles.labelRow}>
        <label style={styles.label}>
          {label}
          {required && <span style={styles.required}> *</span>}
        </label>
        {showCharacterCount && maxLength && (
          <span style={styles.characterCount}>
            {characterCount} / {maxLength}
          </span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        rows={rows}
        maxLength={maxLength}
        aria-invalid={hasError}
        aria-describedby={error ? `${label}-error` : helperText ? `${label}-helper` : undefined}
        style={{
          ...styles.textarea,
          ...(hasError ? styles.textareaError : {}),
          ...(isFocused && !hasError ? styles.textareaFocused : {}),
          ...(disabled ? styles.textareaDisabled : {}),
        }}
      />
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
  labelRow: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
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
  characterCount: {
    fontSize: typography.fontSize.xs,
    color: colors.text.secondary,
  },
  textarea: {
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
    resize: "vertical" as const,
    fontFamily: "inherit",
  },
  textareaFocused: {
    borderColor: colors.interactive.primary,
    boxShadow: `0 0 0 1px ${colors.interactive.primary}`,
  },
  textareaError: {
    borderColor: colors.border.critical,
  },
  textareaDisabled: {
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
