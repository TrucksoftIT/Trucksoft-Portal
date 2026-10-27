import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto'

function masterKey(): Buffer {
  const raw = process.env.VAULT_MASTER_KEY
  if (!raw || raw.length < 32) {
    throw new Error('VAULT_MASTER_KEY must be set (≥32 chars)')
  }
  return createHash('sha256').update(raw).digest()
}

/** Encrypt secret with server master key. Format: iv.tag.ciphertext (base64 parts). */
export function encryptSecret(plaintext: string): string {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', masterKey(), iv)
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return [iv.toString('base64'), tag.toString('base64'), enc.toString('base64')].join('.')
}

export function decryptSecret(blob: string): string {
  const [ivB64, tagB64, dataB64] = blob.split('.')
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Invalid ciphertext')
  const decipher = createDecipheriv('aes-256-gcm', masterKey(), Buffer.from(ivB64, 'base64'))
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'))
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8')
}
