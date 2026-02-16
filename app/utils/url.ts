export function joinUrl(base: string, ...paths: string[]): string {
  // Remove trailing slash from base
  const normalizedBase = base.replace(/\/+$/, "")
  
  // Join paths, ensuring single slashes
  const normalizedPaths = paths
    .map(p => p.replace(/^\/+/, "").replace(/\/+$/, ""))
    .filter(Boolean)
    .join("/")
  
  return normalizedPaths ? `${normalizedBase}/${normalizedPaths}` : normalizedBase
}
