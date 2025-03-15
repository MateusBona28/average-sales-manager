"use client"

import { CartesianGrid, Line, LineChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts"

interface VendaItem {
  data: string
  valor: number
  descontos: number
}

interface VendasChartProps {
  dados: VendaItem[]
}

export function VendasChart({ dados }: VendasChartProps) {
  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    })
  }

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={dados}
        margin={{
          top: 20,
          right: 30,
          left: 20,
          bottom: 65
        }}
      >
        <CartesianGrid strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="data"
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
          angle={-45}
          textAnchor="end"
          height={60}
        />
        <YAxis
          tickFormatter={formatCurrency}
          tickLine={false}
          axisLine={false}
          tick={{ fontSize: 12 }}
        />
        <Tooltip
          formatter={formatCurrency}
          labelFormatter={(label) => `Data: ${label}`}
          contentStyle={{
            backgroundColor: 'white',
            border: '1px solid #ccc',
            borderRadius: '4px',
            padding: '8px'
          }}
        />
        <Line
          type="monotone"
          dataKey="valor"
          name="Vendas"
          stroke="#0ea5e9"
          strokeWidth={2}
          dot={{ r: 4, fill: "#0ea5e9" }}
          activeDot={{ r: 6 }}
        />
        <Line
          type="monotone"
          dataKey="descontos"
          name="Descontos"
          stroke="#ef4444"
          strokeWidth={2}
          dot={{ r: 4, fill: "#ef4444" }}
          activeDot={{ r: 6 }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

