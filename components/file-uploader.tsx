"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { Upload, FileUp, AlertCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import * as XLSX from 'xlsx'
import { useProdutos } from "@/contexts/ProdutosContext"
import { useRouter } from "next/navigation"

interface ExcelVenda {
  Descrição: string
  "Preço de Venda": number
  "Quant.Vendas": number
  "Total Vendas": number
}

interface FormData {
  file: File | null
  dataInicial: string
  dataFinal: string
  periodo: string
}

interface ProdutoProcessado {
  item: string
  quantidade: number
  periodo: string
  valor_total: number
  valor_unitario: number
}

export function FileUploader() {
  const router = useRouter()
  const { setFormattedData } = useProdutos()
  const [isError, setIsError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [formData, setFormData] = useState<FormData>({
    file: null,
    dataInicial: '',
    dataFinal: '',
    periodo: 'ultimos_30_dias'
  })

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      if (
        file.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
        file.type === "application/vnd.ms-excel" // .xls
      ) {
        setFormData(prev => ({ ...prev, file }))
        setIsError(false)
      } else {
        setIsError(true)
        setTimeout(() => setIsError(false), 3000)
      }
    }
  }

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handlePeriodoChange = (value: string) => {
    setFormData(prev => ({ ...prev, periodo: value }))

    if (value !== 'escolher_periodo') {
      const hoje = new Date()
      let dataInicial = new Date()

      switch (value) {
        case 'hoje':
          // Mantém a data de hoje
          break
        case 'ontem':
          dataInicial.setDate(hoje.getDate() - 1)
          break
        case 'ultimos_7_dias':
          dataInicial.setDate(hoje.getDate() - 7)
          break
        case 'ultimos_30_dias':
          dataInicial.setDate(hoje.getDate() - 30)
          break
        case 'ultimos_90_dias':
          dataInicial.setDate(hoje.getDate() - 90)
          break
        case 'este_ano':
          dataInicial = new Date(hoje.getFullYear(), 0, 1)
          break
      }

      setFormData(prev => ({
        ...prev,
        dataInicial: dataInicial.toISOString().split('T')[0],
        dataFinal: hoje.toISOString().split('T')[0]
      }))
    }
  }

  const formatarData = (date: Date) => {
    const dia = date.getDate().toString().padStart(2, '0')
    const mes = (date.getMonth() + 1).toString().padStart(2, '0')
    const ano = date.getFullYear()
    return `${dia}/${mes}/${ano}`
  }

  const validarVenda = (venda: ExcelVenda): boolean => {
    return (
      venda &&
      typeof venda.Descrição === 'string' &&
      venda.Descrição.trim() !== '' &&
      typeof venda["Preço de Venda"] === 'number' &&
      venda["Preço de Venda"] > 0 &&
      typeof venda["Quant.Vendas"] === 'number' &&
      venda["Quant.Vendas"] > 0 &&
      typeof venda["Total Vendas"] === 'number' &&
      venda["Total Vendas"] > 0
    )
  }

  const processarVenda = (venda: ExcelVenda, periodo: string): ProdutoProcessado => {
    return {
      item: venda.Descrição.trim(),
      quantidade: Number(venda["Quant.Vendas"]),
      periodo,
      valor_total: Number(venda["Total Vendas"]),
      valor_unitario: Number(venda["Preço de Venda"])
    }
  }

  const formatAndSetProductsData = (vendas: ExcelVenda[], dataInicial: Date, dataFinal: Date) => {
    const periodo = `${formatarData(dataInicial)} até ${formatarData(dataFinal)}`

    console.log(vendas)

    // Filtrar e processar apenas vendas válidas
    const itensProcessados = vendas
      .filter(validarVenda)
      .map(venda => processarVenda(venda, periodo))
      .sort((a, b) => a.item.localeCompare(b.item))

    setFormattedData(itensProcessados)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.file || !formData.dataInicial || !formData.dataFinal) {
      setIsError(true)
      setTimeout(() => setIsError(false), 3000)
      return
    }

    setIsUploading(true)
    setProgress(0)

    try {
      const reader = new FileReader()
      const dataInicial = new Date(formData.dataInicial)
      const dataFinal = new Date(formData.dataFinal)

      reader.onload = (e) => {
        const data = e.target?.result
        const workbook = XLSX.read(data, { type: 'array' })
        const firstSheetName = workbook.SheetNames[0]
        const worksheet = workbook.Sheets[firstSheetName]
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelVenda[]

        // Processar produtos
        formatAndSetProductsData(jsonData, dataInicial, dataFinal)

        router.push('/produtos')
      }

      reader.readAsArrayBuffer(formData.file)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsError(true)
      setTimeout(() => setIsError(false), 3000)
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  useEffect(() => {
    handlePeriodoChange(formData.periodo)
  }, [])

  return (
    <Card className="border-2 border-sky-100 w-full max-w-3xl mx-auto">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-gray-800">Upload de Arquivo</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {isError ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-center bg-red-50 text-red-500 rounded-lg p-4 w-full">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>Por favor, preencha todos os campos e envie apenas arquivos .xlsx ou .xls</span>
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
            <>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="periodo">Período</Label>
                  <Select value={formData.periodo} onValueChange={handlePeriodoChange}>
                    <SelectTrigger id="periodo" className="w-full min-w-[200px]">
                      <SelectValue placeholder="Selecione o período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hoje">Hoje</SelectItem>
                      <SelectItem value="ontem">Ontem</SelectItem>
                      <SelectItem value="ultimos_7_dias">Últimos 7 dias</SelectItem>
                      <SelectItem value="ultimos_30_dias">Últimos 30 dias</SelectItem>
                      <SelectItem value="ultimos_90_dias">Últimos 90 dias</SelectItem>
                      <SelectItem value="este_ano">Este ano</SelectItem>
                      <SelectItem value="escolher_periodo">Escolher período</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.periodo === 'escolher_periodo' && (
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="dataInicial">Data Inicial</Label>
                      <Input
                        id="dataInicial"
                        name="dataInicial"
                        type="date"
                        value={formData.dataInicial}
                        onChange={handleDateChange}
                        className="min-w-[200px]"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="dataFinal">Data Final</Label>
                      <Input
                        id="dataFinal"
                        name="dataFinal"
                        type="date"
                        value={formData.dataFinal}
                        onChange={handleDateChange}
                        className="min-w-[200px]"
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="file">Arquivo Excel</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="file"
                      type="file"
                      accept=".xlsx,.xls"
                      onChange={handleFileChange}
                      className="flex-1 min-w-[300px]"
                    />
                    {formData.file && (
                      <div className="flex items-center text-sm text-gray-500">
                        <FileUp className="h-4 w-4 mr-1" />
                        {formData.file.name}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                disabled={isUploading || !formData.file || (formData.periodo === 'escolher_periodo' && (!formData.dataInicial || !formData.dataFinal))}
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <FileUp className="h-4 w-4 animate-pulse" />
                    <span>Processando...</span>
                    <Progress value={progress} className="w-24 h-1 bg-sky-100" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Enviar</span>
                  </div>
                )}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
}

