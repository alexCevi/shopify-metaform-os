import type { LoaderFunctionArgs } from "react-router"
import prisma from "../db.server"
import { encrypt } from "../services/encryption.server"
import * as github from "../services/github.server"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url)
  const code = url.searchParams.get("code")
  const state = url.searchParams.get("state")

  if (!code || !state) {
    return new Response(renderHtml("Authorization failed", "Missing code or state parameter. Please try again."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  let shop: string
  try {
    const decoded = JSON.parse(Buffer.from(state, "base64url").toString("utf8"))
    shop = decoded.shop
    if (!shop) throw new Error("No shop in state")
  } catch {
    return new Response(renderHtml("Authorization failed", "Invalid state parameter. Please try again."), {
      status: 400,
      headers: { "Content-Type": "text/html" },
    })
  }

  try {
    const accessToken = await github.exchangeCode(code)
    const user = await github.getAuthenticatedUser(accessToken)
    const encryptedToken = await encrypt(accessToken)

    const existing = await prisma.gitHubConnection.findUnique({ where: { shop } })

    if (existing) {
      await prisma.gitHubConnection.update({
        where: { shop },
        data: {
          accessToken: encryptedToken,
          owner: user.login,
        },
      })
    } else {
      await prisma.gitHubConnection.create({
        data: {
          shop,
          accessToken: encryptedToken,
          owner: user.login,
          repo: "",
          branch: "main",
        },
      })
    }

    return new Response(
      renderHtml(
        "Connected to GitHub",
        `Signed in as <strong>${user.login}</strong>. This window will close automatically.`,
        true,
      ),
      { status: 200, headers: { "Content-Type": "text/html" } },
    )
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error"
    return new Response(renderHtml("Connection failed", message), {
      status: 500,
      headers: { "Content-Type": "text/html" },
    })
  }
}

function renderHtml(title: string, body: string, autoClose = false) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${title} - MetaForm</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f6f6f7;
      color: #1a1a1a;
    }
    .container {
      text-align: center;
      padding: 48px;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      max-width: 420px;
    }
    h1 { font-size: 20px; margin: 0 0 12px; }
    p { font-size: 14px; color: #616161; margin: 0; line-height: 1.5; }
    .success { color: #1a8a3f; }
    .error { color: #d82c0d; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="${autoClose ? "success" : "error"}">${title}</h1>
    <p>${body}</p>
  </div>
  ${autoClose ? `<script>
    if (window.opener) {
      window.opener.postMessage({ type: "metaform:github-connected" }, "*");
    }
    setTimeout(() => window.close(), 2000);
  </script>` : ""}
</body>
</html>`
}
