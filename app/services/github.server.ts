import { Octokit } from "octokit"
import { getAppConfig } from "./app-config.server"

export async function getOAuthUrl(state: string, redirectUri: string) {
  const config = await getAppConfig()
  if (!config.githubClientId) throw new Error("GitHub Client ID not configured")

  const params = new URLSearchParams({
    client_id: config.githubClientId,
    scope: "repo",
    state,
    redirect_uri: redirectUri,
  })
  return `https://github.com/login/oauth/authorize?${params.toString()}`
}

export async function exchangeCode(code: string) {
  const config = await getAppConfig()
  if (!config.githubClientId || !config.githubClientSecret) {
    throw new Error("GitHub credentials not configured")
  }

  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      client_id: config.githubClientId,
      client_secret: config.githubClientSecret,
      code,
    }),
  })

  const data = (await response.json()) as {
    access_token?: string
    error?: string
    error_description?: string
  }

  if (data.error) {
    throw new Error(data.error_description ?? data.error)
  }

  return data.access_token!
}

function octokit(token: string) {
  return new Octokit({ auth: token })
}

export async function getAuthenticatedUser(token: string) {
  const kit = octokit(token)
  const { data } = await kit.rest.users.getAuthenticated()
  return { login: data.login, avatarUrl: data.avatar_url }
}

export async function listRepos(token: string) {
  const kit = octokit(token)
  const repos: Array<{ fullName: string; owner: string; name: string; private: boolean }> = []

  for await (const response of kit.paginate.iterator(
    kit.rest.repos.listForAuthenticatedUser,
    { sort: "updated", per_page: 100 },
  )) {
    for (const repo of response.data) {
      repos.push({
        fullName: repo.full_name,
        owner: repo.owner.login,
        name: repo.name,
        private: repo.private,
      })
    }
  }

  return repos
}

export async function listBranches(token: string, owner: string, repo: string) {
  const kit = octokit(token)
  const { data } = await kit.rest.repos.listBranches({ owner, repo, per_page: 100 })
  return data.map((b) => ({ name: b.name, protected: b.protected }))
}

export interface FileReadResult {
  content: string
  sha: string
}

export async function readFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<FileReadResult | null> {
  const kit = octokit(token)

  try {
    const { data } = await kit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })

    if ("content" in data && data.type === "file") {
      const content = Buffer.from(data.content, "base64").toString("utf8")
      return { content, sha: data.sha }
    }

    return null
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 404) {
      return null
    }
    throw err
  }
}

export async function writeFile(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  content: string,
  message: string,
  sha?: string,
) {
  const kit = octokit(token)
  const encoded = Buffer.from(content, "utf8").toString("base64")

  const { data } = await kit.rest.repos.createOrUpdateFileContents({
    owner,
    repo,
    path,
    message,
    content: encoded,
    branch,
    ...(sha ? { sha } : {}),
  })

  return {
    commitSha: data.commit.sha!,
    commitUrl: data.commit.html_url!,
  }
}

export async function getLatestFileSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<string | null> {
  const kit = octokit(token)

  try {
    const { data } = await kit.rest.repos.getContent({
      owner,
      repo,
      path,
      ref: branch,
    })

    if ("sha" in data) return data.sha
    return null
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 404) {
      return null
    }
    throw err
  }
}

export async function listCommits(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
  perPage = 20,
) {
  const kit = octokit(token)
  const { data } = await kit.rest.repos.listCommits({
    owner,
    repo,
    sha: branch,
    path,
    per_page: perPage,
  })

  return data.map((c) => ({
    sha: c.sha,
    message: c.commit.message,
    date: c.commit.committer?.date ?? c.commit.author?.date ?? "",
    author: c.commit.author?.name ?? c.author?.login ?? "unknown",
    url: c.html_url,
  }))
}

export interface LastCommitForPathResult {
  sha: string
  date: string
  message: string
}

export async function getLastCommitForPath(
  token: string,
  owner: string,
  repo: string,
  branch: string,
  path: string,
): Promise<LastCommitForPathResult | null> {
  const commits = await listCommits(token, owner, repo, branch, path, 1)
  const first = commits[0]
  if (!first) return null
  return { sha: first.sha, date: first.date, message: first.message }
}

export async function getBranchSha(
  token: string,
  owner: string,
  repo: string,
  branch: string,
): Promise<string | null> {
  const kit = octokit(token)
  try {
    const { data } = await kit.rest.repos.getBranch({
      owner,
      repo,
      branch,
    })
    return data.commit.sha ?? null
  } catch (err: unknown) {
    if (err && typeof err === "object" && "status" in err && err.status === 404) {
      return null
    }
    throw err
  }
}

export async function createBranch(
  token: string,
  owner: string,
  repo: string,
  fromSha: string,
  newBranchName: string,
): Promise<{ ref: string }> {
  const kit = octokit(token)
  const ref = `refs/heads/${newBranchName}`
  const { data } = await kit.rest.git.createRef({
    owner,
    repo,
    ref,
    sha: fromSha,
  })
  return { ref: data.ref }
}

export interface CreatePullRequestResult {
  number: number
  url: string
  htmlUrl: string
}

export async function createPullRequest(
  token: string,
  owner: string,
  repo: string,
  head: string,
  base: string,
  title: string,
  body?: string,
): Promise<CreatePullRequestResult> {
  const kit = octokit(token)
  const { data } = await kit.rest.pulls.create({
    owner,
    repo,
    head,
    base,
    title,
    body: body ?? "",
  })
  return {
    number: data.number,
    url: data.url,
    htmlUrl: data.html_url ?? "",
  }
}
