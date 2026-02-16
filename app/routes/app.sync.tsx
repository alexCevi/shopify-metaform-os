import { useState, useEffect } from "react"
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router"
import { useLoaderData, useFetcher, Link, useRevalidator, useNavigation } from "react-router"
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
  buildReconciledSnapshot,
  generateCommitMessage,
} from "../services/snapshot.server"
import type { SnapshotDiff } from "../types/definitions"
import { isMetafieldDef, isMetaobjectDef } from "../types/definitions"
import type { MetafieldDefRecord, MetaobjectDefRecord } from "../types/definitions"
import * as metafieldService from "../services/metafield-definitions.server"
import * as metaobjectService from "../services/metaobject-definitions.server"
import { Section, Stack, Button, Card, EmptyState, Badge, TextField } from "../components"
import { ExpandableTable } from "../components/ui/expandable-table"
import {
  metafieldColumns,
  metaobjectColumns,
  renderMetafieldExpanded,
  renderMetaobjectExpanded,
} from "../utils/definitions-table-config"
import { metafieldAccessForApi, metaobjectAccessForApi } from "../utils/definition-access"
import { colors } from "../styles/design-tokens"

function showToast(
  shopify: ReturnType<typeof useAppBridge>,
  message: string,
) {
  if (typeof window === "undefined") return
  shopify.toast.show(message)
}

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  const shop = session.shop

  const connection = await prisma.gitHubConnection.findUnique({ where: { shop } })
  if (!connection) {
    return { configured: false as const, connected: false as const }
  }

  const hasLowerEnv =
    connection.lowerEnvOwner &&
    connection.lowerEnvRepo &&
    connection.lowerEnvBranch

  if (!hasLowerEnv) {
    return { configured: false as const, connected: true as const }
  }

  const token = await decrypt(connection.accessToken)
  const lowerEnvPath = connection.lowerEnvFilePath ?? connection.filePath

  const [remoteFile, lastCommit, currentSnapshot] = await Promise.all([
    github.readFile(
      token,
      connection.lowerEnvOwner!,
      connection.lowerEnvRepo!,
      connection.lowerEnvBranch!,
      lowerEnvPath,
    ),
    github.getLastCommitForPath(
      token,
      connection.lowerEnvOwner!,
      connection.lowerEnvRepo!,
      connection.lowerEnvBranch!,
      lowerEnvPath,
    ),
    capture(admin, shop),
  ])

  if (!remoteFile) {
    return {
      configured: true as const,
      connected: true as const,
      lowerEnvOwner: connection.lowerEnvOwner!,
      lowerEnvRepo: connection.lowerEnvRepo!,
      lowerEnvBranch: connection.lowerEnvBranch!,
      lowerEnvLastUpdated: null,
      hasRemoteFile: false,
      diffResult: null,
      summary: null,
      lowerEnvSnapshotJson: null,
    }
  }

  const lowerEnvSnapshot = parse(remoteFile.content)
  const diffResult = diff(lowerEnvSnapshot, currentSnapshot)
  const hasChanges =
    diffResult.added.length > 0 || diffResult.modified.length > 0
  const lowerEnvFilePath = connection.lowerEnvFilePath ?? connection.filePath

  return {
    configured: true as const,
    connected: true as const,
    lowerEnvOwner: connection.lowerEnvOwner!,
    lowerEnvRepo: connection.lowerEnvRepo!,
    lowerEnvBranch: connection.lowerEnvBranch!,
    lowerEnvFilePath,
    lowerEnvLastUpdated: lastCommit?.date ?? null,
    lowerEnvLastCommitSha: lastCommit?.sha ?? null,
    hasRemoteFile: true,
    diffResult: hasChanges ? diffResult : null,
    summary: hasChanges ? summarizeDiff(diffResult) : null,
    lowerEnvSnapshotJson: JSON.stringify(lowerEnvSnapshot),
  }
}

