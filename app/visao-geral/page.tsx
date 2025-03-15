"use client"

import { VendasDashboard } from "@/components/vendas-dashboard"

export default function VisaoGeralPage() {
  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Visão Geral das Vendas</h1>
      <div className="flex-1">
        <VendasDashboard />
      </div>
    </div>
  )
}

