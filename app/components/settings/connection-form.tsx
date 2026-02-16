import { useState } from "react"
import { useFetcher } from "react-router"
import { TextField, Select, Checkbox, Button } from "../index"
import type { SelectOption } from "../index"

export interface ConnectionFormProps {
  connection: {
    owner: string
    repo: string | null
    branch: string | null
    filePath: string | null
    autoImport: boolean
    lowerEnvOwner: string | null
    lowerEnvRepo: string | null
    lowerEnvBranch: string | null
    lowerEnvFilePath: string | null
  }
  githubUser: { login: string } | null
  repos: Array<{ fullName: string; owner: string; name: string }>
  branches: Array<{ name: string }>
  lowerEnvBranches: Array<{ name: string }>
}

export function ConnectionForm({
  connection,
  githubUser,
  repos,
  branches: initialBranches,
  lowerEnvBranches: initialLowerEnvBranches,
}: ConnectionFormProps) {
  const fetcher = useFetcher()
  const lowerEnvFetcher = useFetcher()

  const [selectedRepo, setSelectedRepo] = useState(
    connection.repo ? `${connection.owner}/${connection.repo}` : ""
  )
  const [selectedBranch, setSelectedBranch] = useState(connection.branch ?? "main")
  const [filePath, setFilePath] = useState(connection.filePath ?? "metaform/definitions.json")
  const [autoImport, setAutoImport] = useState(connection.autoImport)
  const [selectedLowerEnvRepo, setSelectedLowerEnvRepo] = useState(
    connection.lowerEnvRepo && connection.lowerEnvOwner
      ? `${connection.lowerEnvOwner}/${connection.lowerEnvRepo}`
      : ""
  )
  const [selectedLowerEnvBranch, setSelectedLowerEnvBranch] = useState(
    connection.lowerEnvBranch ?? "main"
  )
  const [lowerEnvFilePath, setLowerEnvFilePath] = useState(
    connection.lowerEnvFilePath ?? connection.filePath ?? "metaform/definitions.json"
  )

  const branches =
    fetcher.data && "branches" in fetcher.data
      ? (fetcher.data.branches as Array<{ name: string }>)
      : initialBranches

  const lowerEnvBranches =
    lowerEnvFetcher.data && "lowerEnvBranches" in lowerEnvFetcher.data
      ? (lowerEnvFetcher.data.lowerEnvBranches as Array<{ name: string }>)
      : initialLowerEnvBranches

  const isLoading = fetcher.state !== "idle"
  const isLowerEnvLoading = lowerEnvFetcher.state !== "idle"

  const handleRepoChange = (repo: string) => {
    setSelectedRepo(repo)
    if (repo) fetcher.submit({ intent: "fetch_branches", repo }, { method: "POST" })
  }

  const handleLowerEnvRepoChange = (repo: string) => {
    setSelectedLowerEnvRepo(repo)
    if (repo) lowerEnvFetcher.submit({ intent: "fetch_lower_env_branches", lowerEnvRepo: repo }, { method: "POST" })
  }

  const handleSave = () => {
    const [owner, repo] = selectedRepo.split("/")
    const [lowerEnvOwner, lowerEnvRepo] = selectedLowerEnvRepo ? selectedLowerEnvRepo.split("/") : [null, null]
    fetcher.submit(
      {
        intent: "save",
        owner,
        repo,
        branch: selectedBranch,
        filePath,
        autoImport: autoImport.toString(),
        lowerEnvOwner: lowerEnvOwner ?? "",
        lowerEnvRepo: lowerEnvRepo ?? "",
        lowerEnvBranch: selectedLowerEnvRepo ? selectedLowerEnvBranch : "",
        lowerEnvFilePath: selectedLowerEnvRepo ? lowerEnvFilePath : "",
      },
      { method: "POST" }
    )
  }

  const repoOptions: SelectOption[] = [
    { value: "", label: "Select a repository" },
    ...repos.map((r) => ({ value: r.fullName, label: r.fullName })),
  ]

  const branchOptions: SelectOption[] = branches.map((b) => ({ value: b.name, label: b.name }))

  return (
    <div style={contentStyle}>
      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {/* Form */}
        <Select
          label="Repository"
          value={selectedRepo}
          onChange={handleRepoChange}
          options={repoOptions}
          helperText="Select the repository where definitions will be stored"
        />

        {branches.length > 0 && (
          <Select
            label="Branch"
            value={selectedBranch}
            onChange={setSelectedBranch}
            options={branchOptions}
            helperText="This branch represents the live state of definitions for this store"
          />
        )}

        <TextField
          label="File path"
          value={filePath}
          onChange={setFilePath}
          helperText="Path to the definitions file in the repository"
        />

        <Checkbox
          label="Enable auto-import"
          checked={autoImport}
          onChange={setAutoImport}
          helperText="New changes on the branch will be automatically applied when you open the app. Deletions require manual confirmation."
        />

        <div style={{ borderTop: "1px solid #eaeaea", paddingTop: "24px", marginTop: "8px" }}>
          <div style={{ fontSize: "14px", fontWeight: 600, color: "#111", marginBottom: "4px" }}>
            Sync source
          </div>
          <p style={{ fontSize: "13px", color: "#666", margin: "0 0 16px 0" }}>
            Optional. Another repository and branch to compare definitions with and sync to this store. Your GitHub account must have access to that repository.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <Select
              label="Source repository"
              value={selectedLowerEnvRepo}
              onChange={handleLowerEnvRepoChange}
              options={[
                { value: "", label: "None" },
                ...repos.map((r) => ({ value: r.fullName, label: r.fullName })),
              ]}
              helperText="Repository to compare and sync from"
            />
            {selectedLowerEnvRepo && lowerEnvBranches.length > 0 && (
              <Select
                label="Source branch"
                value={selectedLowerEnvBranch}
                onChange={setSelectedLowerEnvBranch}
                options={lowerEnvBranches.map((b) => ({ value: b.name, label: b.name }))}
                helperText="Branch to pull definitions from"
              />
            )}
            {selectedLowerEnvRepo && (
              <TextField
                label="Source file path"
                value={lowerEnvFilePath}
                onChange={setLowerEnvFilePath}
                helperText="Path to the definitions file in the source repo (defaults to main file path)"
              />
            )}
          </div>
        </div>

        <div>
          <Button variant="primary" onClick={handleSave} loading={isLoading || isLowerEnvLoading}>
            Save settings
          </Button>
        </div>
      </div>
    </div>
  )
}

const contentStyle: React.CSSProperties = {}
