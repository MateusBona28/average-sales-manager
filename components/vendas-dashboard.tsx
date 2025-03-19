"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useVendas } from "@/contexts/VendasContext"
import { DollarSign, Percent, AlertCircle, Calendar } from "lucide-react"

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
  const { vendasData } = useVendas()
  const dados = vendasData || dadosIniciais

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-2 border-sky-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total de Vendas</CardTitle>
          <DollarSign className="h-4 w-4 text-sky-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-sky-600">{formatarMoeda(dados.totalVendas)}</div>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{dados.periodo}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-sky-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Vendas Pendentes</CardTitle>
          <AlertCircle className="h-4 w-4 text-yellow-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-yellow-600">{formatarMoeda(dados.totalPendente)}</div>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{dados.periodo}</span>
          </div>
        </CardContent>
      </Card>

      <Card className="border-2 border-sky-100">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-gray-600">Total de Descontos</CardTitle>
          <Percent className="h-4 w-4 text-red-500" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">{formatarMoeda(dados.totalDescontos)}</div>
          <div className="flex items-center text-sm text-gray-500 mt-2">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{dados.periodo}</span>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

