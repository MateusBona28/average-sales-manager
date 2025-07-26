import { NextResponse } from 'next/server'
import crypto from 'crypto'
import { deriveKey } from '../../../utils/encryption'

const ALGORITHM = 'aes-256-cbc'
const ENCODING = 'hex'
const IV_LENGTH = 16

export async function POST(request: Request) {
  try {
    const data = await request.json()

    if (!process.env.SECRET_KEY) {
      console.error('Variável de ambiente SECRET_KEY não está definida')
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      )
    }

    // Derivar chave de 32 bytes da variável de ambiente
    const key = deriveKey(process.env.SECRET_KEY)

    // Gerar IV aleatório
    const iv = crypto.randomBytes(IV_LENGTH)

    // Criar cipher com a chave e IV
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)

    // Converter dados para JSON string e depois para Buffer
    const dataBuffer = Buffer.from(JSON.stringify(data), 'utf8')

    // Criptografar os dados
    const encryptedBuffer = Buffer.concat([
      cipher.update(dataBuffer),
      cipher.final()
    ])

    // Combinar IV e dados criptografados
    const result = iv.toString(ENCODING) + ':' + encryptedBuffer.toString(ENCODING)

    return NextResponse.json({ data: result })
  } catch (error) {
    console.error('Erro ao criptografar dados:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
} 