interface ApplyStep {
  key: string
  action: string
  status: "success" | "failed"
  error?: string
}

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request)
  const shop = session.shop

  const connection = await prisma.gitHubConnection.findUnique({ where: { shop } })
  if (!connection) return { error: "Not connected to GitHub" }

  const hasLowerEnv =
    connection.lowerEnvOwner &&
    connection.lowerEnvRepo &&
    connection.lowerEnvBranch
  if (!hasLowerEnv) return { error: "Sync source not configured" }

  const formData = await request.formData()
  const intent = formData.get("intent") as string | null

  if (intent === "create_branch_and_pr") {
    const lowerEnvSnapshotJson = formData.get("lowerEnvSnapshotJson") as string
    const newBranchName = (formData.get("newBranchName") as string)?.trim()
    const baseBranch = (formData.get("baseBranch") as string)?.trim() || connection.lowerEnvBranch!
    const prTitle = (formData.get("prTitle") as string)?.trim()

    if (!lowerEnvSnapshotJson) return { error: "Missing source snapshot", intent: "create_branch_and_pr" }
    if (!newBranchName) return { error: "Branch name is required", intent: "create_branch_and_pr" }
    if (!prTitle) return { error: "PR title is required", intent: "create_branch_and_pr" }

    const token = await decrypt(connection.accessToken)
    const owner = connection.lowerEnvOwner!
    const repo = connection.lowerEnvRepo!
    const filePath = connection.lowerEnvFilePath ?? connection.filePath

    const sourceSnapshot = parse(lowerEnvSnapshotJson)
    const currentSnapshot = await capture(admin, shop)
    const diffResult = diff(sourceSnapshot, currentSnapshot)
    const reconciled = buildReconciledSnapshot(currentSnapshot, sourceSnapshot, diffResult)
    const reconciledJson = JSON.stringify(reconciled, null, 2)

    const baseSha = await github.getBranchSha(token, owner, repo, baseBranch)
    if (!baseSha) return { error: `Base branch "${baseBranch}" not found`, intent: "create_branch_and_pr" }

    await github.createBranch(token, owner, repo, baseSha, newBranchName)

    const fileShaOnNewBranch = await github.getLatestFileSha(
      token,
      owner,
      repo,
      newBranchName,
      filePath,
    )

    await github.writeFile(
      token,
      owner,
      repo,
      newBranchName,
      filePath,
      reconciledJson,
      `MetaForm: Sync definitions – ${generateCommitMessage(diffResult).split("\n")[0]}`,
      fileShaOnNewBranch ?? undefined,
    )
    const pr = await github.createPullRequest(
      token,
      owner,
      repo,
      newBranchName,
      baseBranch,
      prTitle,
      `Reconciled definitions from sync (${diffResult.added.length} added, ${diffResult.modified.length} modified).`,
    )
    return {
      success: true,
      intent: "create_branch_and_pr" as const,
      prUrl: pr.htmlUrl,
      prNumber: pr.number,
      branchName: newBranchName,
    }
  }

  const lowerEnvSnapshotJson = formData.get("lowerEnvSnapshotJson") as string

  if (!lowerEnvSnapshotJson) return { error: "Missing source snapshot" }

  const remoteSnapshot = parse(lowerEnvSnapshotJson)
  const currentSnapshot = await capture(admin, shop)
  const diffResult = diff(remoteSnapshot, currentSnapshot)

  const steps: ApplyStep[] = []

  // Separate metaobjects and metafields from added and modified entries
  const addedMetaobjects = diffResult.added.filter((entry) => isMetaobjectDef(entry.source))
  const addedMetafields = diffResult.added.filter((entry) => isMetafieldDef(entry.source))
  const modifiedMetaobjects = diffResult.modified.filter((entry) => isMetaobjectDef(entry.source))
  const modifiedMetafields = diffResult.modified.filter((entry) => isMetafieldDef(entry.source))

  // Step 1: Create metaobject definitions first (they may be referenced by metafield validations)
  for (const entry of addedMetaobjects) {
    try {
      const def = entry.source as MetaobjectDefRecord
      await metaobjectService.createDefinition(admin, {
        type: def.type,
        name: def.name,
        description: def.description ?? undefined,
        displayNameKey: def.displayNameKey ?? undefined,
        access: metaobjectAccessForApi(def.type, def.access),
        capabilities: {
          publishable: { enabled: def.capabilities.publishable },
          translatable: { enabled: def.capabilities.translatable },
          renderable: { enabled: def.capabilities.renderable },
        },
        fieldDefinitions: def.fieldDefinitions.map((f) => ({
          key: f.key,
          name: f.name,
          type: f.type,
          description: f.description ?? undefined,
          required: f.required,
          validations: f.validations.length > 0 ? f.validations : undefined,
        })),
      })
      steps.push({ key: entry.key, action: "created", status: "success" })
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "Unknown error"
      
      // Provide more helpful messages for common errors
      if (errorMessage.includes("valid metaobject definition")) {
        errorMessage = "References a metaobject definition that doesn't exist in this store. Create the metaobject definition first."
      } else if (errorMessage.includes("already exists")) {
        errorMessage = "A metaobject definition with this type already exists in this store."
      }
      
      steps.push({
        key: entry.key,
        action: "created",
        status: "failed",
        error: errorMessage,
      })
    }
  }

  // Step 2: Update metaobject definitions (before creating metafields that might reference them)
  for (const entry of modifiedMetaobjects) {
    try {
      const def = entry.source as MetaobjectDefRecord
      const existing = await metaobjectService.getByType(admin, def.type)
      if (!existing) {
        steps.push({ key: entry.key, action: "updated", status: "failed", error: "Metaobject definition not found in this store." })
        continue
      }

      const targetDef = entry.target as MetaobjectDefRecord
      const targetFieldKeys = new Set(targetDef.fieldDefinitions.map((f) => f.key))
      const sourceFieldKeys = new Set(def.fieldDefinitions.map((f) => f.key))

      const fieldOps: Array<{
        create?: { key: string; name: string; type: string; description?: string; required?: boolean }
        update?: { key: string; name?: string; description?: string; required?: boolean }
        delete?: { key: string }
      }> = []

      for (const f of def.fieldDefinitions) {
        if (!targetFieldKeys.has(f.key)) {
          fieldOps.push({ create: { key: f.key, name: f.name, type: f.type, description: f.description ?? undefined, required: f.required } })
        } else {
          fieldOps.push({ update: { key: f.key, name: f.name, description: f.description ?? undefined, required: f.required } })
        }
      }

      for (const f of targetDef.fieldDefinitions) {
        if (!sourceFieldKeys.has(f.key)) {
          fieldOps.push({ delete: { key: f.key } })
        }
      }

      await metaobjectService.updateDefinition(admin, existing.id, {
        name: def.name,
        description: def.description ?? undefined,
        displayNameKey: def.displayNameKey ?? undefined,
        access: metaobjectAccessForApi(def.type, def.access),
        capabilities: {
          publishable: { enabled: def.capabilities.publishable },
          translatable: { enabled: def.capabilities.translatable },
          renderable: { enabled: def.capabilities.renderable },
        },
        fieldDefinitions: fieldOps.length > 0 ? fieldOps : undefined,
      })
      steps.push({ key: entry.key, action: "updated", status: "success" })
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "Unknown error"
      
      // Provide more helpful messages for common errors
      if (errorMessage.includes("valid metaobject definition")) {
        errorMessage = "References a metaobject definition that doesn't exist in this store. Create the metaobject definition first."
      } else if (errorMessage.includes("Definition not found")) {
        errorMessage = "Metaobject definition not found in this store."
      }
      
      steps.push({
        key: entry.key,
        action: "updated",
        status: "failed",
        error: errorMessage,
      })
    }
  }

  // Step 3: Create metafield definitions (which may reference metaobjects)
  for (const entry of addedMetafields) {
    try {
      const def = entry.source as MetafieldDefRecord
      await metafieldService.createDefinition(admin, {
        name: def.name,
        namespace: def.namespace,
        key: def.key,
        type: def.type,
        ownerType: def.ownerType,
        description: def.description ?? undefined,
        access: metafieldAccessForApi(def.namespace, def.access),
        validations: def.validations.length > 0 ? def.validations : undefined,
      })
      steps.push({ key: entry.key, action: "created", status: "success" })
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "Unknown error"
      
      // Provide more helpful message for metaobject reference errors
      if (errorMessage.includes("valid metaobject definition")) {
        errorMessage = "References a metaobject definition that doesn't exist in this store. Create the metaobject definition first."
      }
      
      steps.push({
        key: entry.key,
        action: "created",
        status: "failed",
        error: errorMessage,
      })
    }
  }

  // Step 4: Update metafield definitions
  for (const entry of modifiedMetafields) {
    try {
      const def = entry.source as MetafieldDefRecord
      await metafieldService.updateDefinition(admin, {
        namespace: def.namespace,
        key: def.key,
        ownerType: def.ownerType,
        name: def.name,
        description: def.description ?? undefined,
        access: metafieldAccessForApi(def.namespace, def.access),
        validations: def.validations.length > 0 ? def.validations : undefined,
      })
      steps.push({ key: entry.key, action: "updated", status: "success" })
    } catch (err) {
      let errorMessage = err instanceof Error ? err.message : "Unknown error"
      
      // Provide more helpful message for metaobject reference errors
      if (errorMessage.includes("valid metaobject definition")) {
        errorMessage = "References a metaobject definition that doesn't exist in this store. Create the metaobject definition first."
      }
      
      steps.push({
        key: entry.key,
        action: "updated",
        status: "failed",
        error: errorMessage,
      })
    }
  }

  const successCount = steps.filter((s) => s.status === "success").length
  const failedCount = steps.filter((s) => s.status === "failed").length

  await prisma.syncLog.create({
    data: {
      shop,
      action: "sync_lower_env",
      summary: `Synced from source: ${successCount} succeeded, ${failedCount} failed`,
      detail: JSON.stringify(steps),
    },
  })

  return { success: true, steps }
}

