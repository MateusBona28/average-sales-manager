"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign } from "lucide-react"
import { VendasChart } from "@/components/vendas-chart"
import { useVendas } from "@/contexts/VendasContext"

export function VendasDashboard() {
  const { vendasDiarias } = useVendas()

  // Calcular totais
  const totalVendas = vendasDiarias.reduce((total, item) => total + item.valor, 0)
  const totalDescontos = vendasDiarias.reduce((total, item) => total + item.descontos, 0)

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-sky-500 mr-2" />
              <span className="text-3xl font-bold">
                {totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total de Descontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-3xl font-bold">
                {totalDescontos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="col-span-1 md:col-span-2 lg:col-span-4">
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <VendasChart dados={vendasDiarias} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

