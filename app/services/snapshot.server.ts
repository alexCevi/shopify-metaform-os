import type { AdminApiContext } from "../types/admin"
import { listAll as listAllMetafields } from "./metafield-definitions.server"
import { listAll as listAllMetaobjects } from "./metaobject-definitions.server"
import type {
  MetafieldDefRecord,
  MetaobjectDefRecord,
  DefinitionSnapshot,
  SnapshotDiff,
} from "../types/definitions"
import { isMetafieldDef, isMetaobjectDef } from "../types/definitions"

export type { DefinitionSnapshot, SnapshotDiff, DiffEntry } from "../types/definitions"

export async function capture(admin: AdminApiContext, shop: string): Promise<DefinitionSnapshot> {
  const [metafieldDefinitions, metaobjectDefinitions] = await Promise.all([
    listAllMetafields(admin),
    listAllMetaobjects(admin),
  ])

  return {
    version: "1.0",
    capturedAt: new Date().toISOString(),
    shop,
    metafieldDefinitions: sortMetafieldDefs(metafieldDefinitions),
    metaobjectDefinitions: sortMetaobjectDefs(metaobjectDefinitions),
  }
}

export function parse(json: string): DefinitionSnapshot {
  const data = JSON.parse(json)

  if (data.version !== "1.0") {
    throw new Error(`Unsupported snapshot version: ${data.version}`)
  }

  if (!Array.isArray(data.metafieldDefinitions) || !Array.isArray(data.metaobjectDefinitions)) {
    throw new Error("Invalid snapshot: missing definitions arrays")
  }

  return data as DefinitionSnapshot
}

export function diff(source: DefinitionSnapshot, target: DefinitionSnapshot): SnapshotDiff {
  const result: SnapshotDiff = {
    added: [],
    removed: [],
    modified: [],
    unchanged: [],
  }

  const sourceMetafields = new Map(
    source.metafieldDefinitions.map((d) => [metafieldKey(d), d]),
  )
  const targetMetafields = new Map(
    target.metafieldDefinitions.map((d) => [metafieldKey(d), d]),
  )

  for (const [key, sourceDef] of sourceMetafields) {
    const targetDef = targetMetafields.get(key)
    if (!targetDef) {
      result.added.push({ key, source: sourceDef, target: null })
    } else {
      const changes = diffMetafieldDef(sourceDef, targetDef)
      if (changes.length > 0) {
        result.modified.push({ key, source: sourceDef, target: targetDef, changes })
      } else {
        result.unchanged.push(key)
      }
    }
  }

  for (const [key, targetDef] of targetMetafields) {
    if (!sourceMetafields.has(key)) {
      result.removed.push({ key, source: targetDef, target: null })
    }
  }

  const sourceMetaobjects = new Map(
    source.metaobjectDefinitions.map((d) => [d.type, d]),
  )
  const targetMetaobjects = new Map(
    target.metaobjectDefinitions.map((d) => [d.type, d]),
  )

  for (const [key, sourceDef] of sourceMetaobjects) {
    const targetDef = targetMetaobjects.get(key)
    if (!targetDef) {
      result.added.push({ key, source: sourceDef, target: null })
    } else {
      const changes = diffMetaobjectDef(sourceDef, targetDef)
      if (changes.length > 0) {
        result.modified.push({ key, source: sourceDef, target: targetDef, changes })
      } else {
        result.unchanged.push(key)
      }
    }
  }

  for (const [key, targetDef] of targetMetaobjects) {
    if (!sourceMetaobjects.has(key)) {
      result.removed.push({ key, source: targetDef, target: null })
    }
  }

  return result
}

export function summarizeDiff(d: SnapshotDiff): string {
  const parts: string[] = []
  if (d.added.length) parts.push(`${d.added.length} added`)
  if (d.modified.length) parts.push(`${d.modified.length} modified`)
  if (d.removed.length) parts.push(`${d.removed.length} removed`)
  if (d.unchanged.length) parts.push(`${d.unchanged.length} unchanged`)
  return parts.join(", ") || "No definitions"
}

