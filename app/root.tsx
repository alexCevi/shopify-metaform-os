import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router"
import type { LinksFunction } from "react-router"

import globalStyles from "./styles/globals.css?url"

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: globalStyles },
]

export default function App() {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  )
}

function getErrorMessage(error: unknown) {
  if (isRouteErrorResponse(error)) {
    return `${error.status} ${error.statusText}`
  }

  if (error instanceof Error && error.message) return error.message
  if (typeof error === "string" && error.length > 0) return error

  return "Unexpected application error"
}

export function ErrorBoundary() {
  const error = useRouteError()
  const message = getErrorMessage(error)

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Application Error</title>
      </head>
      <body>
        <main style={{ fontFamily: "system-ui, sans-serif", padding: "2rem" }}>
          <h1 style={{ fontSize: "24px", marginBottom: "1rem" }}>
            Application Error
          </h1>
          <pre
            style={{
              padding: "1rem",
              background: "rgba(255, 0, 0, 0.08)",
              color: "#b42318",
              overflow: "auto",
            }}
          >
            {message}
          </pre>
        </main>
        <Scripts />
      </body>
    </html>
  )
}