export default function SyncDataPage() {
  const data = useLoaderData<typeof loader>()
  const fetcher = useFetcher<typeof action>()
  const prFetcher = useFetcher<typeof action>()
  const revalidator = useRevalidator()
  const navigation = useNavigation()
  const shopify = useAppBridge()

  const [showSuccessBanner, setShowSuccessBanner] = useState(true)
  const [showErrorBanner, setShowErrorBanner] = useState(true)
  const [wasChecking, setWasChecking] = useState(false)

  const isReloading = revalidator.state === "loading" || navigation.state === "loading"

  useEffect(() => {
    if (fetcher.data && "success" in fetcher.data && fetcher.data.success && showSuccessBanner) {
      const timer = setTimeout(() => setShowSuccessBanner(false), 5000)
      return () => clearTimeout(timer)
    }
  }, [fetcher.data, showSuccessBanner])

  // When user clicks "Check for Updates", mark that we're checking
  useEffect(() => {
    if (isReloading) setWasChecking(true)
  }, [isReloading])

  // When check completes, show feedback toast and clear wasChecking
  useEffect(() => {
    if (!isReloading && wasChecking) {
      setWasChecking(false)
      if (!data.configured || !data.connected) return
      const d = data as { hasRemoteFile?: boolean; diffResult?: SnapshotDiff | null }
      if (!d.hasRemoteFile) {
        showToast(shopify, "No definitions file in source.")
      } else if (!d.diffResult) {
        showToast(shopify, "You're up to date. No changes from source.")
      } else {
        const total = d.diffResult.added.length + d.diffResult.modified.length
        showToast(shopify, `${total} change${total !== 1 ? "s" : ""} available from source.`)
      }
    }
  }, [isReloading, wasChecking, data, shopify])

  if (!data.connected) {
    return (
      <s-page heading="Sync Data">
        <s-banner tone="warning" heading="Not connected">
          Connect to GitHub first.{" "}
          <s-link href="/app/settings">Go to Settings</s-link>
        </s-banner>
      </s-page>
    )
  }

  if (!data.configured) {
    return (
      <s-page heading="Sync Data">
        <Section>
          <EmptyState
            icon={
            <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          }
          title="Sync source not configured"
          description="Set a repository and branch in Settings to compare definitions with and sync to this store."
          action={
            <Link to="/app/settings" style={{ textDecoration: "none" }}>
              <Button variant="primary">Go to Settings</Button>
            </Link>
          }
          />
        </Section>
      </s-page>
    )
  }

  const {
    lowerEnvOwner,
    lowerEnvRepo,
    lowerEnvBranch,
    lowerEnvFilePath,
    lowerEnvLastUpdated,
    hasRemoteFile,
    diffResult,
    summary,
    lowerEnvSnapshotJson,
  } = data

  const isLoading = fetcher.state !== "idle"
  const syncResult = fetcher.data

  if (syncResult && "success" in syncResult && syncResult.success) {
    const steps = syncResult.steps as ApplyStep[]
    const succeeded = steps.filter((s) => s.status === "success")
    const failed = steps.filter((s) => s.status === "failed")

    return (
      <s-page heading="Sync Data">
        <Stack direction="vertical" gap="xl">
          {/* Header with status, refresh button and last updated info */}
          <div style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center",
            padding: "16px",
            background: colors.bg.subdued,
            borderRadius: "8px",
            border: `1px solid ${colors.border.subdued}`
          }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                <span style={{ fontSize: "14px", fontWeight: 600 }}>
                  Sync Source
                </span>
                {!isReloading && (
                  <span
                    style={{
                      fontSize: "12px",
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: `1px solid ${colors.border.success}`,
                      background: colors.bg.surface,
                      color: colors.text.success,
                    }}
                  >
                    Sync complete
                  </span>
                )}
              </div>
              <div style={{ fontSize: "13px", color: colors.text.secondary }}>
                {lowerEnvOwner}/{lowerEnvRepo} @ {lowerEnvBranch}
              </div>
              {lowerEnvLastUpdated && (
                <div style={{ fontSize: "12px", color: colors.text.secondary, marginTop: "4px" }}>
                  Source last updated: {new Date(lowerEnvLastUpdated).toLocaleString()}
                </div>
              )}
            </div>
            <Button
              variant="secondary"
              onClick={() => {
                revalidator.revalidate()
                showToast(shopify, "Checking for updates...")
              }}
              loading={isReloading}
              icon={
                <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                  <path fillRule="evenodd" d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.417A6 6 0 118 2v1z" />
                  <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z" />
                </svg>
              }
            >
              Check for Updates
            </Button>
          </div>

          {showSuccessBanner && (
            <s-banner
              tone="success"
              heading="Sync complete"
              onDismiss={() => setShowSuccessBanner(false)}
            >
              Successfully applied changes from {lowerEnvRepo} @ {lowerEnvBranch}.
            </s-banner>
          )}

          <Section title="Results Summary">
            <Card padding="medium">
              <Stack direction="horizontal" gap="lg" wrap>
                {succeeded.length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: colors.text.success, marginBottom: "4px" }}>
                      {succeeded.length}
                    </div>
                    <div style={{ fontSize: "14px" }}>Applied</div>
                  </div>
                )}
                {failed.length > 0 && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: 700, color: colors.text.critical, marginBottom: "4px" }}>
                      {failed.length}
                    </div>
                    <div style={{ fontSize: "14px" }}>Failed</div>
                  </div>
                )}
              </Stack>
            </Card>
          </Section>

          <Section title="Detailed Results">
            <Card padding="none">
              <Stack direction="vertical" gap="none">
                {steps.map((step, index) => (
                  <div
                    key={step.key}
                    style={{
                      padding: "16px",
                      borderBottom: index < steps.length - 1 ? `1px solid ${colors.border.subdued}` : "none",
                    }}
                  >
                    <Stack direction="horizontal" gap="base" align="center">
                      <Badge
                        tone={step.status === "success" ? "success" : "critical"}
                      >
                        {step.action.toUpperCase()}
                      </Badge>
                      <code style={{ flex: 1, fontSize: "13px" }}>{step.key}</code>
                      {step.error && (
                        <span style={{ fontSize: "13px", color: colors.text.critical }}>
                          {step.error}
                        </span>
                      )}
                    </Stack>
                  </div>
                ))}
              </Stack>
            </Card>
          </Section>

          <Section>
            <Link to="/app" style={{ textDecoration: "none" }}>
              <Button variant="primary">Back to Dashboard</Button>
            </Link>
          </Section>
        </Stack>
      </s-page>
    )
  }

  return (
    <s-page heading="Sync Data">
      <Stack direction="vertical" gap="xl">
        {/* Header with status, refresh button and last updated info */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "16px",
          background: colors.bg.subdued,
          borderRadius: "8px",
          border: `1px solid ${colors.border.subdued}`
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <span style={{ fontSize: "14px", fontWeight: 600 }}>
                Sync Source
              </span>
              {!isReloading && (
                <span
                  style={{
                    fontSize: "12px",
                    fontWeight: 500,
                    padding: "2px 8px",
                    borderRadius: "4px",
                    border: `1px solid ${!hasRemoteFile ? colors.border.base : diffResult ? colors.border.base : colors.border.success}`,
                    background: colors.bg.surface,
                    color: !hasRemoteFile
                      ? colors.text.warning
                      : diffResult
                        ? colors.text.info
                        : colors.text.success,
                  }}
                >
                  {!hasRemoteFile
                    ? "No file in source"
                    : diffResult
                      ? `${diffResult.added.length + diffResult.modified.length} changes available`
                      : "Up to date"}
                </span>
              )}
            </div>
            <div style={{ fontSize: "13px", color: colors.text.secondary }}>
              {lowerEnvOwner}/{lowerEnvRepo} @ {lowerEnvBranch}
            </div>
            {lowerEnvLastUpdated && (
              <div style={{ fontSize: "12px", color: colors.text.secondary, marginTop: "4px" }}>
                Source last updated: {new Date(lowerEnvLastUpdated).toLocaleString()}
              </div>
            )}
          </div>
          <Button
            variant="secondary"
            onClick={() => {
              revalidator.revalidate()
              showToast(shopify, "Checking for updates...")
            }}
            loading={isReloading}
            icon={
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path fillRule="evenodd" d="M8 3a5 5 0 104.546 2.914.5.5 0 01.908-.417A6 6 0 118 2v1z" />
                <path d="M8 4.466V.534a.25.25 0 01.41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 018 4.466z" />
              </svg>
            }
          >
            Check for Updates
          </Button>
        </div>

        {syncResult && "error" in syncResult && showErrorBanner && (
          <s-banner
            tone="critical"
            heading="Sync failed"
            onDismiss={() => setShowErrorBanner(false)}
          >
            {syncResult.error}
          </s-banner>
        )}

        {/* <Section
          title="Sync source"
          description={`${lowerEnvOwner}/${lowerEnvRepo} @ ${lowerEnvBranch}`}
        >
          {lowerEnvLastUpdated && (
            <div style={{ fontSize: "13px", color: colors.text.secondary, marginBottom: "8px" }}>
              Last updated at {new Date(lowerEnvLastUpdated).toLocaleString()}
            </div>
          )}
        </Section> */}

        {isReloading ? (
          <LoadingSkeleton />
        ) : !hasRemoteFile ? (
          <Section>
            <EmptyState
              icon={
                <svg width="48" height="48" viewBox="0 0 20 20" fill="currentColor">
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              }
              title="No definitions file in source"
              description="No definitions file found on the selected branch."
            />
          </Section>
        ) : !diffResult ? (
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
              title="Already up to date"
              description="Your store already matches the source. No changes to sync."
            />
          </Section>
        ) : (
          <SyncDiffPreview
            diff={diffResult}
            summary={summary}
            isLoading={isLoading}
            lowerEnvSnapshotJson={lowerEnvSnapshotJson!}
            lowerEnvBranch={lowerEnvBranch}
            onSync={() => {
              fetcher.submit(
                { lowerEnvSnapshotJson: lowerEnvSnapshotJson! },
                { method: "POST" }
              )
              showToast(shopify, "Syncing from source...")
            }}
            prFetcher={prFetcher}
            shopify={shopify}
          />
        )}
      </Stack>
    </s-page>
  )
}

