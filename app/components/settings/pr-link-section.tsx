import { useState } from "react"
import { Select, Button, Stack } from "../index"
import type { SelectOption } from "../index"
import { getNewPrUrl } from "../../utils/github-urls"

export interface PrLinkSectionProps {
  branches: Array<{ name: string }>
  currentBranch: string
  owner: string
  repo: string
}

export function PrLinkSection({ branches, currentBranch, owner, repo }: PrLinkSectionProps) {
  const [targetBranch, setTargetBranch] = useState("")

  const otherBranches = branches.filter((b) => b.name !== currentBranch)

  if (otherBranches.length === 0) {
    return <p style={{ margin: 0, color: "var(--s-color-text-secondary, #6d7175)" }}>
      No other branches available for PR target.
    </p>
  }

  const prUrl = targetBranch ? getNewPrUrl(owner, repo, targetBranch, currentBranch) : ""

  const branchOptions: SelectOption[] = [
    { value: "", label: "Select target branch" },
    ...otherBranches.map((b) => ({ value: b.name, label: b.name })),
  ]

  return (
    <Stack direction="horizontal" gap="base" align="end">
      <div style={{ flex: 1 }}>
        <Select
          label="Target branch"
          value={targetBranch}
          onChange={setTargetBranch}
          options={branchOptions}
          helperText={`Create a PR from ${currentBranch} to the selected branch`}
        />
      </div>
      {prUrl && (
        <a href={prUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
          <Button variant="primary">Open PR on GitHub</Button>
        </a>
      )}
    </Stack>
  )
}
