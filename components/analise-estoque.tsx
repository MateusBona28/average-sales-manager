"use client"

import { useState, useMemo, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, TrendingDown, Package, Loader2, Search, Download } from 'lucide-react'
import { decryptData } from '@/utils/encryption'
import * as XLSX from 'xlsx'

interface FormattedItem {
  item: string
  quantidade: number
  periodo: string
  valor_total: number
  valor_unitario: number
}

interface ProdutoBase {
  item: string
  valor_unitario: number
  estoqueAtual: number
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
  mediaVendas: number
  status: 'critico' | 'baixo' | 'adequado' | 'excesso' | 'incorreto'
  percentualEstoque: number
  mesesAnalisados: number
}

export function AnaliseEstoque({ produtos, vendas }: AnaliseEstoqueProps) {
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'critico' | 'baixo' | 'adequado' | 'excesso' | 'incorreto'>('todos')
  const [filtroPesquisa, setFiltroPesquisa] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isDataValid, setIsDataValid] = useState(false)
  const [baseDados, setBaseDados] = useState<ProdutoBase[]>([])

  // Estados para paginação
  const [paginaAtual, setPaginaAtual] = useState(1)
  const itensPorPagina = 10

  // Função para buscar base de dados
  const buscarBaseDados = async (): Promise<ProdutoBase[]> => {
    try {
      const response = await fetch('/api/read-db')
      if (!response.ok) {
        throw new Error('Erro ao ler base de dados')
      }
      const { data: dadosCriptografados } = await response.json()
      const dadosDescriptografados = await decryptData(dadosCriptografados)

      if (!dadosDescriptografados || !Array.isArray(dadosDescriptografados) || dadosDescriptografados.length === 0) {
        throw new Error('Base de dados está vazia')
      }

      return dadosDescriptografados as ProdutoBase[]
    } catch (error) {
      console.error('Erro ao buscar base de dados:', error)
      throw new Error('Não foi possível acessar a base de dados. Por favor, verifique se a base de dados foi carregada.')
    }
  }

  // Validar dados quando produtos ou vendas mudarem
  useEffect(() => {
    const validateData = async () => {
      setIsLoading(true)

      try {
        // Buscar base de dados
        const dados = await buscarBaseDados()
        setBaseDados(dados)

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
      } catch (error) {
        console.error('Erro ao validar dados:', error)
        setIsDataValid(false)
      } finally {
        // Simular um pequeno delay para mostrar o loading
        setTimeout(() => {
          setIsLoading(false)
        }, 500)
      }
    }

    validateData()
  }, [produtos, vendas])

  const analiseProdutos = useMemo(() => {
    if (!isDataValid || isLoading || baseDados.length === 0) return []

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

        // A quantidade representa o total vendido no período
        const totalVendas = produto.quantidade

        // Calcular média mensal
        mediaVendas = mesesComVendas > 0 ? totalVendas / mesesComVendas : 0
      }

      // Buscar estoque atual da base de dados
      const produtoBase = baseDados.find(p => p.item === produto.item)
      const estoqueAtual = produtoBase?.estoqueAtual || 0

      const percentualEstoque = mediaVendas > 0 ? (estoqueAtual / mediaVendas) * 100 : 0

      let status: AnaliseProduto['status'] = 'adequado'

      // Primeiro verificar se o estoque é negativo (incorreto)
      if (estoqueAtual < 0) {
        status = 'incorreto'
      } else if (percentualEstoque < 50) {
        status = 'critico'
      } else if (percentualEstoque < 100) {
        status = 'baixo'
      } else if (percentualEstoque > 150) {
        status = 'excesso'
      }

      return {
        produto,
        mediaVendas: Math.round(mediaVendas * 100) / 100,
        estoqueAtual,
        status,
        percentualEstoque: Math.round(percentualEstoque * 100) / 100,
        mesesAnalisados: mesesComVendas
      }
    }).sort((a, b) => {
      // Ordenar por status incorreto primeiro, depois crítico, depois por percentual
      const statusOrder = { incorreto: 0, critico: 1, baixo: 2, adequado: 3, excesso: 4 }
      const statusDiff = statusOrder[a.status] - statusOrder[b.status]
      if (statusDiff !== 0) return statusDiff
      return a.percentualEstoque - b.percentualEstoque
    })
  }, [produtos, vendas, isDataValid, isLoading, baseDados])

  const produtosFiltrados = analiseProdutos.filter(item => {
    // Filtro por status
    const statusMatch = filtroStatus === 'todos' || item.status === filtroStatus

    // Filtro por pesquisa de texto
    const pesquisaMatch = filtroPesquisa === '' ||
      item.produto.item.toLowerCase().includes(filtroPesquisa.toLowerCase())

    return statusMatch && pesquisaMatch
  })

  // Lógica de paginação
  const totalPaginas = Math.ceil(produtosFiltrados.length / itensPorPagina)
  const inicioIndex = (paginaAtual - 1) * itensPorPagina
  const fimIndex = inicioIndex + itensPorPagina
  const produtosPaginados = produtosFiltrados.slice(inicioIndex, fimIndex)

  // Resetar página quando filtros mudarem
  useEffect(() => {
    setPaginaAtual(1)
  }, [filtroStatus, filtroPesquisa])

  // Função para exportar produtos incorretos
  const exportarIncorretos = () => {
    const produtosIncorretos = analiseProdutos.filter(item => item.status === 'incorreto')

    if (produtosIncorretos.length === 0) {
      alert('Não há produtos incorretos para exportar.')
      return
    }

    // Preparar dados para exportação
    const dadosExportacao = produtosIncorretos.map(item => ({
      'Produto': item.produto.item,
      'Estoque Atual': item.estoqueAtual,
      'Média de Vendas (3 meses)': item.mediaVendas,
      'Percentual do Estoque': `${item.percentualEstoque}%`,
      'Meses Analisados': item.mesesAnalisados,
      'Período': item.produto.periodo,
      'Valor Unitário': `R$ ${item.produto.valor_unitario.toFixed(2).replace('.', ',')}`,
      'Valor Total': `R$ ${item.produto.valor_total.toFixed(2).replace('.', ',')}`,
      'Status': 'Incorreto'
    }))

    // Criar workbook e worksheet
    const workbook = XLSX.utils.book_new()
    const worksheet = XLSX.utils.json_to_sheet(dadosExportacao)

    // Ajustar largura das colunas
    const colunas = [
      { wch: 30 }, // Produto
      { wch: 15 }, // Estoque Atual
      { wch: 20 }, // Média de Vendas
      { wch: 20 }, // Percentual
      { wch: 15 }, // Meses Analisados
      { wch: 25 }, // Período
      { wch: 15 }, // Valor Unitário
      { wch: 15 }, // Valor Total
      { wch: 12 }  // Status
    ]
    worksheet['!cols'] = colunas

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Incorretos')

    const dataAtual = new Date().toLocaleDateString('pt-BR').replace(/\//g, '-')
    const nomeArquivo = `produtos_incorretos_${dataAtual}.xlsx`

    XLSX.writeFile(workbook, nomeArquivo)
  }

  const estatisticas = useMemo(() => {
    if (!isDataValid || isLoading) {
      return { total: 0, critico: 0, baixo: 0, adequado: 0, excesso: 0, incorreto: 0 }
    }

    const total = analiseProdutos.length
    const incorreto = analiseProdutos.filter(p => p.status === 'incorreto').length
    const critico = analiseProdutos.filter(p => p.status === 'critico').length
    const baixo = analiseProdutos.filter(p => p.status === 'baixo').length
    const adequado = analiseProdutos.filter(p => p.status === 'adequado').length
    const excesso = analiseProdutos.filter(p => p.status === 'excesso').length

    return { total, incorreto, critico, baixo, adequado, excesso }
  }, [analiseProdutos, isDataValid, isLoading])

  const getStatusColor = (status: AnaliseProduto['status']) => {
    switch (status) {
      case 'incorreto': return 'text-purple-600 bg-purple-50 border-purple-200'
      case 'critico': return 'text-red-600 bg-red-50 border-red-200'
      case 'baixo': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'adequado': return 'text-green-600 bg-green-50 border-green-200'
      case 'excesso': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: AnaliseProduto['status']) => {
    switch (status) {
      case 'incorreto': return <AlertTriangle className="h-4 w-4" />
      case 'critico': return <AlertTriangle className="h-4 w-4" />
      case 'baixo': return <TrendingDown className="h-4 w-4" />
      case 'adequado': return <TrendingUp className="h-4 w-4" />
      case 'excesso': return <Package className="h-4 w-4" />
      default: return null
    }
  }

  const getStatusText = (status: AnaliseProduto['status']) => {
    switch (status) {
      case 'incorreto': return 'Incorreto'
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
      console.error('Erro ao formatar data:', error)
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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
            <CardTitle className="text-sm font-medium">Incorreto</CardTitle>
            <AlertTriangle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{estatisticas.incorreto}</div>
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Filtrar Produtos</CardTitle>
          <button
            onClick={exportarIncorretos}
            disabled={estatisticas.incorreto === 0}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm cursor-pointer"
          >
            <Download className="h-4 w-4" />
            Exportar Incorretos ({estatisticas.incorreto})
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Campo de pesquisa */}
          <div>
            <label htmlFor="pesquisa" className="block text-sm font-medium text-gray-700 mb-2">
              Pesquisar por nome do produto
            </label>
            <div className="relative">
              <input
                id="pesquisa"
                type="text"
                placeholder="Digite o nome do produto..."
                value={filtroPesquisa}
                onChange={(e) => setFiltroPesquisa(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </span>
            </div>
          </div>

          {/* Filtros por status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por Status
            </label>
            <div className="flex flex-wrap gap-2">
              {(['todos', 'incorreto', 'critico', 'baixo', 'adequado', 'excesso'] as const).map((status) => (
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
          </div>


        </CardContent>
      </Card>

      {/* Lista de produtos */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Estoque por Produto</CardTitle>
          <div className="text-sm text-gray-600">
            {produtosFiltrados.length === analiseProdutos.length
              ? `Exibindo ${produtosPaginados.length} de ${analiseProdutos.length} produtos (página ${paginaAtual} de ${totalPaginas})`
              : `Exibindo ${produtosPaginados.length} de ${produtosFiltrados.length} produtos filtrados (página ${paginaAtual} de ${totalPaginas})`
            }
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {produtosFiltrados.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhum produto encontrado com o filtro selecionado.
              </div>
            ) : (
              produtosPaginados.map((item, index) => (
                <div
                  key={index}
                  className={`p-4 rounded-lg border transition-colors ${item.status === 'incorreto' ? 'bg-purple-50 border-purple-200' :
                    item.status === 'critico' ? 'bg-red-50 border-red-200' :
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
                        <span className="font-medium">Média de vendas (últimos {item.mesesAnalisados} meses):</span> {item.mediaVendas} unidades/mês
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

            {/* Controles de paginação */}
            {totalPaginas > 1 && (
              <div className="flex items-center justify-between pt-6 border-t">
                <div className="text-sm text-gray-700">
                  Página {paginaAtual} de {totalPaginas} ({produtosFiltrados.length} produtos no total)
                </div>

                <div className="flex items-center gap-2">
                  {/* Botão primeira página */}
                  <button
                    onClick={() => setPaginaAtual(1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Primeira
                  </button>

                  {/* Botão página anterior */}
                  <button
                    onClick={() => setPaginaAtual(paginaAtual - 1)}
                    disabled={paginaAtual === 1}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Anterior
                  </button>

                  {/* Números das páginas */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                      let pageNum
                      if (totalPaginas <= 5) {
                        pageNum = i + 1
                      } else if (paginaAtual <= 3) {
                        pageNum = i + 1
                      } else if (paginaAtual >= totalPaginas - 2) {
                        pageNum = totalPaginas - 4 + i
                      } else {
                        pageNum = paginaAtual - 2 + i
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => setPaginaAtual(pageNum)}
                          className={`px-3 py-1 text-sm border rounded-md ${paginaAtual === pageNum
                            ? 'bg-blue-500 text-white border-blue-500'
                            : 'hover:bg-gray-50'
                            }`}
                        >
                          {pageNum}
                        </button>
                      )
                    })}
                  </div>

                  {/* Botão próxima página */}
                  <button
                    onClick={() => setPaginaAtual(paginaAtual + 1)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Próxima
                  </button>

                  {/* Botão última página */}
                  <button
                    onClick={() => setPaginaAtual(totalPaginas)}
                    disabled={paginaAtual === totalPaginas}
                    className="px-3 py-1 text-sm border rounded-md disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Última
                  </button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 