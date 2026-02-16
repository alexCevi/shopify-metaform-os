import { Badge } from "../components"
import type { Column } from "../components/ui/expandable-table"
import type { MetafieldDefRecord, MetaobjectDefRecord } from "../types/definitions"
import {
  getTypeIcon,
  getOwnerIcon,
  getCapabilityIcon,
  getAccessIcon,
  getValidationIcon,
  getRequiredIcon,
} from "./type-icons"

export function formatOwnerType(type: string) {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

export function formatType(type: string) {
  return type.replace(/_/g, " ").toLowerCase().replace(/\b\w/g, (c) => c.toUpperCase())
}

const codeStyle: React.CSSProperties = {
  fontSize: "12px",
  backgroundColor: "#f5f5f5",
  padding: "4px 8px",
  borderRadius: "4px",
  fontFamily: "monospace",
  color: "#333",
}

const detailLabel: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  color: "#999",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
  marginBottom: "8px",
}

const fieldCard: React.CSSProperties = {
  padding: "12px 16px",
  backgroundColor: "#fff",
  borderRadius: "6px",
  border: "1px solid #eaeaea",
}

export const metafieldColumns: Column<MetafieldDefRecord>[] = [
  {
    key: "name",
    header: "Name",
    width: "35%",
    render: (def) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111" }}>{def.name}</div>
        {def.description && (
          <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>{def.description}</div>
        )}
      </div>
    ),
  },
  {
    key: "namespace",
    header: "Namespace / Key",
    width: "30%",
    render: (def) => (
      <code style={codeStyle}>
        {def.namespace}.{def.key}
      </code>
    ),
  },
  {
    key: "type",
    header: "Type",
    width: "20%",
    render: (def) => (
      <Badge variant="outline" size="small" icon={getTypeIcon(def.type)}>
        {formatType(def.type)}
      </Badge>
    ),
  },
  {
    key: "ownerType",
    header: "Owner",
    width: "15%",
    render: (def) => (
      <Badge variant="outline" size="small" icon={getOwnerIcon(def.ownerType)}>
        {formatOwnerType(def.ownerType)}
      </Badge>
    ),
  },
]

export const metaobjectColumns: Column<MetaobjectDefRecord>[] = [
  {
    key: "name",
    header: "Name",
    width: "35%",
    render: (def) => (
      <div>
        <div style={{ fontWeight: 600, fontSize: "14px", color: "#111" }}>{def.name}</div>
        {def.description && (
          <div style={{ fontSize: "12px", color: "#999", marginTop: "2px" }}>{def.description}</div>
        )}
      </div>
    ),
  },
  {
    key: "type",
    header: "Type",
    width: "25%",
    render: (def) => <code style={codeStyle}>{def.type}</code>,
  },
  {
    key: "fields",
    header: "Fields",
    width: "15%",
    render: (def) => (
      <span style={{ fontSize: "13px", color: "#666" }}>{def.fieldDefinitions.length} fields</span>
    ),
  },
  {
    key: "capabilities",
    header: "Capabilities",
    width: "25%",
    render: (def) => (
      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
        {def.capabilities.publishable && (
          <Badge variant="outline" size="small" icon={getCapabilityIcon("publishable")}>
            Publishable
          </Badge>
        )}
        {def.capabilities.translatable && (
          <Badge variant="outline" size="small" icon={getCapabilityIcon("translatable")}>
            Translatable
          </Badge>
        )}
        {def.capabilities.renderable && (
          <Badge variant="outline" size="small" icon={getCapabilityIcon("renderable")}>
            Renderable
          </Badge>
        )}
        {!def.capabilities.publishable &&
          !def.capabilities.translatable &&
          !def.capabilities.renderable && (
            <span style={{ fontSize: "12px", color: "#999" }}>None</span>
          )}
      </div>
    ),
  },
]

export function renderMetafieldExpanded(def: MetafieldDefRecord) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div style={detailLabel}>ACCESS</div>
        <div style={{ display: "flex", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#333" }}>
            Admin:{" "}
            <Badge variant="muted" icon={getAccessIcon()}>
              {def.access.admin}
            </Badge>
          </span>
          <span style={{ fontSize: "13px", color: "#333" }}>
            Storefront:{" "}
            <Badge variant="muted" icon={getAccessIcon()}>
              {def.access.storefront}
            </Badge>
          </span>
        </div>
      </div>
      {def.validations && def.validations.length > 0 && (
        <div>
          <div style={detailLabel}>VALIDATIONS</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {def.validations.map((v: { name: string; value?: string }, i: number) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Badge variant="muted" icon={getValidationIcon()}>
                  {v.name}
                </Badge>
                {v.value && <code style={codeStyle}>{JSON.stringify(v.value)}</code>}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export function renderMetaobjectExpanded(def: MetaobjectDefRecord) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <div style={detailLabel}>FIELDS ({def.fieldDefinitions.length})</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {def.fieldDefinitions.map((field: {
            key: string
            name: string
            type: string
            description?: string | null
            required: boolean
          }) => (
            <div key={field.key} style={fieldCard}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "13px", color: "#111" }}>{field.name}</div>
                  <code style={{ fontSize: "11px", color: "#999" }}>{field.key}</code>
                </div>
                <div style={{ display: "flex", gap: "4px" }}>
                  <Badge variant="muted" icon={getTypeIcon(field.type)}>
                    {formatType(field.type)}
                  </Badge>
                  {field.required && (
                    <Badge variant="muted" icon={getRequiredIcon()}>
                      Required
                    </Badge>
                  )}
                </div>
              </div>
              {field.description && (
                <div style={{ fontSize: "12px", color: "#999", marginTop: "6px" }}>
                  {field.description}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <div>
        <div style={detailLabel}>ACCESS & CAPABILITIES</div>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
          <span style={{ fontSize: "13px", color: "#333" }}>
            Admin:{" "}
            <Badge variant="muted" icon={getAccessIcon()}>
              {def.access.admin}
            </Badge>
          </span>
          <span style={{ fontSize: "13px", color: "#333" }}>
            Storefront:{" "}
            <Badge variant="muted" icon={getAccessIcon()}>
              {def.access.storefront}
            </Badge>
          </span>
          {def.capabilities.publishable && (
            <Badge variant="muted" icon={getCapabilityIcon("publishable")}>
              Publishable
            </Badge>
          )}
          {def.capabilities.translatable && (
            <Badge variant="muted" icon={getCapabilityIcon("translatable")}>
              Translatable
            </Badge>
          )}
          {def.capabilities.renderable && (
            <Badge variant="muted" icon={getCapabilityIcon("renderable")}>
              Renderable
            </Badge>
          )}
        </div>
      </div>
      {def.displayNameKey && (
        <div>
          <div style={detailLabel}>DISPLAY NAME KEY</div>
          <code style={codeStyle}>{def.displayNameKey}</code>
        </div>
      )}
    </div>
  )
}
