"use client"

import { VendasDashboard } from "@/components/vendas-dashboard"
import { useVendas } from "@/contexts/VendasContext"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function VisaoGeralPage() {
  const router = useRouter()
  const { vendasDiarias } = useVendas()

  useEffect(() => {
    if (!vendasDiarias.length) {
      router.push("/")
    }
  }, [vendasDiarias.length, router])

  if (!vendasDiarias.length) {
    return null
  }

  return (
    <div className="h-[calc(100vh-10rem)] flex flex-col">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Visão Geral das Vendas</h1>
      <div className="flex-1">
        <VendasDashboard />
      </div>
    </div>
  )
}

