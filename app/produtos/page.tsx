"use client"

import { ProdutosTable } from "@/components/product-table"

export default function ProdutosPage() {

  return (
    <div className="h-full flex flex-col justify-center items-center">
      <div className="w-[80%]">
        <h1 className="text-2xl font-bold text-gray-900 pb-4">Lista de Produtos</h1>
      </div>
      <ProdutosTable />
    </div>
  )
} 