import { useState, useEffect } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { useLoaderData, useFetcher, Link } from "react-router"
import { useAppBridge } from "@shopify/app-bridge-react"
import { authenticate } from "../shopify.server"
import prisma from "../db.server"
import { decrypt } from "../services/encryption.server"
import * as github from "../services/github.server"
import {
  capture,
  diff,
  parse,
  summarizeDiff,
  generateCommitMessage,
} from "../services/snapshot.server"
import type { SnapshotDiff } from "../types/definitions"
import { Section, Stack, Button, TextArea, Card, EmptyState, Badge } from "../components"
import { DiffViewer } from "../components/diff-viewer"

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  const shop = session.shop

  const connection = await prisma.gitHubConnection.findUnique({ where: { shop } })
  if (!connection || !connection.repo) {
    return { connected: false as const }
  }

  const token = await decrypt(connection.accessToken)
  const currentSnapshot = await capture(admin, shop)

  const remoteFile = await github.readFile(
    token, connection.owner, connection.repo, connection.branch, connection.filePath,
  )

  let diffResult: SnapshotDiff | null = null
  let remoteSha: string | null = null

  if (remoteFile) {
    const remoteSnapshot = parse(remoteFile.content)
    diffResult = diff(currentSnapshot, remoteSnapshot)
    remoteSha = remoteFile.sha

    // If no changes detected but remote SHA differs from our records, update lastPushedSha
    // This prevents false "behind" status when content is actually in sync
    const hasChanges = diffResult.added.length > 0 || diffResult.modified.length > 0 || diffResult.removed.length > 0
    if (!hasChanges && remoteFile.sha !== connection.lastPushedSha && remoteFile.sha !== connection.lastPulledSha) {
      await prisma.gitHubConnection.update({
        where: { shop },
        data: { lastPushedSha: remoteFile.sha },
      })
    }
  }

  const hasChanges = !remoteFile
    || (diffResult && (diffResult.added.length > 0 || diffResult.modified.length > 0 || diffResult.removed.length > 0))

  return {
    connected: true as const,
    branch: connection.branch,
    owner: connection.owner,
    repo: connection.repo,
    hasChanges,
    isFirstPush: !remoteFile,
    diffResult,
    remoteSha,
    snapshotJson: JSON.stringify(currentSnapshot, null, 2),
    summary: diffResult ? summarizeDiff(diffResult) : "Initial push",
    defaultMessage: diffResult ? generateCommitMessage(diffResult) : "MetaForm: Initial definitions push",
    metafieldCount: currentSnapshot.metafieldDefinitions.length,
    metaobjectCount: currentSnapshot.metaobjectDefinitions.length,
  }
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { session } = await authenticate.admin(request)
  const shop = session.shop
  const formData = await request.formData()

  const snapshotJson = formData.get("snapshotJson") as string
  const commitMessage = formData.get("commitMessage") as string
  const remoteSha = formData.get("remoteSha") as string | null

  const connection = await prisma.gitHubConnection.findUnique({ where: { shop } })
  if (!connection) return { error: "Not connected to GitHub" }

  const token = await decrypt(connection.accessToken)

  try {
    const result = await github.writeFile(
      token,
      connection.owner,
      connection.repo,
      connection.branch,
      connection.filePath,
      snapshotJson,
      commitMessage,
      remoteSha || undefined,
    )

    await prisma.gitHubConnection.update({
      where: { shop },
      data: { lastPushedSha: result.commitSha },
    })

    await prisma.syncLog.create({
      data: {
        shop,
        action: "push",
        commitSha: result.commitSha,
        summary: commitMessage.split("\n")[0],
      },
    })

    return {
      success: true,
      commitSha: result.commitSha,
      commitUrl: result.commitUrl,
    }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Push failed" }
  }
}

