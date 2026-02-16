import type { ReactNode } from "react"

const iconSize = 12
const iconStyle: React.CSSProperties = { display: "flex", flexShrink: 0 }

function IconSvg({ children, ...rest }: { children: ReactNode }) {
  return (
    <span style={iconStyle}>
      <svg width={iconSize} height={iconSize} viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" {...rest}>
        {children}
      </svg>
    </span>
  )
}

const typeIcons: Record<string, ReactNode> = {
  // Text
  single_line_text_field: (
    <IconSvg>
      <path d="M2 4h12M2 8h8M2 12h6" />
    </IconSvg>
  ),
  multi_line_text_field: (
    <IconSvg>
      <path d="M2 4h12M2 7h12M2 10h8M2 13h6" />
    </IconSvg>
  ),
  rich_text_field: (
    <IconSvg>
      <rect x="2" y="2" width="12" height="12" rx="1" />
      <path d="M5 6h6M5 9h4M5 12h2" />
    </IconSvg>
  ),
  // Number
  number_integer: (
    <IconSvg>
      <path d="M4 4v8M8 4v8M6 4h4M6 12h4" />
    </IconSvg>
  ),
  number_decimal: (
    <IconSvg>
      <path d="M4 4v8M8 4v8M6 4h4M6 12h4M10 12h2" />
    </IconSvg>
  ),
  // Date
  date: (
    <IconSvg>
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M2 7h12M5 2v3M11 2v3" />
    </IconSvg>
  ),
  date_time: (
    <IconSvg>
      <rect x="2" y="3" width="12" height="11" rx="1" />
      <path d="M2 7h12M5 2v3M11 2v3M6 10h4" />
    </IconSvg>
  ),
  // Boolean
  boolean: (
    <IconSvg>
      <path d="M3 8l2.5 2.5L13 4" />
    </IconSvg>
  ),
  // JSON
  json: (
    <IconSvg>
      <path d="M5 4v8M11 4v8M3 7h2M11 7h2M3 9h2M11 9h2" />
    </IconSvg>
  ),
  // URL / Link
  url: (
    <IconSvg>
      <path d="M6 9l4-4M10 5h2v2M6 7L2 11v2h2l4-4" />
    </IconSvg>
  ),
  link: (
    <IconSvg>
      <path d="M6 9l4-4M10 5h2v2M6 7L2 11v2h2l4-4" />
    </IconSvg>
  ),
  // ID
  id: (
    <IconSvg>
      <path d="M4 4h8v8H4zM6 6v4M10 6v4" />
    </IconSvg>
  ),
  // Money
  money: (
    <IconSvg>
      <path d="M8 2v12M5 5h6a2 2 0 010 4H5a2 2 0 010-4z" />
    </IconSvg>
  ),
  // Color
  color: (
    <IconSvg>
      <circle cx="8" cy="8" r="4" />
    </IconSvg>
  ),
  // Rating
  rating: (
    <IconSvg>
      <path d="M8 2l1.5 3 3 .5-2.5 2.5.5 3L8 9.5 5.5 12l.5-3L3.5 6.5l3-.5L8 2z" />
    </IconSvg>
  ),
  // Dimension
  dimension: (
    <IconSvg>
      <path d="M2 4h12M2 12h12M4 2v4M12 10v4" />
    </IconSvg>
  ),
  // Volume / Weight
  volume: (
    <IconSvg>
      <path d="M4 4h8v8H4zM6 6v4M10 6v4" />
    </IconSvg>
  ),
  weight: (
    <IconSvg>
      <path d="M8 2v4l4 6H4l4-6z" />
    </IconSvg>
  ),
}

