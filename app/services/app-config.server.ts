import { randomBytes } from "node:crypto"
import prisma from "../db.server"

export interface AppConfigData {
  encryptionKey: string
  githubClientId: string | null
  githubClientSecret: string | null
}

export async function getAppConfig(): Promise<AppConfigData> {
  let config = await prisma.appConfig.findUnique({ where: { id: "singleton" } })

  if (!config) {
    config = await prisma.appConfig.create({
      data: {
        id: "singleton",
        encryptionKey: randomBytes(32).toString("hex"),
      },
    })
  }

  return {
    encryptionKey: config.encryptionKey,
    githubClientId: config.githubClientId,
    githubClientSecret: config.githubClientSecret,
  }
}

export async function updateGitHubCredentials(clientId: string, clientSecret: string) {
  await prisma.appConfig.upsert({
    where: { id: "singleton" },
    update: { githubClientId: clientId, githubClientSecret: clientSecret },
    create: {
      id: "singleton",
      encryptionKey: randomBytes(32).toString("hex"),
      githubClientId: clientId,
      githubClientSecret: clientSecret,
    },
  })
}

export async function hasGitHubCredentials(): Promise<boolean> {
  const config = await getAppConfig()
  return !!config.githubClientId && !!config.githubClientSecret
}
