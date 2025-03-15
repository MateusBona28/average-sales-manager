"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useProdutos } from "@/contexts/ProdutosContext"

type SortField = "quantidade" | "valor_total" | null

// Função para formatar valores em reais
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

const ITENS_POR_PAGINA = 12

export function ProdutosTable() {
  const { formattedData } = useProdutos()
  const [searchTerm, setSearchTerm] = useState("")
  const [sortField, setSortField] = useState<SortField>(null)
  const [currentPage, setCurrentPage] = useState(1)

  // Filtra os produtos com base no termo de busca
  const filteredProdutos = formattedData.filter((produto) =>
    produto.item.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  // Ordena os produtos
  const sortedProdutos = [...filteredProdutos].sort((a, b) => {
    if (!sortField) return 0
    return b[sortField] - a[sortField]
  })

  // Calcula a paginação
  const totalPages = Math.ceil(sortedProdutos.length / ITENS_POR_PAGINA)
  const startIndex = (currentPage - 1) * ITENS_POR_PAGINA
  const paginatedProdutos = sortedProdutos.slice(startIndex, startIndex + ITENS_POR_PAGINA)

  // Função para alternar ordenação
  const toggleSort = (field: SortField) => {
    setSortField(sortField === field ? null : field)
  }

  return (
    <div className="space-y-4 w-[100%]">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
        <Input
          placeholder="Buscar produtos por nome..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10 border-sky-200 focus-visible:ring-sky-500"
        />
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader className="bg-sky-50">
            <TableRow>
              <TableHead className="font-semibold">Nome</TableHead>
              <TableHead className="font-semibold text-right">
                <button
                  onClick={() => toggleSort("quantidade")}
                  className="inline-flex items-center hover:text-sky-600"
                >
                  Quantidade
                  <ArrowUpDown size={16} className={`ml-1 ${sortField === "quantidade" ? "text-sky-600" : ""}`} />
                </button>
              </TableHead>
              <TableHead className="font-semibold text-right">Valor Unitário</TableHead>
              <TableHead className="font-semibold text-right">
                <button
                  onClick={() => toggleSort("valor_total")}
                  className="inline-flex items-center hover:text-sky-600"
                >
                  Valor Total
                  <ArrowUpDown size={16} className={`ml-1 ${sortField === "valor_total" ? "text-sky-600" : ""}`} />
                </button>
              </TableHead>
              <TableHead className="font-semibold">Período</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProdutos.length > 0 ? (
              paginatedProdutos.map((produto, index) => (
                <TableRow key={index} className="hover:bg-sky-50">
                  <TableCell className="font-medium">{produto.item}</TableCell>
                  <TableCell className="text-right">{produto.quantidade}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(produto.valor_unitario)}</TableCell>
                  <TableCell className="text-right">{formatarMoeda(produto.valor_total)}</TableCell>
                  <TableCell>{produto.periodo}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-gray-500">
                  Nenhum produto encontrado com o termo &quot;{searchTerm}&quot;
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between text-sm text-gray-500 pb-4">
        <div>
          Exibindo {startIndex + 1}-{Math.min(startIndex + ITENS_POR_PAGINA, filteredProdutos.length)} de {filteredProdutos.length} produtos
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span>
            Página {currentPage} de {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  )
}