function SyncDiffPreview({
  diff,
  summary,
  isLoading,
  lowerEnvSnapshotJson,
  lowerEnvBranch,
  onSync,
  prFetcher,
  shopify,
}: {
  diff: SnapshotDiff
  summary: string | null
  isLoading: boolean
  lowerEnvSnapshotJson: string
  lowerEnvBranch: string
  onSync: () => void
  prFetcher: ReturnType<typeof useFetcher<typeof action>>
  shopify: ReturnType<typeof useAppBridge>
}) {
  const [newBranchName, setNewBranchName] = useState("")
  const [prTitle, setPrTitle] = useState("")

  const hasAddedOrModified = diff.added.length > 0 || diff.modified.length > 0
  const isPrSubmitting = prFetcher.state !== "idle"

  useEffect(() => {
    const d = prFetcher.data
    if (d && typeof d === "object" && "intent" in d && d.intent === "create_branch_and_pr") {
      if ("prUrl" in d && d.prUrl) {
        showToast(shopify, "Pull request created")
      } else if ("error" in d && d.error) {
        showToast(shopify, d.error as string)
      }
    }
  }, [prFetcher.data, shopify])

  const addedMetafields = diff.added
    .filter((entry) => isMetafieldDef(entry.source))
    .map((entry) => entry.source as MetafieldDefRecord)
  const addedMetaobjects = diff.added
    .filter((entry) => isMetaobjectDef(entry.source))
    .map((entry) => entry.source as MetaobjectDefRecord)
  const modifiedMetafields = diff.modified
    .filter((entry) => isMetafieldDef(entry.source))
    .map((entry) => entry.source as MetafieldDefRecord)
  const modifiedMetaobjects = diff.modified
    .filter((entry) => isMetaobjectDef(entry.source))
    .map((entry) => entry.source as MetaobjectDefRecord)

  return (
    <>
      <Section
        title="Changes from source"
        description={summary ?? "Review what will be applied to your store"}
      >
        <Stack direction="vertical" gap="xl">
          {addedMetafields.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text.secondary, marginBottom: "12px" }}>
                Added metafields ({addedMetafields.length})
              </div>
              <ExpandableTable
                columns={metafieldColumns}
                data={addedMetafields}
                keyExtractor={(def) => `${def.ownerType}:${def.namespace}:${def.key}`}
                renderExpandedContent={renderMetafieldExpanded}
                emptyMessage="No added metafields"
              />
            </div>
          )}
          {addedMetaobjects.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text.secondary, marginBottom: "12px" }}>
                Added metaobjects ({addedMetaobjects.length})
              </div>
              <ExpandableTable
                columns={metaobjectColumns}
                data={addedMetaobjects}
                keyExtractor={(def) => def.type}
                renderExpandedContent={renderMetaobjectExpanded}
                emptyMessage="No added metaobjects"
              />
            </div>
          )}
          {modifiedMetafields.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text.secondary, marginBottom: "12px" }}>
                Modified metafields ({modifiedMetafields.length})
              </div>
              <ExpandableTable
                columns={metafieldColumns}
                data={modifiedMetafields}
                keyExtractor={(def) => `${def.ownerType}:${def.namespace}:${def.key}`}
                renderExpandedContent={renderMetafieldExpanded}
                emptyMessage="No modified metafields"
              />
            </div>
          )}
          {modifiedMetaobjects.length > 0 && (
            <div>
              <div style={{ fontSize: "13px", fontWeight: 600, color: colors.text.secondary, marginBottom: "12px" }}>
                Modified metaobjects ({modifiedMetaobjects.length})
              </div>
              <ExpandableTable
                columns={metaobjectColumns}
                data={modifiedMetaobjects}
                keyExtractor={(def) => def.type}
                renderExpandedContent={renderMetaobjectExpanded}
                emptyMessage="No modified metaobjects"
              />
            </div>
          )}
        </Stack>
      </Section>

      <Section
        title="Create branch & open PR"
        description="Write reconciled definitions to a new branch and open a pull request to promote changes."
      >
        <Card padding="medium">
          <Stack direction="vertical" gap="lg">
            <TextField
              label="New branch name"
              value={newBranchName}
              onChange={setNewBranchName}
              placeholder="metaform/sync-definitions"
              helperText="Branch will be created from the sync source branch."
              required
            />
            <div>
              <div style={{ fontSize: "13px", fontWeight: 500, marginBottom: "6px", color: colors.text.secondary }}>
                Base branch
              </div>
              <code style={{ fontSize: "13px", padding: "6px 8px", background: colors.bg.subdued, borderRadius: "4px" }}>
                {lowerEnvBranch}
              </code>
            </div>
            <TextField
              label="PR title"
              value={prTitle}
              onChange={setPrTitle}
              placeholder="MetaForm: Sync definitions from source"
              required
            />
            <Button
              variant="secondary"
              onClick={() => {
                prFetcher.submit(
                  {
                    intent: "create_branch_and_pr",
                    lowerEnvSnapshotJson,
                    newBranchName,
                    baseBranch: lowerEnvBranch,
                    prTitle,
                  },
                  { method: "POST" },
                )
              }}
              loading={isPrSubmitting}
              disabled={!newBranchName.trim() || !prTitle.trim()}
            >
              Create branch & open PR
            </Button>
            {prFetcher.data && typeof prFetcher.data === "object" && "prUrl" in prFetcher.data && prFetcher.data.prUrl && (
              <div style={{ fontSize: "13px" }}>
                <s-link href={prFetcher.data.prUrl as string} target="_blank" rel="noopener noreferrer">
                  Open pull request →
                </s-link>
              </div>
            )}
          </Stack>
        </Card>
      </Section>

      <Section>
        <Stack direction="horizontal" gap="base">
          <Button
            variant="primary"
            onClick={onSync}
            loading={isLoading}
            disabled={!hasAddedOrModified}
          >
            Sync to this store
          </Button>
          <Link to="/app" style={{ textDecoration: "none" }}>
            <Button variant="secondary">Cancel</Button>
          </Link>
        </Stack>
      </Section>
    </>
  )
}

