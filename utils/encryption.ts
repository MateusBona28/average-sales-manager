import crypto from 'crypto'

const ALGORITHM = 'aes-256-cbc'
const ENCODING = 'hex'
const IV_LENGTH = 16

if (!process.env.NEXT_PUBLIC_SECRET_KEY) {
  throw new Error('A variável de ambiente SECRET_KEY não está definida')
}

// Chave de 32 bytes (256 bits) da variável de ambiente
const KEY = Buffer.from(process.env.NEXT_PUBLIC_SECRET_KEY, 'hex')

export function encryptData(data: any): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv)
  let encrypted = cipher.update(JSON.stringify(data), 'utf8', ENCODING)
  encrypted += cipher.final(ENCODING)
  return `${iv.toString(ENCODING)}:${encrypted}`
}

export function decryptData(encryptedData: string): any {
  const [ivHex, encryptedHex] = encryptedData.split(':')
  const iv = Buffer.from(ivHex, ENCODING)
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv)
  let decrypted = decipher.update(encryptedHex, ENCODING, 'utf8')
  decrypted += decipher.final('utf8')
  return JSON.parse(decrypted)
} 