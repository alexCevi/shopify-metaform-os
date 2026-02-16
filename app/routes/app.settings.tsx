import { useState, useEffect, useCallback } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { useLoaderData, useFetcher, useRevalidator } from "react-router"
import { useAppBridge } from "@shopify/app-bridge-react"
import { authenticate } from "../shopify.server"
import prisma from "../db.server"
import { decrypt } from "../services/encryption.server"
import { getAppConfig, updateGitHubCredentials } from "../services/app-config.server"
import * as github from "../services/github.server"
import { joinUrl } from "../utils/url"
import { Badge, Button, Skeleton, SkeletonText, EmptyState } from "../components"
import { Collapsible } from "../components/ui/collapsible"
import { CredentialsForm } from "../components/settings/credentials-form"
import { ConnectionForm } from "../components/settings/connection-form"

type ConnectionWithLowerEnv = {
  lowerEnvOwner?: string | null
  lowerEnvRepo?: string | null
  lowerEnvBranch?: string | null
  lowerEnvFilePath?: string | null
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request)
  const shop = session.shop

  const [appConfig, connection] = await Promise.all([
    getAppConfig(),
    prisma.gitHubConnection.findUnique({ where: { shop } }),
  ])

  const hasCredentials = !!appConfig.githubClientId && !!appConfig.githubClientSecret

  let githubUser: { login: string } | null = null
  let repos: Array<{ fullName: string; owner: string; name: string }> = []
  let branches: Array<{ name: string }> = []

  let lowerEnvBranches: Array<{ name: string }> = []

  const conn = connection as typeof connection & ConnectionWithLowerEnv

  if (connection) {
    try {
      const token = await decrypt(connection.accessToken)
      const results = await Promise.allSettled([
        github.getAuthenticatedUser(token),
        github.listRepos(token),
        connection.repo ? github.listBranches(token, connection.owner, connection.repo) : Promise.resolve([]),
        conn.lowerEnvRepo && conn.lowerEnvOwner
          ? github.listBranches(token, conn.lowerEnvOwner, conn.lowerEnvRepo)
          : Promise.resolve([]),
      ])
      githubUser = results[0].status === "fulfilled" ? results[0].value : null
      repos = results[1].status === "fulfilled" ? results[1].value : []
      branches = results[2].status === "fulfilled" ? results[2].value : []
      lowerEnvBranches = results[3].status === "fulfilled" ? results[3].value : []
    } catch {
      // Token may be invalid
    }
  }

  const appUrl = process.env.SHOPIFY_APP_URL ?? ""
  const callbackUrl = joinUrl(appUrl, "/auth/github/callback")

  return {
    shop,
    hasCredentials,
    githubClientId: appConfig.githubClientId ?? "",
    githubClientSecret: appConfig.githubClientSecret ? "********" : "",
    connection: connection
      ? {
          owner: connection.owner,
          repo: connection.repo,
          branch: connection.branch,
          filePath: connection.filePath,
          autoImport: connection.autoImport,
          lowerEnvOwner: conn.lowerEnvOwner ?? null,
          lowerEnvRepo: conn.lowerEnvRepo ?? null,
          lowerEnvBranch: conn.lowerEnvBranch ?? null,
          lowerEnvFilePath: conn.lowerEnvFilePath ?? null,
        }
      : null,
    githubUser,
    repos,
    branches,
    lowerEnvBranches,
    callbackUrl,
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request)
  const shop = session.shop
  const formData = await request.formData()
  const intent = formData.get("intent") as string

  if (intent === "save_credentials") {
    const clientId = formData.get("githubClientId") as string
    const clientSecret = formData.get("githubClientSecret") as string
    if (!clientId || !clientSecret) return { error: "Both Client ID and Client Secret are required" }
    await updateGitHubCredentials(clientId.trim(), clientSecret.trim())
    return { success: true, message: "GitHub credentials saved" }
  }

  if (intent === "get_oauth_url") {
    const appUrl = process.env.SHOPIFY_APP_URL ?? ""
    const redirectUri = joinUrl(appUrl, "/auth/github/callback")
    const state = Buffer.from(JSON.stringify({ shop })).toString("base64url")
    try {
      const oauthUrl = await github.getOAuthUrl(state, redirectUri)
      return { oauthUrl }
    } catch (err) {
      return { error: err instanceof Error ? err.message : "Failed to generate OAuth URL" }
    }
  }

  if (intent === "disconnect") {
    await prisma.gitHubConnection.deleteMany({ where: { shop } })
    return { success: true, message: "Disconnected from GitHub" }
  }

  if (intent === "save") {
    const owner = formData.get("owner") as string
    const repo = formData.get("repo") as string
    const branch = formData.get("branch") as string
    const filePath = formData.get("filePath") as string
    const autoImport = formData.get("autoImport") === "true"
    const lowerEnvOwner = (formData.get("lowerEnvOwner") as string)?.trim() || null
    const lowerEnvRepo = (formData.get("lowerEnvRepo") as string)?.trim() || null
    const lowerEnvBranch = (formData.get("lowerEnvBranch") as string)?.trim() || null
    const lowerEnvFilePath = (formData.get("lowerEnvFilePath") as string)?.trim() || null
    const hasAny = !!(lowerEnvOwner || lowerEnvRepo || lowerEnvBranch)
    const hasAll = !!(lowerEnvOwner && lowerEnvRepo && lowerEnvBranch)
    if (hasAny && !hasAll) {
      return { error: "Sync source requires repository and branch (all three or leave all empty)" }
    }
    const updateData = {
      owner,
      repo,
      branch,
      filePath,
      autoImport,
      lowerEnvOwner: hasAll ? lowerEnvOwner : null,
      lowerEnvRepo: hasAll ? lowerEnvRepo : null,
      lowerEnvBranch: hasAll ? lowerEnvBranch : null,
      lowerEnvFilePath: hasAll ? lowerEnvFilePath : null,
    }
    await prisma.gitHubConnection.update({
      where: { shop },
      data: updateData as Parameters<typeof prisma.gitHubConnection.update>[0]["data"],
    })
    return { success: true, message: "Settings saved" }
  }

  if (intent === "fetch_branches") {
    const repoFullName = formData.get("repo") as string
    const [owner, repoName] = repoFullName.split("/")
    const connection = await prisma.gitHubConnection.findUnique({ where: { shop } })
    if (!connection) return { branches: [] }
    const token = await decrypt(connection.accessToken)
    const branches = await github.listBranches(token, owner, repoName)
    await prisma.gitHubConnection.update({ where: { shop }, data: { owner, repo: repoName } })
    return { branches, success: true }
  }

  if (intent === "fetch_lower_env_branches") {
    const repoFullName = formData.get("lowerEnvRepo") as string
    const [owner, repoName] = repoFullName.split("/")
    const connection = await prisma.gitHubConnection.findUnique({ where: { shop } })
    if (!connection) return { lowerEnvBranches: [] }
    const token = await decrypt(connection.accessToken)
    const lowerEnvBranches = await github.listBranches(token, owner, repoName)
    return { lowerEnvBranches, success: true }
  }

  return null
}

