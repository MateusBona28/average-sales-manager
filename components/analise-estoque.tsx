"use client"

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, TrendingDown, Package, Loader2 } from 'lucide-react'

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

interface AnaliseEstoqueProps {
  produtos: FormattedItem[]
  vendas: VendaDiaria[]
}

interface AnaliseProduto {
  produto: FormattedItem
  mediaVendas3Meses: number
  estoqueAtual: number
  status: 'critico' | 'baixo' | 'adequado' | 'excesso'
  percentualEstoque: number
  mesesAnalisados: number
}

export function AnaliseEstoque({ produtos, vendas }: AnaliseEstoqueProps) {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'critico' | 'baixo' | 'adequado' | 'excesso'>('todos')
  const [isLoading, setIsLoading] = useState(true)
  const [isDataValid, setIsDataValid] = useState(false)

  // Validar dados quando produtos ou vendas mudarem
  useEffect(() => {
    const validateData = () => {
      setIsLoading(true)

      // Verificar se os dados existem e são arrays válidos
      const produtosValid = Array.isArray(produtos) && produtos.length > 0
      const vendasValid = Array.isArray(vendas) && vendas.length > 0

      // Verificar se os produtos têm a estrutura correta
      const produtosStructureValid = produtosValid && produtos.every(produto =>
        typeof produto === 'object' &&
        produto !== null &&
        typeof produto.item === 'string' &&
        typeof produto.quantidade === 'number' &&
        typeof produto.periodo === 'string' &&
        typeof produto.valor_total === 'number' &&
        typeof produto.valor_unitario === 'number'
      )

      // Verificar se as vendas têm a estrutura correta
      const vendasStructureValid = vendasValid && vendas.every(venda =>
        typeof venda === 'object' &&
        venda !== null &&
        typeof venda.data === 'string' &&
        typeof venda.valor === 'number' &&
        typeof venda.descontos === 'number'
      )

      const isValid = produtosStructureValid && vendasStructureValid
      setIsDataValid(isValid)

      // Simular um pequeno delay para mostrar o loading
      setTimeout(() => {
        setIsLoading(false)
      }, 500)
    }

    validateData()
  }, [produtos, vendas])

  const analiseProdutos = useMemo(() => {
    if (!isDataValid || isLoading) return []

    // Função para extrair datas do período (formato: "02/01/2025 até 01/07/2025")
    const extrairDatasPeriodo = (periodo: string): { dataInicio: Date | null, dataFim: Date | null } => {
      try {
        const match = periodo.match(/^(\d{2}\/\d{2}\/\d{4})\s+até\s+(\d{2}\/\d{2}\/\d{4})$/)
        if (match) {
          const [, dataInicioStr, dataFimStr] = match

          // Converter DD/MM/YYYY para Date
          const converterData = (dataStr: string): Date => {
            const [dia, mes, ano] = dataStr.split('/').map(Number)
            return new Date(ano, mes - 1, dia)
          }

          return {
            dataInicio: converterData(dataInicioStr),
            dataFim: converterData(dataFimStr)
          }
        }
        return { dataInicio: null, dataFim: null }
      } catch (error) {
        console.warn('Erro ao extrair datas do período:', periodo, error)
        return { dataInicio: null, dataFim: null }
      }
    }

    // Função para calcular número de meses entre duas datas
    const calcularMesesEntreDatas = (dataInicio: Date, dataFim: Date): number => {
      const meses = (dataFim.getFullYear() - dataInicio.getFullYear()) * 12 +
        (dataFim.getMonth() - dataInicio.getMonth())
      return Math.max(1, meses + 1) // Mínimo 1 mês
    }

    // Calcular média de vendas por produto baseada no período específico
    return produtos.map(produto => {
      const { dataInicio, dataFim } = extrairDatasPeriodo(produto.periodo)

      let mediaVendas = 0
      let mesesComVendas = 0

      if (dataInicio && dataFim) {
        // Calcular número de meses no período
        mesesComVendas = calcularMesesEntreDatas(dataInicio, dataFim)

        // A quantidade já representa o total vendido no período
        const totalVendas = produto.quantidade

        // Calcular média mensal
        mediaVendas = mesesComVendas > 0 ? totalVendas / mesesComVendas : 0
      }

      // Usar a quantidade do produto como estoque atual
      const estoqueAtual = produto.quantidade

      const percentualEstoque = mediaVendas > 0 ? (estoqueAtual / mediaVendas) * 100 : 0

      let status: AnaliseProduto['status'] = 'adequado'
      if (percentualEstoque < 50) status = 'critico'
      else if (percentualEstoque < 80) status = 'baixo'
      else if (percentualEstoque > 150) status = 'excesso'

      return {
        produto,
        mediaVendas3Meses: Math.round(mediaVendas * 100) / 100,
        estoqueAtual,
        status,
        percentualEstoque: Math.round(percentualEstoque * 100) / 100,
        mesesAnalisados: mesesComVendas
      }
    }).sort((a, b) => {
      // Ordenar por status crítico primeiro, depois por percentual
      const statusOrder = { critico: 0, baixo: 1, adequado: 2, excesso: 3 }
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return a.percentualEstoque - b.percentualEstoque
    })
  }, [produtos, vendas, isDataValid, isLoading])

  const produtosFiltrados = analiseProdutos.filter(item =>
    filtroStatus === 'todos' || item.status === filtroStatus
  )

  const estatisticas = useMemo(() => {
    if (!isDataValid || isLoading) {
      return { total: 0, critico: 0, baixo: 0, adequado: 0, excesso: 0 }
    }

    const total = analiseProdutos.length
    const critico = analiseProdutos.filter(p => p.status === 'critico').length
    const baixo = analiseProdutos.filter(p => p.status === 'baixo').length
    const adequado = analiseProdutos.filter(p => p.status === 'adequado').length
    const excesso = analiseProdutos.filter(p => p.status === 'excesso').length

    return { total, critico, baixo, adequado, excesso }
  }, [analiseProdutos, isDataValid, isLoading])

  const getStatusColor = (status: AnaliseProduto['status']) => {
    switch (status) {
      case 'critico': return 'text-red-600 bg-red-50 border-red-200'
      case 'baixo': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'adequado': return 'text-green-600 bg-green-50 border-green-200'
      case 'excesso': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: AnaliseProduto['status']) => {
    switch (status) {
      case 'critico': return <AlertTriangle className="h-4 w-4" />
      case 'baixo': return <TrendingDown className="h-4 w-4" />
      case 'adequado': return <TrendingUp className="h-4 w-4" />
      case 'excesso': return <Package className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusText = (status: AnaliseProduto['status']) => {
    switch (status) {
      case 'critico': return 'Crítico'
      case 'baixo': return 'Baixo'
      case 'adequado': return 'Adequado'
      case 'excesso': return 'Excesso'
      default: return 'Desconhecido'
    }
  }

  // Função para formatar data de forma legível
  const formatarData = (dataStr: string): string => {
    try {
      const data = new Date(dataStr)
      if (isNaN(data.getTime())) {
        // Tentar extrair do formato DD/MM/YYYY HH:mm:ss
        const match = dataStr.match(/^(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})$/)
        if (match) {
          const [, dia, mes, ano] = match
          return `${dia}/${mes}/${ano}`
        }
        return dataStr
      }
      return data.toLocaleDateString('pt-BR')
    } catch (error) {
      return dataStr
    }
  }

  // Mostrar loading
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Processando dados de estoque...</p>
        </div>
      </div>
    )
  }

  // Mostrar erro se dados não são válidos
  if (!isDataValid) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Dados inválidos ou incompletos
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>Os dados fornecidos não estão no formato esperado ou estão incompletos.</p>
              <p className="mt-1">Verifique se os arquivos foram carregados corretamente.</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Cards de estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{estatisticas.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Crítico</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{estatisticas.critico}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Baixo</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{estatisticas.baixo}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Adequado</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{estatisticas.adequado}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excesso</CardTitle>
            <Package className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{estatisticas.excesso}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle>Filtrar por Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['todos', 'critico', 'baixo', 'adequado', 'excesso'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFiltroStatus(status)}
                className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${filtroStatus === status
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-700 border border-gray-300 hover:bg-gray-200'
                  }`}
              >
                {status === 'todos' ? 'Todos' : getStatusText(status)}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Lista de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Estoque por Produto</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum produto encontrado com o filtro selecionado.
              </div>
            ) : (
              produtosFiltrados.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${item.status === 'critico' ? 'bg-red-50 border-red-200' :
                    item.status === 'baixo' ? 'bg-orange-50 border-orange-200' :
                      item.status === 'adequado' ? 'bg-green-50 border-green-200' :
                        'bg-blue-50 border-blue-200'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900">{item.produto.item}</h3>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Estoque atual:</span> {item.estoqueAtual} unidades
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Média de vendas (últimos 3 meses):</span> {item.mediaVendas3Meses} unidades/mês
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Estoque representa:</span> {item.percentualEstoque}% da média mensal
                      </div>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">Período analisado:</span> {formatarData(item.produto.periodo)} ({item.mesesAnalisados} meses)
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-sm font-medium ${getStatusColor(item.status)}`}>
                      {getStatusIcon(item.status)}
                      {getStatusText(item.status)}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 