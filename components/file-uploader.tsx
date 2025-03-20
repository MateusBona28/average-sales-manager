"use client"

import { FileUploadCard } from "@/components/ui/file-upload-card"
import * as XLSX from 'xlsx'
import { encryptData, decryptData } from "@/utils/encryption"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { FileText } from "lucide-react"

interface ExcelVenda {
  Descrição: string
  "Preço de Venda": number
  "Quant.Vendas": number
  "Total Vendas": number
  "Descontos": number
  "Valor Pago": number
}

interface ProdutoBase {
  item: string
  valor_unitario: number
}

export function FileUploader() {
  const validarBaseDados = (venda: ExcelVenda): boolean => {
    return (
      venda &&
      typeof venda.Descrição === 'string' &&
      venda.Descrição.trim() !== '' &&
      typeof venda["Preço de Venda"] === 'number' &&
      venda["Preço de Venda"] > 0
    )
  }

  const lerBaseDados = async () => {
    try {
      const response = await fetch('/api/read-db')
      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Erro ao ler base de dados')
      }

      const dadosCriptografados = await response.text()
      const dadosDescriptografados = decryptData(dadosCriptografados) as ProdutoBase[]

      console.log('Dados da base:', dadosDescriptografados)
      toast.success(`Base de dados carregada com ${dadosDescriptografados.length} produtos`)
    } catch (error) {
      console.error('Erro ao ler base de dados:', error)
      toast.error(error instanceof Error ? error.message : 'Erro ao ler base de dados')
    }
  }

  const processarBaseDados = async (file: File) => {
    const reader = new FileReader()
    return new Promise<void>((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelVenda[]

          // Filtrar e formatar apenas os dados válidos
          const produtosBase: ProdutoBase[] = jsonData
            .filter(validarBaseDados)
            .map(venda => ({
              item: venda.Descrição.trim(),
              valor_unitario: Number(venda["Preço de Venda"])
            }))
            .sort((a, b) => a.item.localeCompare(b.item))

          if (produtosBase.length === 0) {
            throw new Error('Nenhum produto válido encontrado na planilha')
          }

          // Criptografar os dados
          const dadosCriptografados = encryptData(produtosBase)

          // Enviar para a API route
          const response = await fetch('/api/save-db', {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: dadosCriptografados,
          })

          if (!response.ok) {
            throw new Error('Erro ao salvar arquivo')
          }

          // Atualizar o estado com os dados processados
          const hoje = new Date()

          toast.success('Base de dados atualizada com sucesso!')
          resolve()
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          toast.error('Erro ao processar arquivo')
          reject(error)
        }
      }

      reader.onerror = () => reject(new Error('Erro ao ler arquivo'))
      reader.readAsArrayBuffer(file)
    })
  }

  const processarVendas = async (file: File) => {
    console.log('not implemented')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <Button
          onClick={lerBaseDados}
          variant="outline"
          className="border-sky-200 text-sky-700 hover:bg-sky-50"
        >
          <FileText className="h-4 w-4 mr-2" />
          Ler Base de Dados
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-6xl mx-auto">
        <FileUploadCard
          title="Enviar Base de Dados"
          description="Envie a planilha com os dados base dos produtos"
          onFileProcess={processarBaseDados}
        />
        <FileUploadCard
          title="Enviar Vendas"
          description="Envie a planilha com os dados de vendas"
          onFileProcess={processarVendas}
        />
      </div>
    </div>
  )
}

