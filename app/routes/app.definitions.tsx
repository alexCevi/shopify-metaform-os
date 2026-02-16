import { useState, useMemo } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useLoaderData } from "react-router"
import { authenticate } from "../shopify.server"
import { listAll as listAllMetafields } from "../services/metafield-definitions.server"
import { listAll as listAllMetaobjects } from "../services/metaobject-definitions.server"
import type { MetafieldDefRecord, MetaobjectDefRecord } from "../types/definitions"
import { TextField } from "../components"
import { ExpandableTable } from "../components/ui/expandable-table"
import { Tabs } from "../components/ui/tabs"
import {
  formatOwnerType,
  formatType,
  metafieldColumns,
  metaobjectColumns,
  renderMetafieldExpanded,
  renderMetaobjectExpanded,
} from "../utils/definitions-table-config"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin } = await authenticate.admin(request)

  const [metafieldDefs, metaobjectDefs] = await Promise.all([
    listAllMetafields(admin),
    listAllMetaobjects(admin),
  ])

  const ownerTypes = [...new Set(metafieldDefs.map((d) => d.ownerType))].sort()

  return { metafieldDefs, metaobjectDefs, ownerTypes }
}

export default function DefinitionsPage() {
  const { metafieldDefs, metaobjectDefs, ownerTypes } = useLoaderData<typeof loader>()
  const [activeTab, setActiveTab] = useState<"metafields" | "metaobjects">("metafields")
  const [ownerFilter, setOwnerFilter] = useState<string>("ALL")
  const [searchQuery, setSearchQuery] = useState("")

  const filteredMetafields = useMemo(() => {
    let filtered =
      ownerFilter === "ALL"
        ? metafieldDefs
        : metafieldDefs.filter((d: MetafieldDefRecord) => d.ownerType === ownerFilter)

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      filtered = filtered.filter(
        (d: MetafieldDefRecord) =>
          d.name.toLowerCase().includes(q) ||
          d.namespace.toLowerCase().includes(q) ||
          d.key.toLowerCase().includes(q) ||
          d.type.toLowerCase().includes(q)
      )
    }
    return filtered
  }, [metafieldDefs, ownerFilter, searchQuery])

  const filteredMetaobjects = useMemo(() => {
    if (!searchQuery) return metaobjectDefs
    const q = searchQuery.toLowerCase()
    return metaobjectDefs.filter(
      (d: MetaobjectDefRecord) =>
        d.name.toLowerCase().includes(q) ||
        d.type.toLowerCase().includes(q) ||
        (d.description && d.description.toLowerCase().includes(q))
    )
  }, [metaobjectDefs, searchQuery])

  const ownerFilterOptions = [
    { value: "ALL", label: "All", count: metafieldDefs.length },
    ...ownerTypes.map((type: string) => ({
      value: type,
      label: formatOwnerType(type),
      count: metafieldDefs.filter((d: MetafieldDefRecord) => d.ownerType === type).length,
    })),
  ]

  return (
    <s-page heading="Definitions">
      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        {/* Controls */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              setActiveTab(v as "metafields" | "metaobjects")
              setSearchQuery("")
              if (v === "metaobjects") setOwnerFilter("ALL")
            }}
            triggers={[
              {
                value: "metafields",
                label: (
                  <>
                    Metafields
                    <span style={tabCount}>{metafieldDefs.length}</span>
                  </>
                ),
              },
              {
                value: "metaobjects",
                label: (
                  <>
                    Metaobjects
                    <span style={tabCount}>{metaobjectDefs.length}</span>
                  </>
                ),
              },
            ]}
          />

          {/* Search + Filters */}
          <div style={{ display: "flex", gap: "16px", alignItems: "flex-end", flexWrap: "wrap" }}>
            <div style={{ maxWidth: "320px", flex: 1 }}>
              <TextField
                label="Search"
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder={`Search ${activeTab}...`}
              />
            </div>

            {activeTab === "metafields" && (
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                {ownerFilterOptions.map((opt) => {
                  const isActive = ownerFilter === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setOwnerFilter(opt.value)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 14px",
                        borderRadius: "999px",
                        border: isActive ? "1px solid #111" : "1px solid #eaeaea",
                        backgroundColor: isActive ? "#111" : "#fff",
                        color: isActive ? "#fff" : "#333",
                        fontSize: "13px",
                        fontWeight: 500,
                        fontFamily: "inherit",
                        cursor: "pointer",
                        transition: "all 0.15s ease",
                        outline: "none",
                      }}
                    >
                      {opt.label}
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: 600,
                          backgroundColor: isActive ? "rgba(255,255,255,0.2)" : "#f5f5f5",
                          color: isActive ? "#fff" : "#999",
                          padding: "1px 6px",
                          borderRadius: "999px",
                        }}
                      >
                        {opt.count}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        {/* Table */}
        {activeTab === "metafields" ? (
          <ExpandableTable
            columns={metafieldColumns}
            data={filteredMetafields}
            keyExtractor={(def) => `${def.ownerType}:${def.namespace}:${def.key}`}
            emptyMessage={searchQuery ? "No metafield definitions match your search" : "No metafield definitions found"}
            renderExpandedContent={renderMetafieldExpanded}
          />
        ) : (
          <ExpandableTable
            columns={metaobjectColumns}
            data={filteredMetaobjects}
            keyExtractor={(def) => def.type}
            emptyMessage={searchQuery ? "No metaobject definitions match your search" : "No metaobject definitions found"}
            renderExpandedContent={renderMetaobjectExpanded}
          />
        )}
      </div>
    </s-page>
  )
}

const tabCount: React.CSSProperties = {
  fontSize: "11px",
  fontWeight: 600,
  backgroundColor: "#f5f5f5",
  color: "#999",
  padding: "2px 8px",
  borderRadius: "999px",
}
