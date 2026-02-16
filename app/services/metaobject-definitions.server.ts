import type { AdminApiContext } from "../types/admin"
import type { MetaobjectDefRecord } from "../types/definitions"

export type { MetaobjectDefRecord, MetaobjectFieldDefRecord } from "../types/definitions"

interface MetaobjectDefinitionNode {
  id: string
  type: string
  name: string
  description: string | null
  displayNameKey: string | null
  access: { admin: string; storefront: string }
  capabilities: {
    publishable: { enabled: boolean }
    translatable: { enabled: boolean }
    renderable: { enabled: boolean }
  }
  fieldDefinitions: Array<{
    key: string
    name: string
    type: { name: string }
    description: string | null
    required: boolean
    validations: Array<{ name: string; value: string }>
  }>
}

const LIST_DEFINITIONS_QUERY = `#graphql
  query MetaobjectDefinitions($first: Int!, $after: String) {
    metaobjectDefinitions(first: $first, after: $after) {
      edges {
        node {
          id
          type
          name
          description
          displayNameKey
          access { admin storefront }
          capabilities {
            publishable { enabled }
            translatable { enabled }
            renderable { enabled }
          }
          fieldDefinitions {
            key
            name
            type { name }
            description
            required
            validations { name value }
          }
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
  query MetaobjectDefinition($id: ID!) {
    metaobjectDefinition(id: $id) {
      id
      type
      name
      description
      displayNameKey
      access { admin storefront }
      capabilities {
        publishable { enabled }
        translatable { enabled }
        renderable { enabled }
      }
      fieldDefinitions {
        key
        name
        type { name }
        description
        required
        validations { name value }
      }
    }
  }
`

const GET_BY_TYPE_QUERY = `#graphql
  query MetaobjectDefinitionByType($type: String!) {
    metaobjectDefinitionByType(type: $type) {
      id
      type
      name
      description
      displayNameKey
      access { admin storefront }
      capabilities {
        publishable { enabled }
        translatable { enabled }
        renderable { enabled }
      }
      fieldDefinitions {
        key
        name
        type { name }
        description
        required
        validations { name value }
      }
    }
  }
`

const CREATE_DEFINITION_MUTATION = `#graphql
  mutation CreateMetaobjectDefinition($definition: MetaobjectDefinitionCreateInput!) {
    metaobjectDefinitionCreate(definition: $definition) {
      metaobjectDefinition {
        id
        type
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
  mutation UpdateMetaobjectDefinition($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
    metaobjectDefinitionUpdate(id: $id, definition: $definition) {
      metaobjectDefinition {
        id
        type
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
  mutation DeleteMetaobjectDefinition($id: ID!) {
    metaobjectDefinitionDelete(id: $id) {
      deletedId
      userErrors {
        field
        message
      }
    }
  }
`

function nodeToRecord(node: MetaobjectDefinitionNode): MetaobjectDefRecord {
  return {
    type: node.type,
    name: node.name,
    description: node.description,
    displayNameKey: node.displayNameKey,
    access: node.access,
    capabilities: {
      publishable: node.capabilities.publishable.enabled,
      translatable: node.capabilities.translatable.enabled,
      renderable: node.capabilities.renderable.enabled,
    },
    fieldDefinitions: node.fieldDefinitions.map((f) => ({
      key: f.key,
      name: f.name,
      type: f.type.name,
      description: f.description,
      required: f.required,
      validations: f.validations,
    })),
  }
}

export async function listAll(admin: AdminApiContext) {
  const definitions: MetaobjectDefinitionNode[] = []
  let after: string | null = null
  let hasNextPage = true

  while (hasNextPage) {
    const response = await admin.graphql(LIST_DEFINITIONS_QUERY, {
      variables: { first: 50, after },
    })
    const json = await response.json()
    const data = json.data?.metaobjectDefinitions

    if (!data) break

    for (const edge of data.edges) {
      definitions.push(edge.node)
    }

    hasNextPage = data.pageInfo.hasNextPage
    after = data.pageInfo.endCursor
  }

  return definitions.map(nodeToRecord)
}

export async function getDefinition(admin: AdminApiContext, id: string) {
  const response = await admin.graphql(GET_DEFINITION_QUERY, {
    variables: { id },
  })
  const json = await response.json()
  const node = json.data?.metaobjectDefinition as MetaobjectDefinitionNode | null

  if (!node) return null
  return { id, ...nodeToRecord(node) }
}

export async function getByType(admin: AdminApiContext, type: string) {
  const response = await admin.graphql(GET_BY_TYPE_QUERY, {
    variables: { type },
  })
  const json = await response.json()
  const node = json.data?.metaobjectDefinitionByType as MetaobjectDefinitionNode | null

  if (!node) return null
  return { id: node.id, ...nodeToRecord(node) }
}

export async function createDefinition(
  admin: AdminApiContext,
  definition: {
    type: string
    name: string
    description?: string
    displayNameKey?: string
    access?: { admin?: string; storefront?: string }
    capabilities?: {
      publishable?: { enabled: boolean }
      translatable?: { enabled: boolean }
      renderable?: { enabled: boolean }
    }
    fieldDefinitions?: Array<{
      key: string
      name: string
      type: string
      description?: string
      required?: boolean
      validations?: Array<{ name: string; value: string }>
    }>
  },
) {
  const response = await admin.graphql(CREATE_DEFINITION_MUTATION, {
    variables: { definition },
  })
  const json = await response.json()
  const result = json.data?.metaobjectDefinitionCreate

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "))
  }

  return result?.metaobjectDefinition
}

export async function updateDefinition(
  admin: AdminApiContext,
  id: string,
  definition: {
    name?: string
    description?: string
    displayNameKey?: string
    access?: { admin?: string; storefront?: string }
    capabilities?: {
      publishable?: { enabled: boolean }
      translatable?: { enabled: boolean }
      renderable?: { enabled: boolean }
    }
    fieldDefinitions?: Array<{
      create?: {
        key: string
        name: string
        type: string
        description?: string
        required?: boolean
        validations?: Array<{ name: string; value: string }>
      }
      update?: {
        key: string
        name?: string
        description?: string
        required?: boolean
        validations?: Array<{ name: string; value: string }>
      }
      delete?: { key: string }
    }>
  },
) {
  const response = await admin.graphql(UPDATE_DEFINITION_MUTATION, {
    variables: { id, definition },
  })
  const json = await response.json()
  const result = json.data?.metaobjectDefinitionUpdate

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "))
  }

  return result?.metaobjectDefinition
}

export async function deleteDefinition(admin: AdminApiContext, id: string) {
  const response = await admin.graphql(DELETE_DEFINITION_MUTATION, {
    variables: { id },
  })
  const json = await response.json()
  const result = json.data?.metaobjectDefinitionDelete

  if (result?.userErrors?.length) {
    throw new Error(result.userErrors.map((e: { message: string }) => e.message).join(", "))
  }

  return result?.deletedId
}
