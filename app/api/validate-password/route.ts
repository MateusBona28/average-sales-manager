import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()

    if (!process.env.DB_PASSWORD) {
      console.error('Variável de ambiente DB_PASSWORD não está definida')
      return NextResponse.json(
        { error: 'Erro de configuração do servidor' },
        { status: 500 }
      )
    }

    if (password === process.env.DB_PASSWORD) {
      return NextResponse.json({ success: true })
    }

    return NextResponse.json(
      { error: 'Senha incorreta' },
      { status: 401 }
    )
  } catch (error) {
    console.error('Erro ao validar senha:', error)
    return NextResponse.json(
      { error: 'Erro ao processar requisição' },
      { status: 500 }
    )
  }
} 