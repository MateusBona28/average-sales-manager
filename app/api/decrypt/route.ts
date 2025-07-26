import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { deriveKey } from '../../../utils/encryption'

const ALGORITHM = 'aes-256-cbc'
const ENCODING = 'hex'

export async function POST(request: Request) {
  try {
    const { data: encryptedData } = await request.json()

    if (!process.env.SECRET_KEY) {
      console.error('Variável de ambiente SECRET_KEY não está definida')
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      )
    }

    // Derivar chave de 32 bytes da variável de ambiente
    const key = deriveKey(process.env.SECRET_KEY)

    // Separar IV e dados criptografados
    const [ivHex, encryptedHex] = encryptedData.split(':')
    const iv = Buffer.from(ivHex, ENCODING)
    const encrypted = Buffer.from(encryptedHex, ENCODING)

    // Criar decipher com a chave e IV
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)

    // Descriptografar os dados
    const decryptedBuffer = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])

    // Converter buffer para string e depois para objeto
    const decryptedString = decryptedBuffer.toString('utf8')
    const result = JSON.parse(decryptedString)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Erro ao descriptografar dados:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
} 