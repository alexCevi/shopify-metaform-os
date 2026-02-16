import type { LoaderFunctionArgs } from "react-router"

export async function loader({ request }: LoaderFunctionArgs) {
  return new Response("OK", {
    status: 200,
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "no-cache, no-store, must-revalidate",
    },
  })
}
