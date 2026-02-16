/**
 * Access rules from Shopify docs (Admin API):
 *
 * Metafields:
 * - The admin field must be either MERCHANT_READ or MERCHANT_READ_WRITE.
 * - PUBLIC_READ_WRITE values are mapped to MERCHANT_READ_WRITE for compatibility.
 *
 * Metaobjects:
 * - Merchant-owned (type without $app: prefix): admin must be omitted.
 * - App-owned (type $app:...): admin can be MERCHANT_READ or MERCHANT_READ_WRITE.
 */

export type MetafieldAdminAccessInput = "MERCHANT_READ" | "MERCHANT_READ_WRITE"

const MERCHANT_MAP: Record<string, MetafieldAdminAccessInput> = {
  MERCHANT_READ: "MERCHANT_READ",
  MERCHANT_READ_WRITE: "MERCHANT_READ_WRITE",
  PUBLIC_READ: "MERCHANT_READ",
  PUBLIC_READ_WRITE: "MERCHANT_READ_WRITE",
}

function isAppReservedMetafieldNamespace(namespace: string): boolean {
  return namespace === "$app" || namespace.startsWith("app--")
}

function isAppReservedMetaobjectType(type: string): boolean {
  return type.startsWith("$app:") || type.startsWith("app.")
}

/** Normalize metafield definition access for Admin API create/update. */
export function metafieldAccessForApi(
  namespace: string,
  access: { admin: string; storefront: string }
): { admin?: MetafieldAdminAccessInput; storefront: string } {
  if (isAppReservedMetafieldNamespace(namespace)) {
    const admin = MERCHANT_MAP[access.admin] ?? "MERCHANT_READ_WRITE"
    return { admin, storefront: access.storefront }
  }
  // For merchant-owned metafields, don't set admin - it's fixed by Shopify
  return { storefront: access.storefront }
}

/** Normalize metaobject definition access for Admin API create/update. Omit admin for merchant-owned types. */
export function metaobjectAccessForApi(
  type: string,
  access: { admin: string; storefront: string }
): { admin?: MetafieldAdminAccessInput; storefront: string } {
  if (isAppReservedMetaobjectType(type)) {
    const admin = MERCHANT_MAP[access.admin] ?? "MERCHANT_READ_WRITE"
    return { admin, storefront: access.storefront }
  }
  return { storefront: access.storefront }
}
