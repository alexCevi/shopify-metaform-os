import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto"
import { getAppConfig } from "./app-config.server"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const AUTH_TAG_LENGTH = 16

async function getKey(): Promise<Buffer> {
  const config = await getAppConfig()
  return Buffer.from(config.encryptionKey, "hex")
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await getKey()
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)

  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  return Buffer.concat([iv, authTag, encrypted]).toString("base64")
}

export async function decrypt(ciphertext: string): Promise<string> {
  const key = await getKey()
  const data = Buffer.from(ciphertext, "base64")

  const iv = data.subarray(0, IV_LENGTH)
  const authTag = data.subarray(IV_LENGTH, IV_LENGTH + AUTH_TAG_LENGTH)
  const encrypted = data.subarray(IV_LENGTH + AUTH_TAG_LENGTH)

  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(authTag)

  return Buffer.concat([
    decipher.update(encrypted),
    decipher.final(),
  ]).toString("utf8")
}
