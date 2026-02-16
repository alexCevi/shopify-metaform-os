export interface MetafieldDefRecord {
  ownerType: string
  namespace: string
  key: string
  name: string
  description: string | null
  type: string
  validations: Array<{ name: string; value: string }>
  access: { admin: string; storefront: string }
}

export interface MetaobjectFieldDefRecord {
  key: string
  name: string
  type: string
  description: string | null
  required: boolean
  validations: Array<{ name: string; value: string }>
}

export interface MetaobjectDefRecord {
  type: string
  name: string
  description: string | null
  displayNameKey: string | null
  access: { admin: string; storefront: string }
  capabilities: {
    publishable: boolean
    translatable: boolean
    renderable: boolean
  }
  fieldDefinitions: MetaobjectFieldDefRecord[]
}

export interface DefinitionSnapshot {
  version: "1.0"
  capturedAt: string
  shop: string
  metafieldDefinitions: MetafieldDefRecord[]
  metaobjectDefinitions: MetaobjectDefRecord[]
}

export interface DiffEntry<T> {
  key: string
  source: T
  target: T | null
}

export interface SnapshotDiff {
  added: DiffEntry<MetafieldDefRecord | MetaobjectDefRecord>[]
  removed: DiffEntry<MetafieldDefRecord | MetaobjectDefRecord>[]
  modified: Array<{
    key: string
    source: MetafieldDefRecord | MetaobjectDefRecord
    target: MetafieldDefRecord | MetaobjectDefRecord
    changes: string[]
  }>
  unchanged: string[]
}

export function isMetafieldDef(def: MetafieldDefRecord | MetaobjectDefRecord): def is MetafieldDefRecord {
  return "namespace" in def && "key" in def
}

export function isMetaobjectDef(def: MetafieldDefRecord | MetaobjectDefRecord): def is MetaobjectDefRecord {
  return "fieldDefinitions" in def
}
