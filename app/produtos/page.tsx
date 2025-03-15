"use client"

import { ProdutosTable } from "@/components/product-table"

export default function ProdutosPage() {

  return (
    <div className="h-full flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 pb-4">Lista de Produtos</h1>
      <div className="w-[100%]">
        <ProdutosTable />
      </div>
    </div>
  )
} 