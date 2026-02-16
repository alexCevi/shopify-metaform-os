import { useRef, useState, useEffect, useCallback } from "react"

export interface TabsTrigger {
  value: string
  label: React.ReactNode
}

export interface TabsProps {
  value: string
  onValueChange: (value: string) => void
  triggers: TabsTrigger[]
}

export function Tabs({ value, onValueChange, triggers }: TabsProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

  const activeIndex = triggers.findIndex((t) => t.value === value)

  const updateIndicator = useCallback(() => {
    const container = containerRef.current
    if (!container) return
    const buttons = container.querySelectorAll<HTMLButtonElement>("[data-tab-trigger]")
    const activeButton = buttons[activeIndex]
    if (activeButton) {
      setIndicatorStyle({
        left: activeButton.offsetLeft,
        width: activeButton.offsetWidth,
      })
    }
  }, [activeIndex])

  useEffect(() => {
    updateIndicator()
    const raf = requestAnimationFrame(() => updateIndicator())
    return () => cancelAnimationFrame(raf)
  }, [value, activeIndex, triggers.length, updateIndicator])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const observer = new ResizeObserver(() => updateIndicator())
    observer.observe(container)
    return () => observer.disconnect()
  }, [updateIndicator])

  return (
    <div ref={containerRef} style={styles.container}>
      <div role="tablist" style={styles.tabList}>
        {triggers.map((trigger, index) => (
          <button
            key={trigger.value}
            type="button"
            role="tab"
            aria-selected={value === trigger.value}
            data-tab-trigger
            onClick={() => onValueChange(trigger.value)}
            style={{
              ...styles.trigger,
              ...(value === trigger.value ? styles.triggerActive : {}),
            }}
          >
            {trigger.label}
          </button>
        ))}
      </div>
      <div
        role="presentation"
        style={{
          ...styles.indicator,
          left: indicatorStyle.left,
          width: indicatorStyle.width,
        }}
      />
    </div>
  )
}

const styles = {
  container: {
    position: "relative" as const,
    borderBottom: "1px solid #eaeaea",
  },
  tabList: {
    display: "flex",
    gap: 0,
  },
  trigger: {
    padding: "12px 20px",
    border: "none",
    borderBottom: "2px solid transparent",
    backgroundColor: "transparent",
    fontSize: "14px",
    fontWeight: 500,
    fontFamily: "inherit",
    color: "#666",
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    transition: "color 0.15s ease",
    outline: "none",
    marginBottom: "-1px",
  },
  triggerActive: {
    color: "#111",
  },
  indicator: {
    position: "absolute" as const,
    bottom: 0,
    height: "2px",
    backgroundColor: "#111",
    transition: "left 0.2s ease, width 0.2s ease",
    pointerEvents: "none" as const,
  },
}