export default function SettingsPage() {
  const data = useLoaderData<typeof loader>()
  const connectFetcher = useFetcher<typeof action>()
  const disconnectFetcher = useFetcher<typeof action>()
  const revalidator = useRevalidator()
  const shopify = useAppBridge()
  const [showErrorBanner, setShowErrorBanner] = useState(true)
  const { connection, githubUser, repos, branches, lowerEnvBranches, hasCredentials, callbackUrl } = data

  const handleMessage = useCallback(
    (event: MessageEvent) => {
      if (event.data?.type === "metaform:github-connected") {
        revalidator.revalidate()
        shopify.toast.show("Connected to GitHub")
      }
    },
    [revalidator, shopify]
  )

  useEffect(() => {
    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [handleMessage])

  const handleConnect = () => {
    connectFetcher.submit({ intent: "get_oauth_url" }, { method: "POST" })
  }

  useEffect(() => {
    if (connectFetcher.data && "oauthUrl" in connectFetcher.data && connectFetcher.data.oauthUrl) {
      const url = connectFetcher.data.oauthUrl as string
      const width = 600
      const height = 700
      const left = window.screenX + (window.outerWidth - width) / 2
      const top = window.screenY + (window.outerHeight - height) / 2
      window.open(url, "github-oauth", `width=${width},height=${height},left=${left},top=${top}`)
    }
  }, [connectFetcher.data])

  const handleDisconnect = () => {
    disconnectFetcher.submit({ intent: "disconnect" }, { method: "POST" })
    shopify.toast.show("Disconnected from GitHub")
  }

  const handleCredentialsSaved = () => {
    shopify.toast.show("GitHub credentials saved")
    revalidator.revalidate()
  }

  const isConnecting = connectFetcher.state !== "idle"
  const isRevalidating = revalidator.state === "loading"

  return (
    <s-page heading="Settings">
      <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

        {connectFetcher.data && "error" in connectFetcher.data && showErrorBanner && (
          <s-banner
            tone="critical"
            heading="Connection error"
            onDismiss={() => setShowErrorBanner(false)}
          >
            {connectFetcher.data.error as string}
          </s-banner>
        )}

        {/* GitHub Credentials - Collapsible */}
        <Collapsible
          defaultOpen={!hasCredentials}
          header={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="#333">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>
                  GitHub App Credentials
                </div>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                  Configure your OAuth App for repository sync
                </div>
              </div>
              {hasCredentials && (
                <Badge tone="success" size="medium">Configured</Badge>
              )}
            </div>
          }
        >
          {isRevalidating ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <Skeleton height="20px" width="60%" />
              <Skeleton height="40px" />
              <Skeleton height="40px" />
              <Skeleton height="40px" width="30%" />
            </div>
          ) : (
            <CredentialsForm
              initialClientId={data.githubClientId}
              hasSecretSaved={data.githubClientSecret === "********"}
              callbackUrl={callbackUrl}
              onSave={handleCredentialsSaved}
            />
          )}
        </Collapsible>

        {/* GitHub Connection - Collapsible */}
        <Collapsible
          defaultOpen={true}
          header={
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <svg width="24" height="24" viewBox="0 0 20 20" fill="#333">
                <path
                  fillRule="evenodd"
                  d="M10 0C4.477 0 0 4.484 0 10.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0110 4.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.203 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.942.359.31.678.921.678 1.856 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0020 10.017C20 4.484 15.522 0 10 0z"
                  clipRule="evenodd"
                />
              </svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "16px", fontWeight: 600, color: "#111" }}>
                  GitHub Connection
                </div>
                <div style={{ fontSize: "13px", color: "#666", marginTop: "2px" }}>
                  {connection ? (
                    <>
                      {githubUser?.login ?? connection.owner}
                      {connection.repo && (
                        <>
                          {" · "}
                          <span style={{ fontFamily: "monospace", fontSize: "12px" }}>
                            {connection.owner}/{connection.repo}
                            {connection.branch ? ` @ ${connection.branch}` : ""}
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    "Connect your GitHub account to sync definitions"
                  )}
                </div>
              </div>
              {connection && (
                <Badge tone="success" size="medium">Connected</Badge>
              )}
            </div>
          }
        >
          {isRevalidating ? (
            <div style={cardStyle}>
              <SkeletonText lines={3} />
            </div>
          ) : !hasCredentials && !connection ? (
            <div style={cardStyle}>
              <EmptyState
                title="Configure credentials first"
                description="Enter your GitHub OAuth App credentials above before connecting."
              />
            </div>
          ) : !connection ? (
            <div style={cardStyle}>
              <EmptyState
                title="Connect to GitHub"
                description="Authorize MetaForm with your GitHub account. A popup window will open."
                action={
                  <Button variant="primary" onClick={handleConnect} loading={isConnecting}>
                    Connect to GitHub
                  </Button>
                }
              />
            </div>
          ) : (
            <ConnectionForm
              connection={connection}
              githubUser={githubUser}
              repos={repos}
              branches={branches ?? []}
              lowerEnvBranches={lowerEnvBranches ?? []}
            />
          )}
        </Collapsible>

        {/* Danger zone */}
        <div style={dangerZoneStyle}>
          <div style={dangerZoneHeader}>
            <h2 style={dangerZoneTitle}>Danger zone</h2>
            <p style={dangerZoneDescription}>
              These actions are irreversible. Proceed with caution.
            </p>
          </div>
          <div style={dangerZoneContent}>
            <div style={dangerZoneItem}>
              <div>
                <div style={dangerZoneItemTitle}>Disconnect GitHub</div>
                <div style={dangerZoneItemDescription}>
                  Remove the connection between this store and your GitHub account. Definitions will no longer sync. You can reconnect at any time.
                </div>
              </div>
              <Button
                variant="destructive"
                onClick={handleDisconnect}
                disabled={!connection}
              >
                Disconnect
              </Button>
            </div>
          </div>
        </div>
      </div>
    </s-page>
  )
}

const cardStyle: React.CSSProperties = {
  border: "1px solid #eaeaea",
  borderRadius: "8px",
  backgroundColor: "#fff",
  padding: "24px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
}

const dangerZoneStyle: React.CSSProperties = {
  border: "1px solid #fecaca",
  borderRadius: "8px",
  backgroundColor: "#fff",
  overflow: "hidden",
}

const dangerZoneHeader: React.CSSProperties = {
  padding: "10px 12px",
  borderBottom: "1px solid #fecaca",
  backgroundColor: "#fef2f2",
}

const dangerZoneTitle: React.CSSProperties = {
  fontSize: "16px",
  fontWeight: 600,
  color: "#991b1b",
  margin: 0,
}

const dangerZoneDescription: React.CSSProperties = {
  fontSize: "13px",
  color: "#b91c1c",
  margin: 0,
  marginTop: "4px",
}

const dangerZoneContent: React.CSSProperties = {
  padding: "20px 24px",
}

const dangerZoneItem: React.CSSProperties = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "wrap",
}

const dangerZoneItemTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#111",
}

const dangerZoneItemDescription: React.CSSProperties = {
  fontSize: "13px",
  color: "#666",
  marginTop: "4px",
  maxWidth: "620px",
}