export function generateCommitMessage(d: SnapshotDiff): string {
  const lines = ["MetaForm: Update definitions"]

  if (d.added.length) {
    lines.push("")
    lines.push("Added:")
    for (const entry of d.added) {
      lines.push(`  + ${entry.key}`)
    }
  }

  if (d.modified.length) {
    lines.push("")
    lines.push("Modified:")
    for (const entry of d.modified) {
      lines.push(`  ~ ${entry.key} (${entry.changes.join(", ")})`)
    }
  }

  if (d.removed.length) {
    lines.push("")
    lines.push("Removed:")
    for (const entry of d.removed) {
      lines.push(`  - ${entry.key}`)
    }
  }

  return lines.join("\n")
}

/** Build snapshot that represents store state after applying source changes (added + modified). */
export function buildReconciledSnapshot(
  current: DefinitionSnapshot,
  source: DefinitionSnapshot,
  d: SnapshotDiff,
): DefinitionSnapshot {
  const addedOrModifiedKeys = new Set([
    ...d.added.map((e) => e.key),
    ...d.modified.map((e) => e.key),
  ])

  const reconciledMetafields = current.metafieldDefinitions.filter(
    (def) => !addedOrModifiedKeys.has(metafieldKey(def)),
  )
  for (const entry of d.added) {
    if (isMetafieldDef(entry.source)) {
      reconciledMetafields.push(entry.source as MetafieldDefRecord)
    }
  }
  for (const entry of d.modified) {
    if (isMetafieldDef(entry.source)) {
      reconciledMetafields.push(entry.source as MetafieldDefRecord)
    }
  }

  const reconciledMetaobjects = current.metaobjectDefinitions.filter(
    (def) => !addedOrModifiedKeys.has(def.type),
  )
  for (const entry of d.added) {
    if (isMetaobjectDef(entry.source)) {
      reconciledMetaobjects.push(entry.source as MetaobjectDefRecord)
    }
  }
  for (const entry of d.modified) {
    if (isMetaobjectDef(entry.source)) {
      reconciledMetaobjects.push(entry.source as MetaobjectDefRecord)
    }
  }

  return {
    version: current.version,
    capturedAt: new Date().toISOString(),
    shop: current.shop,
    metafieldDefinitions: sortMetafieldDefs(reconciledMetafields),
    metaobjectDefinitions: sortMetaobjectDefs(reconciledMetaobjects),
  }
}

function metafieldKey(d: MetafieldDefRecord) {
  return `${d.ownerType}:${d.namespace}:${d.key}`
}

function sortMetafieldDefs(defs: MetafieldDefRecord[]) {
  return [...defs].sort((a, b) => metafieldKey(a).localeCompare(metafieldKey(b)))
}

function sortMetaobjectDefs(defs: MetaobjectDefRecord[]) {
  return [...defs].sort((a, b) => a.type.localeCompare(b.type))
}

function diffMetafieldDef(a: MetafieldDefRecord, b: MetafieldDefRecord): string[] {
  const changes: string[] = []
  if (a.name !== b.name) changes.push("name")
  if (a.description !== b.description) changes.push("description")
  if (a.type !== b.type) changes.push("type")
  if (JSON.stringify(a.validations) !== JSON.stringify(b.validations)) changes.push("validations")
  if (JSON.stringify(a.access) !== JSON.stringify(b.access)) changes.push("access")
  return changes
}

function diffMetaobjectDef(a: MetaobjectDefRecord, b: MetaobjectDefRecord): string[] {
  const changes: string[] = []
  if (a.name !== b.name) changes.push("name")
  if (a.description !== b.description) changes.push("description")
  if (a.displayNameKey !== b.displayNameKey) changes.push("displayNameKey")
  if (JSON.stringify(a.access) !== JSON.stringify(b.access)) changes.push("access")
  if (JSON.stringify(a.capabilities) !== JSON.stringify(b.capabilities)) changes.push("capabilities")
  if (JSON.stringify(a.fieldDefinitions) !== JSON.stringify(b.fieldDefinitions)) changes.push("fields")
  return changes
}

export { isMetafieldDef, isMetaobjectDef } from "../types/definitions"
