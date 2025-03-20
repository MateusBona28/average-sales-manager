"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { useVendas } from "@/contexts/VendasContext"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { DollarSign, Tag, TrendingUp } from 'lucide-react'

// Função para formatar valores em reais
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

export function VendasDashboard() {
  const { vendasDiarias } = useVendas()

  // Calcular totais
  const totalVendas = vendasDiarias.reduce((acc, venda) => acc + venda.valor, 0)
  const totalDescontos = vendasDiarias.reduce((acc, venda) => acc + venda.descontos, 0)
  const mediaVendas = totalVendas / (vendasDiarias.length || 1)

  // Calcular período
  const periodo = vendasDiarias.length > 0
    ? `${vendasDiarias[0].data} até ${vendasDiarias[vendasDiarias.length - 1].data}`
    : 'Nenhum período selecionado'

  return (
    <div className="p-6">
      <div className="grid gap-4 md:grid-cols-3 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Vendas
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(totalVendas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Valor líquido (descontos já subtraídos)
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Período: {periodo}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Descontos
            </CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(totalDescontos)}
            </div>
            <p className="text-xs text-muted-foreground">
              Soma de todos os descontos aplicados
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Período: {periodo}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Média de Vendas Diária
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatarMoeda(mediaVendas)}
            </div>
            <p className="text-xs text-muted-foreground">
              Média por dia no período
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Período: {periodo}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas por Dia</CardTitle>
          <CardDescription>
            Valores de vendas e descontos por dia no período: {periodo}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[400px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={vendasDiarias}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="data" />
                <YAxis />
                <Tooltip
                  formatter={(value: number) => formatarMoeda(value)}
                  labelFormatter={(label) => `Data: ${label}`}
                />
                <Line
                  type="monotone"
                  dataKey="valor"
                  stroke="#2563eb"
                  name="Vendas"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="descontos"
                  stroke="#dc2626"
                  name="Descontos"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

