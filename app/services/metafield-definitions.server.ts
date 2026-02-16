import type { AdminApiContext } from "../types/admin"
import type { MetafieldDefRecord } from "../types/definitions"

export type { MetafieldDefRecord } from "../types/definitions"

const OWNER_TYPES = [
  "PRODUCT",
  "PRODUCT_VARIANT",
  "CUSTOMER",
  "ORDER",
  "DRAFT_ORDER",
  "COLLECTION",
  "SHOP",
  "COMPANY",
  "COMPANY_LOCATION",
  "MARKET",
  "LOCATION",
  "DISCOUNT",
  "PAGE",
  "BLOG",
  "ARTICLE",
] as const

export type MetafieldOwnerType = (typeof OWNER_TYPES)[number]

interface MetafieldDefinitionNode {
  id: string
  namespace: string
  key: string
  name: string
  description: string | null
  ownerType: string
  type: { name: string }
  validations: Array<{ name: string; value: string }>
  access: { admin: string; storefront: string }
}

const LIST_DEFINITIONS_QUERY = `#graphql
  query MetafieldDefinitions($ownerType: MetafieldOwnerType!, $first: Int!, $after: String) {
    metafieldDefinitions(ownerType: $ownerType, first: $first, after: $after) {
      edges {
        node {
          id
          namespace
          key
          name
          description
          ownerType
          type { name }
          validations { name value }
          access { admin storefront }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`

const GET_DEFINITION_QUERY = `#graphql
  query MetafieldDefinition($key: String!, $namespace: String!, $ownerType: MetafieldOwnerType!) {
    metafieldDefinition(identifier: { key: $key, namespace: $namespace, ownerType: $ownerType }) {
      id
      namespace
      key
      name
      description
      ownerType
      type { name }
      validations { name value }
      access { admin storefront }
    }
  }
`

const CREATE_DEFINITION_MUTATION = `#graphql
  mutation CreateMetafieldDefinition($definition: MetafieldDefinitionInput!) {
    metafieldDefinitionCreate(definition: $definition) {
      createdDefinition {
        id
        namespace
        key
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`

const UPDATE_DEFINITION_MUTATION = `#graphql
  mutation UpdateMetafieldDefinition($definition: MetafieldDefinitionUpdateInput!) {
    metafieldDefinitionUpdate(definition: $definition) {
      updatedDefinition {
        id
        namespace
        key
        name
      }
      userErrors {
        field
        message
      }
    }
  }
`

const DELETE_DEFINITION_MUTATION = `#graphql
  mutation DeleteMetafieldDefinition($id: ID!, $deleteAllAssociatedMetafields: Boolean!) {
    metafieldDefinitionDelete(id: $id, deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields) {
      deletedDefinitionId
      userErrors {
        field
        message
      }
    }
  }
`

const LIST_TYPES_QUERY = `#graphql
  query MetafieldDefinitionTypes {
    metafieldDefinitionTypes {
      name
      category
      supportsDefinitionMigrations
    }
  }
`

function nodeToRecord(node: MetafieldDefinitionNode): MetafieldDefRecord {
  return {
    ownerType: node.ownerType,
    namespace: node.namespace,
    key: node.key,
    name: node.name,
    description: node.description,
    type: node.type.name,
    validations: node.validations,
    access: node.access,
  }
}

export async function listByOwnerType(
  admin: AdminApiContext,
  ownerType: string,
) {
  const definitions: MetafieldDefinitionNode[] = []
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const response = await admin.graphql(LIST_DEFINITIONS_QUERY, {
      variables: { ownerType, first: 50, after },
    })
    const json = await response.json()
    const data = json.data?.metafieldDefinitions

    if (!data) break

    for (const edge of data.edges) {
      definitions.push(edge.node)
    }

    hasNextPage = data.pageInfo.hasNextPage
    after = data.pageInfo.endCursor
  }

  return definitions.map(nodeToRecord)
}

export async function listAll(admin: AdminApiContext) {
  const results: MetafieldDefRecord[] = []

  for (const ownerType of OWNER_TYPES) {
    try {
      const defs = await listByOwnerType(admin, ownerType)
      results.push(...defs)
    } catch {
      // Some owner types may not be available on all stores
    }
  }

  return results
}

export async function getDefinition(
  admin: AdminApiContext,
  identifier: { key: string; namespace: string; ownerType: string },
) {
  const response = await admin.graphql(GET_DEFINITION_QUERY, {
    variables: identifier,
  })
  const json = await response.json()
  const node = json.data?.metafieldDefinition

  if (!node) return null
  return nodeToRecord(node)
}

export async function createDefinition(
  admin: AdminApiContext,
  definition: {
    name: string
    namespace: string
    key: string
    type: string
    ownerType: string
    description?: string
    access?: { admin?: string; storefront?: string }
    validations?: Array<{ name: string; value: string }>
  },
) {
  const response = await admin.graphql(CREATE_DEFINITION_MUTATION, {
    variables: { definition },
  })
  const json = await response.json()
  const result = json.data?.metafieldDefinitionCreate

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "))
  }

  return result?.createdDefinition
}

export async function updateDefinition(
  admin: AdminApiContext,
  definition: {
    namespace: string
    key: string
    ownerType: string
    name?: string
    description?: string
    access?: { admin?: string; storefront?: string }
    validations?: Array<{ name: string; value: string }>
  },
) {
  const response = await admin.graphql(UPDATE_DEFINITION_MUTATION, {
    variables: { definition },
  })
  const json = await response.json()
  const result = json.data?.metafieldDefinitionUpdate

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "))
  }

  return result?.updatedDefinition
}

export async function deleteDefinition(
  admin: AdminApiContext,
  id: string,
  deleteAllAssociatedMetafields = true,
) {
  const response = await admin.graphql(DELETE_DEFINITION_MUTATION, {
    variables: { id, deleteAllAssociatedMetafields },
  })
  const json = await response.json()
  const result = json.data?.metafieldDefinitionDelete

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "))
  }

  return result?.deletedDefinitionId
}

export async function listTypes(admin: AdminApiContext) {
  const response = await admin.graphql(LIST_TYPES_QUERY)
  const json = await response.json()
  return json.data?.metafieldDefinitionTypes ?? []
}
