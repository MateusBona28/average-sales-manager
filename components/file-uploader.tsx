"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { FileUploadCard } from '@/components/file-upload-card'
import { useProdutos } from '@/contexts/ProdutosContext'
import { useVendas } from '@/contexts/VendasContext'
import { toast } from 'sonner'
import { encryptData } from '@/utils/encryption'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface ExcelVenda {
  Tipo: string
  Data: number
  Descrição: string
  "Vl.Produtos": string
  Desconto: number
  "Preço de Venda": number
}

interface ProdutoBase {
  item: string
  valor_unitario: number
}

interface FormattedItem {
  item: string
  quantidade: number
  periodo: string
  valor_total: number
  valor_unitario: number
}

interface VendaDiaria {
  data: string
  valor: number
  descontos: number
}

export function FileUploader() {
  const router = useRouter()
  const { setFormattedData } = useProdutos()
  const { setVendasDiarias } = useVendas()

  // Estados para o upload da base de dados
  const [isUploadingBase, setIsUploadingBase] = useState(false)
  const [progressBase, setProgressBase] = useState(0)
  const [isErrorBase, setIsErrorBase] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Estados para o upload de vendas
  const [isUploadingVendas, setIsUploadingVendas] = useState(false)
  const [progressVendas, setProgressVendas] = useState(0)
  const [isErrorVendas, setIsErrorVendas] = useState(false)

  const handlePasswordSubmit = async () => {
    if (password === process.env.NEXT_PUBLIC_DB_PASSWORD) {
      setShowPasswordDialog(false)
      if (selectedFile) {
        await processarBaseDados(selectedFile)
      }
      setPassword("")
      setSelectedFile(null)
    } else {
      toast.error('Senha incorreta', {
        description: 'Por favor, verifique a senha e tente novamente.'
      })
    }
  }

  const handleBaseFileSelect = async (file: File) => {
    setSelectedFile(file)
    setShowPasswordDialog(true)
  }

  const validarBaseDados = (venda: ExcelVenda): boolean => {
    return (
      venda &&
      typeof venda.Descrição === 'string' &&
      venda.Descrição.trim() !== '' &&
      typeof venda["Preço de Venda"] === 'number' &&
      venda["Preço de Venda"] > 0
    )
  }

  const processarBaseDados = async (file: File) => {
    setIsUploadingBase(true)
    setProgressBase(0)

    try {
      const reader = new FileReader()
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

          toast.success('Base de dados atualizada com sucesso!', {
            description: `${produtosBase.length} produtos foram processados.`
          })
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          setIsErrorBase(true)
          toast.error('Erro ao processar arquivo da base de dados', {
            description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
          })
          setTimeout(() => setIsErrorBase(false), 3000)
        } finally {
          setIsUploadingBase(false)
          setProgressBase(0)
        }
      }

      reader.onerror = () => {
        setIsErrorBase(true)
        toast.error('Erro ao ler arquivo da base de dados', {
          description: 'Verifique se o arquivo está correto e tente novamente.'
        })
        setTimeout(() => setIsErrorBase(false), 3000)
        setIsUploadingBase(false)
        setProgressBase(0)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsErrorBase(true)
      toast.error('Erro ao processar arquivo da base de dados', {
        description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
      })
      setTimeout(() => setIsErrorBase(false), 3000)
      setIsUploadingBase(false)
      setProgressBase(0)
    }
  }

  const formatAndSetProductsData = (vendas: ExcelVenda[]) => {
    // Mapear e processar os itens
    const itensProcessados = vendas.map((venda) => {
      const [quantidade, item] = venda.Descrição.split('X').map((str: string) => str.trim())

      // Converter número do Excel para data JavaScript
      const excelDate = venda.Data
      const millisecondsPerDay = 24 * 60 * 60 * 1000
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + (excelDate * millisecondsPerDay))

      return {
        item,
        quantidade: parseInt(quantidade),
        data: date,
        Vl: {
          Produtos: venda["Vl.Produtos"]
        }
      }
    })

    // Encontrar a menor e maior data de todas as vendas
    const datas = itensProcessados.map(item => item.data)
    const dataMin = new Date(Math.min(...datas.map(d => d.getTime())))
    const dataMax = new Date(Math.max(...datas.map(d => d.getTime())))

    // Formatar o período global
    const formatarData = (date: Date) => {
      const dia = date.getDate().toString().padStart(2, '0')
      const mes = (date.getMonth() + 1).toString().padStart(2, '0')
      const ano = date.getFullYear()
      return `${dia}/${mes}/${ano}`
    }

    const periodoGlobal = `${formatarData(dataMin)} até ${formatarData(dataMax)}`

    // Reduzir para somar quantidades de itens iguais
    const itensAgrupados = itensProcessados.reduce<FormattedItem[]>((acc, curr) => {
      // Extrair o valor do produto da string (ex: "R$ 123.45" -> 123.45)
      const valorString = curr.Vl.Produtos.replace('R$', '').trim()
      const valor = parseFloat(valorString.replace('.', '').replace(',', '.'))

      const itemExistente = acc.find((item) => item.item === curr.item)
      if (itemExistente) {
        itemExistente.quantidade += curr.quantidade
        itemExistente.valor_total += valor
      } else {
        acc.push({
          item: curr.item,
          quantidade: curr.quantidade,
          periodo: periodoGlobal,
          valor_total: valor,
          valor_unitario: 0 // será calculado depois
        })
      }
      return acc
    }, [])

    // Calcular valor unitário para cada item
    const itensFinais = itensAgrupados.map(item => ({
      ...item,
      valor_unitario: Number((item.valor_total / item.quantidade).toFixed(2))
    }))

    itensFinais.sort((a, b) => a.item.localeCompare(b.item))

    setFormattedData(itensFinais)
  }

  const formatAndSetDailySales = (vendas: ExcelVenda[]) => {
    // Agrupar vendas por data
    const vendasPorDia = vendas.reduce<Record<string, { valor: number; descontos: number }>>((acc, venda) => {
      // Converter número do Excel para data JavaScript
      const excelDate = venda.Data
      const millisecondsPerDay = 24 * 60 * 60 * 1000
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + (excelDate * millisecondsPerDay))

      // Formatar a data como chave (DD/MM/YYYY)
      const dataFormatada = date.toLocaleDateString('pt-BR')

      // Extrair e converter valor dos produtos
      const valorString = venda["Vl.Produtos"].replace('R$', '').trim()
      const valor = parseFloat(valorString.replace('.', '').replace(',', '.'))

      // Extrair e converter valor dos descontos
      const desconto = venda.Desconto

      // Acumular valores para a data
      if (!acc[dataFormatada]) {
        acc[dataFormatada] = { valor: 0, descontos: 0 }
      }

      acc[dataFormatada].valor += valor
      acc[dataFormatada].descontos += desconto

      return acc
    }, {})

    // Converter objeto em array e ordenar por data
    const vendasDiarias: VendaDiaria[] = Object.entries(vendasPorDia).map(([data, valores]) => ({
      data,
      valor: Number(valores.valor.toFixed(2)),
      descontos: Number(valores.descontos.toFixed(2))
    })).sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/').map(Number)
      const [diaB, mesB, anoB] = b.data.split('/').map(Number)
      return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime()
    })
    setVendasDiarias(vendasDiarias)
  }

  const processarVendas = async (file: File) => {
    setIsUploadingVendas(true)
    setProgressVendas(0)

    try {
      const reader = new FileReader()

      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelVenda[]

        // Filtrar apenas vendas
        const vendas = jsonData.filter((item) => item.Tipo === "Venda")

        if (vendas.length === 0) {
          throw new Error('Nenhuma venda encontrada na planilha')
        }

        // Processar produtos
        formatAndSetProductsData(vendas)

        // Processar vendas diárias
        formatAndSetDailySales(vendas)

        toast.success('Planilha de vendas processada com sucesso!', {
          description: `${vendas.length} vendas foram processadas.`
        })

        router.push('/visao-geral')
      }

      reader.onerror = () => {
        setIsErrorVendas(true)
        toast.error('Erro ao ler arquivo de vendas', {
          description: 'Verifique se o arquivo está correto e tente novamente.'
        })
        setTimeout(() => setIsErrorVendas(false), 3000)
        setIsUploadingVendas(false)
        setProgressVendas(0)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsErrorVendas(true)
      toast.error('Erro ao processar arquivo de vendas', {
        description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
      })
      setTimeout(() => setIsErrorVendas(false), 3000)
    } finally {
      setIsUploadingVendas(false)
      setProgressVendas(0)
    }
  }

  return (
    <>
      <div className="flex flex-row gap-6">
        <FileUploadCard
          title="Enviar Base de Dados"
          description="Faça upload da planilha com os dados dos produtos"
          accept=".xlsx,.xls"
          onFileSelect={handleBaseFileSelect}
          isUploading={isUploadingBase}
          progress={progressBase}
          isError={isErrorBase}
        />
        <FileUploadCard
          title="Enviar Vendas"
          description="Faça upload da planilha com os dados das vendas"
          accept=".xlsx,.xls"
          onFileSelect={processarVendas}
          isUploading={isUploadingVendas}
          progress={progressVendas}
          isError={isErrorVendas}
        />
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha Necessária</DialogTitle>
            <DialogDescription>
              Digite a senha para processar a base de dados
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border rounded-lg p-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <Input
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-0 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit()
                  }
                }}
              />
            </div>
            <Button onClick={handlePasswordSubmit}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

