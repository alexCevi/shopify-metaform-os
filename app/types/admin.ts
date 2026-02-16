export interface AdminApiContext {
  graphql: (query: string, options?: { variables?: Record<string, unknown> }) => Promise<Response>
}
