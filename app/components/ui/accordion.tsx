import * as React from "react"
import * as AccordionPrimitive from "@radix-ui/react-accordion"

const Accordion = AccordionPrimitive.Root

const AccordionItem = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>
>(({ style, ...props }, ref) => (
  <AccordionPrimitive.Item
    ref={ref}
    style={style}
    {...props}
  />
))
AccordionItem.displayName = "AccordionItem"

const AccordionTrigger = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>
>(({ style, children, ...props }, ref) => (
  <AccordionPrimitive.Header style={{ display: "flex" }}>
    <AccordionPrimitive.Trigger
      ref={ref}
      style={{
        display: "flex",
        flex: 1,
        alignItems: "center",
        justifyContent: "space-between",
        fontWeight: 500,
        transition: "all 200ms",
        outline: "none",
        ...style,
      }}
      {...props}
    >
      {children}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        style={{
          flexShrink: 0,
          transition: "transform 200ms",
          color: "var(--s-color-text-secondary, #6d7175)",
        }}
      >
        <path
          d="M5 7.5L10 12.5L15 7.5"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </AccordionPrimitive.Trigger>
  </AccordionPrimitive.Header>
))
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName

const AccordionContent = React.forwardRef<
  React.ElementRef<typeof AccordionPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>
>(({ style, children, ...props }, ref) => (
  <AccordionPrimitive.Content
    ref={ref}
    style={{
      overflow: "hidden",
      fontSize: "14px",
      transition: "all 200ms",
      ...style,
    }}
    {...props}
  >
    <div style={{ paddingBottom: "16px", paddingTop: 0 }}>{children}</div>
  </AccordionPrimitive.Content>
))
AccordionContent.displayName = AccordionPrimitive.Content.displayName

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent }
