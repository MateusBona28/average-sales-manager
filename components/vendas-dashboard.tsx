"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVendas } from "@/contexts/VendasContext"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Função para formatar valores em reais
const formatarMoeda = (valor: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(valor)
}

// Dados iniciais para os cards
const dadosIniciais = {
  totalVendas: 0,
  totalPendente: 0,
  totalDescontos: 0,
  periodo: 'Nenhum período selecionado'
}

export function VendasDashboard() {
  const { vendasDiarias } = useVendas()

  const dados = vendasDiarias.length > 0 ? {
    totalVendas: vendasDiarias.reduce((acc, venda) => acc + venda.valor, 0),
    totalPendente: 0,
    totalDescontos: vendasDiarias.reduce((acc, venda) => acc + venda.descontos, 0),
    periodo: `${vendasDiarias[0].data} até ${vendasDiarias[vendasDiarias.length - 1].data}`
  } : dadosIniciais

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Vendas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(dados.totalVendas)}</div>
            <p className="text-xs text-muted-foreground">
              {dados.periodo}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pendente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(dados.totalPendente)}</div>
            <p className="text-xs text-muted-foreground">
              {dados.periodo}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Descontos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatarMoeda(dados.totalDescontos)}</div>
            <p className="text-xs text-muted-foreground">
              {dados.periodo}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Vendas Diárias</CardTitle>
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

