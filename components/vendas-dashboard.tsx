"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Calendar } from "lucide-react"
import { VendasChart } from "@/components/vendas-chart"
import { useVendas } from "@/contexts/VendasContext"

export function VendasDashboard() {
  const { vendasDiarias } = useVendas()

  // Calcular totais
  const totalVendas = vendasDiarias.reduce((total, item) => total + item.valor, 0)
  const totalDescontos = vendasDiarias.reduce((total, item) => total + item.descontos, 0)

  // Encontrar data inicial e final
  const dataInicial = vendasDiarias.length > 0 ? vendasDiarias[0].data : ''
  const dataFinal = vendasDiarias.length > 0 ? vendasDiarias[vendasDiarias.length - 1].data : ''
  const periodo = vendasDiarias.length > 0 ? `${dataInicial} até ${dataFinal}` : 'Nenhum período'

  return (
    <div className="flex flex-col h-full gap-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-sky-500 mr-2" />
                <span className="text-3xl font-bold">
                  {totalVendas.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{periodo}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-medium">Total de Descontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2">
              <div className="flex items-center">
                <DollarSign className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-3xl font-bold">
                  {totalDescontos.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
                </span>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-1" />
                <span>{periodo}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Vendas por Período</CardTitle>
        </CardHeader>
        <CardContent className="flex-1">
          <div className="h-full min-h-[400px]">
            <VendasChart dados={vendasDiarias} />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