function LoadingSkeleton() {
  return (
    <Section title="Checking for updates...">
      <Card padding="medium">
        <Stack direction="vertical" gap="lg">
          {/* Skeleton for summary */}
          <div style={{ 
            height: "20px", 
            width: "60%", 
            background: colors.border.subdued,
            borderRadius: "4px",
            animation: "pulse 1.5s ease-in-out infinite"
          }} />
          
          {/* Skeleton for table rows */}
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ 
              display: "flex", 
              gap: "12px", 
              alignItems: "center",
              padding: "12px",
              border: `1px solid ${colors.border.subdued}`,
              borderRadius: "8px"
            }}>
              <div style={{ 
                height: "16px", 
                width: "100px", 
                background: colors.border.subdued,
                borderRadius: "4px",
                animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
              }} />
              <div style={{ 
                height: "16px", 
                flex: 1, 
                background: colors.border.subdued,
                borderRadius: "4px",
                animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
              }} />
              <div style={{ 
                height: "16px", 
                width: "80px", 
                background: colors.border.subdued,
                borderRadius: "4px",
                animation: `pulse 1.5s ease-in-out ${i * 0.1}s infinite`
              }} />
            </div>
          ))}
        </Stack>
      </Card>
      
      <style>{`
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.5;
          }
        }
      `}</style>
    </Section>
  )
}
