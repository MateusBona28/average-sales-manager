import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function POST(request: Request) {
  try {
    console.log('Salvando arquivo...')
    const data = await request.text()
    const filePath = path.join(process.cwd(), 'db.json')

    fs.writeFileSync(filePath, data)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Erro ao salvar arquivo:', error)
    return NextResponse.json(
      { error: 'Erro ao salvar arquivo' },
      { status: 500 }
    )
  }
} 