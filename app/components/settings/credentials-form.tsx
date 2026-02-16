import { useState } from "react"
import { useFetcher } from "react-router"
import { TextField, Button } from "../index"

export interface CredentialsFormProps {
  initialClientId: string
  hasSecretSaved: boolean
  callbackUrl: string
  onSave?: () => void
}

export function CredentialsForm({
  initialClientId,
  hasSecretSaved,
  callbackUrl,
  onSave,
}: CredentialsFormProps) {
  const fetcher = useFetcher()
  const [clientId, setClientId] = useState(initialClientId)
  const [clientSecret, setClientSecret] = useState(hasSecretSaved ? "••••••••••••••••" : "")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const secretToSend = clientSecret === "••••••••••••••••" ? "********" : clientSecret
    fetcher.submit(
      {
        intent: "save_credentials",
        githubClientId: clientId,
        githubClientSecret: secretToSend || (hasSecretSaved ? "********" : ""),
      },
      { method: "POST" }
    )
    onSave?.()
  }

  const isLoading = fetcher.state !== "idle"

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <p style={{ margin: 0, fontSize: "14px", color: "#333", lineHeight: 1.6 }}>
          Create a{" "}
          <a
            href="https://github.com/settings/developers"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0070f3", textDecoration: "none" }}
          >
            GitHub OAuth App
          </a>{" "}
          and enter the credentials below.
        </p>
        <div
          style={{
            padding: "16px",
            backgroundColor: "#fafafa",
            borderRadius: "6px",
            border: "1px solid #eaeaea",
          }}
        >
          <div style={{ fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "8px" }}>
            Authorization callback URL
          </div>
          <code
            style={{
              display: "block",
              padding: "8px 12px",
              backgroundColor: "#fff",
              borderRadius: "4px",
              fontSize: "13px",
              fontFamily: "monospace",
              wordBreak: "break-all",
              border: "1px solid #eaeaea",
              color: "#333",
            }}
          >
            {callbackUrl}
          </code>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <TextField
          label="Client ID"
          value={clientId}
          onChange={setClientId}
          placeholder="Enter GitHub OAuth App Client ID"
          required
          autoComplete="off"
        />

        <TextField
          label="Client Secret"
          value={clientSecret}
          onChange={setClientSecret}
          type="password"
          placeholder="Enter GitHub OAuth App Client Secret"
          helperText={
            hasSecretSaved && clientSecret === "••••••••••••••••"
              ? "Client secret is securely stored. Enter a new value to update."
              : undefined
          }
          required={!hasSecretSaved}
          autoComplete="off"
        />

        <div>
          <Button type="submit" variant="primary" loading={isLoading}>
            Save credentials
          </Button>
        </div>
      </form>
    </div>
  )
}
