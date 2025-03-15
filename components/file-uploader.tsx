"use client"

import type React from "react"
import { useState } from "react"
import { Upload, FileUp, AlertCircle } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import * as XLSX from 'xlsx'
import { useProdutos } from "@/contexts/ProdutosContext"
import { useRouter } from "next/navigation"

interface FormattedItem {
  item: string
  quantidade: number
  periodo: string
  valor_total: number
  valor_unitario: number
}

interface ExcelVenda {
  Tipo: string
  Descrição: string
  Data: number
  "Vl.Produtos": string
}

export function FileUploader() {
  const router = useRouter()
  const { setFormattedData } = useProdutos()
  const [isDragging, setIsDragging] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0]
      if (
        droppedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
        droppedFile.type === "application/vnd.ms-excel" // .xls
      ) {
        handleFile(droppedFile)
      } else {
        setIsError(true)
        setTimeout(() => setIsError(false), 3000)
      }
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (selectedFile: File) => {
    processFile(selectedFile)
  }

  const processFile = async (selectedFile: File) => {
    setIsUploading(true)
    setProgress(0)

    try {
      const reader = new FileReader()
      
      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelVenda[]
        
        // Transformar em objeto e filtrar apenas vendas
        const vendas = jsonData.filter((item) => item.Tipo === "Venda")
        
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
        router.push('/produtos')
      }
      
      reader.readAsArrayBuffer(selectedFile)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsError(true)
      setTimeout(() => setIsError(false), 3000)
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  return (
    <Card className="border-2 border-sky-100">
      <CardContent className="p-6">
        {isError ? (
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="flex items-center justify-center bg-red-50 text-red-500 rounded-lg p-4 w-full">
              <AlertCircle className="h-6 w-6 mr-2" />
              <span>Por favor, envie apenas arquivos .xlsx ou .xls</span>
            </div>
            <Button 
              onClick={() => setIsError(false)} 
              variant="outline" 
              className="border-sky-200 text-sky-700 hover:bg-sky-50"
            >
              Tente novamente
            </Button>
          </div>
        ) : (
          <div
            className={`flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8 transition-colors ${
              isDragging ? "border-sky-500 bg-sky-50" : "border-sky-200"
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {isUploading ? (
              <div className="w-full space-y-4">
                <div className="flex items-center justify-center">
                  <FileUp className="h-8 w-8 text-sky-500 animate-pulse" />
                </div>
                <p className="text-center text-sm text-gray-500">Processando arquivo...</p>
                <Progress value={progress} className="h-2 bg-sky-100" />
              </div>
            ) : (
              <>
                <Upload className="h-12 w-12 text-sky-500 mb-4" />
                <h3 className="text-lg font-medium text-black mb-1">Enviar arquivo</h3>
                <p className="text-sm text-gray-500 mb-4 text-center">
                  Arraste e solte seu arquivo Excel (.xlsx ou .xls) aqui ou clique para enviar
                </p>
                <Button asChild className="bg-sky-500 hover:bg-sky-600 text-white">
                  <label>
                    <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
                    Enviar arquivo  
                  </label>
                </Button>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