const ownerIcons: Record<string, ReactNode> = {
  product: (
    <IconSvg>
      <path d="M2 4h12l-1 8H3L2 4zM2 4l2-2h8l2 2" />
    </IconSvg>
  ),
  collection: (
    <IconSvg>
      <path d="M2 2h6v6H2zM8 2h6v6H8zM2 8h6v6H2zM8 8h6v6H8z" />
    </IconSvg>
  ),
  order: (
    <IconSvg>
      <path d="M2 2h12v2l-1 4H3L2 4V2zM2 8h12v6H2V8z" />
    </IconSvg>
  ),
  customer: (
    <IconSvg>
      <circle cx="8" cy="4" r="2" />
      <path d="M2 14c0-3 2-4 6-4s6 1 6 4" />
    </IconSvg>
  ),
  shop: (
    <IconSvg>
      <path d="M2 6l6-4 6 4v6H2V6z" />
    </IconSvg>
  ),
  company: (
    <IconSvg>
      <path d="M2 14V6h4v8H2zM10 14V4h4v10h-4z" />
    </IconSvg>
  ),
  company_location: (
    <IconSvg>
      <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 6 4 6s4-3 4-6c0-2.2-1.8-4-4-4z" />
    </IconSvg>
  ),
  variant: (
    <IconSvg>
      <path d="M2 4h12v8H2zM5 7h6" />
    </IconSvg>
  ),
  product_variant: (
    <IconSvg>
      <path d="M2 4h12v8H2zM5 7h6" />
    </IconSvg>
  ),
  draft_order: (
    <IconSvg>
      <path d="M2 2h12v2l-1 4H3L2 4V2zM2 8h12v6H2V8z" />
    </IconSvg>
  ),
  market: (
    <IconSvg>
      <path d="M8 2l6 6-6 6-6-6 6-6z" />
    </IconSvg>
  ),
  location: (
    <IconSvg>
      <path d="M8 2C5.8 2 4 3.8 4 6c0 3 4 6 4 6s4-3 4-6c0-2.2-1.8-4-4-4z" />
    </IconSvg>
  ),
  discount: (
    <IconSvg>
      <path d="M8 2l6 6-6 6-6-6 6-6z" />
    </IconSvg>
  ),
  page: (
    <IconSvg>
      <path d="M4 2h6l4 4v8H4V2z" />
    </IconSvg>
  ),
  blog: (
    <IconSvg>
      <path d="M2 4h12M2 8h12M2 12h8" />
    </IconSvg>
  ),
  article: (
    <IconSvg>
      <path d="M4 2h8v12H4V2zM6 6h4M6 9h4" />
    </IconSvg>
  ),
}

const capabilityIcons: Record<string, ReactNode> = {
  publishable: (
    <IconSvg>
      <path d="M8 2v8M5 7l3 3 3-3" />
      <path d="M2 14h12" />
    </IconSvg>
  ),
  translatable: (
    <IconSvg>
      <path d="M4 8h8M6 6l2 4 2-4M4 12h8" />
    </IconSvg>
  ),
  renderable: (
    <IconSvg>
      <rect x="2" y="2" width="12" height="10" rx="1" />
      <path d="M6 6h4M6 9h2" />
    </IconSvg>
  ),
}

const accessIcon = (
  <IconSvg>
    <path d="M4 7V5a4 4 0 118 0v2M3 14h10" />
  </IconSvg>
)

const validationIcon = (
  <IconSvg>
    <path d="M8 2l6 6-6 6-6-6 6-6z" />
  </IconSvg>
)

const requiredIcon = (
  <IconSvg>
    <path d="M8 2v12M2 8h12" />
  </IconSvg>
)

const genericTypeIcon = (
  <IconSvg>
    <path d="M2 2h12v12H2zM5 5h6M5 8h4" />
  </IconSvg>
)

const genericOwnerIcon = (
  <IconSvg>
    <path d="M2 4h12v8H2zM5 7h6" />
  </IconSvg>
)

function toSnakeCase(s: string): string {
  return s
    .replace(/([A-Z])/g, "_$1")
    .toLowerCase()
    .replace(/^_/, "")
}

export function getTypeIcon(type: string): ReactNode {
  const key = type.includes("_") ? type.toLowerCase() : toSnakeCase(type)
  return typeIcons[key] ?? genericTypeIcon
}

export function getOwnerIcon(ownerType: string): ReactNode {
  const key = ownerType.toLowerCase().replace(/_/g, "_")
  return ownerIcons[key] ?? genericOwnerIcon
}

export function getCapabilityIcon(capability: "publishable" | "translatable" | "renderable"): ReactNode {
  return capabilityIcons[capability] ?? genericTypeIcon
}

export function getAccessIcon(): ReactNode {
  return accessIcon
}

export function getValidationIcon(): ReactNode {
  return validationIcon
}

export function getRequiredIcon(): ReactNode {
  return requiredIcon
}
