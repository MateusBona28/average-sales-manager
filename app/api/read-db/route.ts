import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'db.json')

    if (!fs.existsSync(filePath)) {
      return NextResponse.json(
        { error: 'Arquivo db.json não encontrado' },
        { status: 404 }
      )
    }

    const data = fs.readFileSync(filePath, 'utf-8')
    return new NextResponse(data)
  } catch (error) {
    console.error('Erro ao ler arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao ler arquivo' },
      { status: 500 }
    )
  }
} 