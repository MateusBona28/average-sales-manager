"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Search } from "lucide-react"

// Tipo para os produtos
interface Produto {
  id: number
  item: string
  quantidade: number
  periodo: string
}

export function ProdutosTable({ produtosData }: { produtosData: Produto[] }) {
  const [searchTerm, setSearchTerm] = useState("")

  // Filtra os produtos com base no termo de busca
  const filteredProdutos = produtosData.filter((produto) =>
    produto.item.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="space-y-4 w-[80%]">
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
              <TableHead className="font-semibold text-right">Quantidade</TableHead>
              <TableHead className="font-semibold">Período</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProdutos.length > 0 ? (
              filteredProdutos.map((produto) => (
                <TableRow key={produto.id} className="hover:bg-sky-50">
                  <TableCell className="font-medium">{produto.item}</TableCell>
                  <TableCell className="text-right">{produto.quantidade}</TableCell>
                  <TableCell>{produto.periodo}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-6 text-gray-500">
                  Nenhum produto encontrado com o termo "{searchTerm}"
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-gray-500">
        Exibindo {filteredProdutos.length} de {produtosData.length} produtos
      </div>
    </div>
  )
}

