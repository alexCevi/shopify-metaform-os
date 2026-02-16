import { useState } from "react"
import type { LoaderFunctionArgs } from "react-router"
import { useLoaderData } from "react-router"
import { authenticate } from "../shopify.server"
import prisma from "../db.server"
import { capture } from "../services/snapshot.server"
import { decrypt } from "../services/encryption.server"
import * as github from "../services/github.server"
import { Badge } from "../components"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  const shop = session.shop

  const [connection, currentSnapshot, recentLogs] = await Promise.all([
    prisma.gitHubConnection.findUnique({ where: { shop } }),
    capture(admin, shop),
    prisma.syncLog.findMany({
      where: { shop },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
  ])

  let branchStatus: "connected" | "behind" | "in_sync" | "not_connected" = "not_connected"
  let branchInfo: { owner: string; repo: string; branch: string } | null = null

  if (connection && connection.repo) {
    branchInfo = { owner: connection.owner, repo: connection.repo, branch: connection.branch }
    try {
      const token = await decrypt(connection.accessToken)
      const remoteSha = await github.getLatestFileSha(
        token, connection.owner, connection.repo, connection.branch, connection.filePath
      )
      if (!remoteSha) branchStatus = "connected"
      else if (remoteSha === connection.lastPushedSha) branchStatus = "in_sync"
      else if (remoteSha === connection.lastPulledSha) branchStatus = "in_sync"
      else if (connection.lastPushedSha || connection.lastPulledSha) branchStatus = "behind"
      else branchStatus = "connected"
    } catch {
      branchStatus = "connected"
    }
  } else if (connection) {
    branchStatus = "connected"
  }

  return {
    branchStatus,
    branchInfo,
    metafieldCount: currentSnapshot.metafieldDefinitions.length,
    metaobjectCount: currentSnapshot.metaobjectDefinitions.length,
    recentLogs,
    isConnected: !!connection,
  }
}

export default function Dashboard() {
  const { branchStatus, branchInfo, metafieldCount, metaobjectCount, recentLogs, isConnected } =
    useLoaderData<typeof loader>()

  const [showNotConnectedBanner, setShowNotConnectedBanner] = useState(true)
  const [showUpdatesBanner, setShowUpdatesBanner] = useState(true)
  const totalDefinitions = metafieldCount + metaobjectCount

  return (
    <s-page heading="Dashboard">
      <div style={{ display: "flex", flexDirection: "column", gap: "48px" }}>

        {!isConnected && showNotConnectedBanner && (
          <s-banner
            tone="warning"
            heading="GitHub not connected"
            onDismiss={() => setShowNotConnectedBanner(false)}
          >
            Connect to GitHub to start syncing definitions.{" "}
            <s-link href="/app/settings">Set up GitHub</s-link>
          </s-banner>
        )}

        {branchStatus === "behind" && showUpdatesBanner && (
          <s-banner
            tone="info"
            heading="Updates available"
            onDismiss={() => setShowUpdatesBanner(false)}
          >
            Your branch has new changes.{" "}
            <s-link href="/app/sync">Sync changes</s-link>
          </s-banner>
        )}

        {/* Stats */}
        <div>
          <div style={sectionHeader}>
            <h2 style={sectionTitle}>Overview</h2>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={statCard}>
              <div style={statLabel}>Total</div>
              <div style={statValue}>{totalDefinitions}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Metafields</div>
              <div style={statValue}>{metafieldCount}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Metaobjects</div>
              <div style={statValue}>{metaobjectCount}</div>
            </div>
          </div>
        </div>

        {/* Sync Status */}
        {isConnected && branchInfo && (
          <div>
            <div style={sectionHeader}>
              <h2 style={sectionTitle}>Sync Status</h2>
            </div>
            <div style={card}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#111" }}>
                    {branchInfo.owner}/{branchInfo.repo}
                  </div>
                  <div style={{ fontSize: "13px", color: "#666", marginTop: "4px" }}>
                    Branch: <code style={{ fontSize: "12px", backgroundColor: "#f5f5f5", padding: "2px 6px", borderRadius: "4px" }}>{branchInfo.branch}</code>
                  </div>
                </div>
                <Badge
                  tone={branchStatus === "in_sync" ? "success" : branchStatus === "behind" ? "warning" : "info"}
                >
                  {branchStatus === "in_sync" ? "In sync" : branchStatus === "behind" ? "Updates available" : "Connected"}
                </Badge>
              </div>
            </div>
          </div>
        )}

        {/* Activity */}
        {recentLogs.length > 0 && (
          <div>
            <div style={sectionHeader}>
              <h2 style={sectionTitle}>Recent Activity</h2>
            </div>
            <div style={{ ...card, padding: 0 }}>
              {recentLogs.map((log, index) => (
                <div
                  key={log.id}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "16px 24px",
                    borderBottom: index < recentLogs.length - 1 ? "1px solid #eaeaea" : "none",
                  }}
                >
                  <Badge tone={log.action === "push" ? "info" : "success"}>
                    {log.action.toUpperCase()}
                  </Badge>
                  <span style={{ flex: 1, fontSize: "14px", color: "#333" }}>{log.summary}</span>
                  <span style={{ fontSize: "13px", color: "#999" }}>
                    {new Date(log.createdAt).toLocaleDateString()}{" "}
                    {new Date(log.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </s-page>
  )
}

const sectionHeader: React.CSSProperties = {
  marginBottom: "16px",
}

const sectionTitle: React.CSSProperties = {
  fontSize: "14px",
  fontWeight: 600,
  color: "#666",
  margin: 0,
  textTransform: "uppercase",
  letterSpacing: "0.05em",
}

const card: React.CSSProperties = {
  border: "1px solid #eaeaea",
  borderRadius: "8px",
  backgroundColor: "#fff",
  padding: "24px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
}

const statCard: React.CSSProperties = {
  border: "1px solid #eaeaea",
  borderRadius: "8px",
  backgroundColor: "#fff",
  padding: "24px",
  boxShadow: "0 2px 4px rgba(0, 0, 0, 0.04)",
}

const statLabel: React.CSSProperties = {
  fontSize: "13px",
  fontWeight: 500,
  color: "#666",
  marginBottom: "8px",
}

const statValue: React.CSSProperties = {
  fontSize: "36px",
  fontWeight: 700,
  color: "#111",
  lineHeight: 1,
  letterSpacing: "-0.02em",
}