export default function PushPage() {
  const data = useLoaderData<typeof loader>()
  const fetcher = useFetcher<typeof action>()
  const shopify = useAppBridge()

  if (!data.connected) {
    return (
      <s-page heading="Push to GitHub">
        <s-banner tone="warning" heading="Not connected">
          Connect to GitHub first to push definitions.{" "}
          <s-link href="/app/settings">Go to Settings</s-link>
        </s-banner>
      </s-page>
    )
  }

  const {
    branch,
    owner,
    repo,
    hasChanges,
    isFirstPush,
    diffResult,
    remoteSha,
    snapshotJson,
    defaultMessage,
    metafieldCount,
    metaobjectCount,
  } = data

  const [commitMessage, setCommitMessage] = useState(defaultMessage)
  const [showSuccessBanner, setShowSuccessBanner] = useState(true)
  const [showErrorBanner, setShowErrorBanner] = useState(true)
  const [showInfoBanner, setShowInfoBanner] = useState(true)

  const isLoading = fetcher.state !== "idle"
  const pushResult = fetcher.data

  // Auto-dismiss success banner after 5 seconds
  useEffect(() => {
    if (pushResult && "success" in pushResult && pushResult.success && showSuccessBanner) {
      const timer = setTimeout(() => {
        setShowSuccessBanner(false)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [pushResult, showSuccessBanner])

  const handlePush = () => {
    fetcher.submit(
      {
        snapshotJson,
        commitMessage,
        ...(remoteSha ? { remoteSha } : {}),
      },
      { method: "POST" }
    )
    shopify.toast.show("Pushing definitions to GitHub...")
  }

  if (pushResult && "success" in pushResult && pushResult.success) {
    return (
      <s-page heading="Push to GitHub">
        <Stack direction="vertical" gap="xl">
          {showSuccessBanner && (
            <s-banner
              tone="success"
              heading="Pushed successfully"
              onDismiss={() => setShowSuccessBanner(false)}
            >
              Definitions committed to {branch} on {owner}/{repo}.
            </s-banner>
          )}

          <Card padding="large">
            <Stack direction="vertical" gap="base">
              <div style={{ fontSize: "16px", fontWeight: 600 }}>What's next?</div>
              {pushResult.commitUrl && (
                <a
                  href={pushResult.commitUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: "var(--s-color-interactive, #2c6ecb)", textDecoration: "none" }}
                >
                  View commit on GitHub →
                </a>
              )}
              <Stack direction="horizontal" gap="base">
                <Link to="/app" style={{ textDecoration: "none" }}>
                  <Button variant="primary">Back to Dashboard</Button>
                </Link>
                <Link to="/app/settings" style={{ textDecoration: "none" }}>
                  <Button variant="secondary">Create PR</Button>
                </Link>
              </Stack>
            </Stack>
          </Card>
        </Stack>
      </s-page>
    )
  }

  return (
    <s-page heading="Push to GitHub">
      <Stack direction="vertical" gap="xl">
        {pushResult && "error" in pushResult && showErrorBanner && (
          <s-banner
            tone="critical"
            heading="Push failed"
            onDismiss={() => setShowErrorBanner(false)}
          >
            {pushResult.error}
          </s-banner>
        )}

        <Section
          title="Target Repository"
          description={`Push current definitions to ${owner}/${repo} on branch ${branch}`}
        >
          <Card padding="medium">
            <Stack direction="horizontal" gap="lg" wrap>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>
                  {metafieldCount}
                </div>
                <div style={{ fontSize: "14px", color: "var(--s-color-text-secondary, #6d7175)" }}>
                  Metafield Definitions
                </div>
              </div>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "32px", fontWeight: 700, marginBottom: "4px" }}>
                  {metaobjectCount}
                </div>
                <div style={{ fontSize: "14px", color: "var(--s-color-text-secondary, #6d7175)" }}>
                  Metaobject Definitions
                </div>
              </div>
            </Stack>
          </Card>
        </Section>

        {!hasChanges ? (
          <Section>
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="Everything is up to date"
              description="The branch matches your store. No changes to push."
            />
          </Section>
        ) : (
          <>
            {isFirstPush && showInfoBanner && (
              <s-banner
                tone="info"
                heading="First push"
                onDismiss={() => setShowInfoBanner(false)}
              >
                All {metafieldCount + metaobjectCount} definitions will be committed to the repository.
              </s-banner>
            )}

            {diffResult && !isFirstPush && (
              <Section title="Changes Preview" description="Review what will be committed">
                <DiffViewer diff={diffResult} collapsible />
              </Section>
            )}

            <Section title="Commit Message" description="Describe your changes">
              <TextArea
                label="Message"
                value={commitMessage}
                onChange={setCommitMessage}
                rows={6}
                helperText="First line is the summary. Add more details below if needed."
              />
            </Section>

            <Section>
              <Stack direction="horizontal" gap="base">
                <Button variant="primary" onClick={handlePush} loading={isLoading}>
                  Push to {branch}
                </Button>
                <Link to="/app" style={{ textDecoration: "none" }}>
                  <Button variant="secondary">Cancel</Button>
                </Link>
              </Stack>
            </Section>
          </>
        )}
      </Stack>
    </s-page>
  )
}
