"use client"

import { AnaliseEstoque } from '@/components/analise-estoque'
import { useProdutos } from '@/contexts/ProdutosContext'
import { useVendas } from '@/contexts/VendasContext'

export default function AnaliseEstoquePage() {
  const { formattedData: produtos } = useProdutos()
  const { vendasDiarias: vendas } = useVendas()

  // Verificar se ambos os arquivos estão carregados
  const temProdutos = produtos && produtos.length > 0
  const temVendas = vendas && vendas.length > 0

  if (!temProdutos || !temVendas) {
    return (
      <div className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Análise de Estoque</h1>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Arquivos necessários não encontrados
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Para visualizar a análise de estoque, você precisa carregar:</p>
                  <ul className="list-disc list-inside mt-1 space-y-1">
                    {!temProdutos && <li>Arquivo de produtos</li>}
                    {!temVendas && <li>Arquivo de vendas</li>}
                  </ul>
                  <p className="mt-2">Faça o upload dos arquivos na página inicial para continuar.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Análise de Estoque</h1>
        <AnaliseEstoque produtos={produtos as any} vendas={vendas as any} />
      </div>
    </div>
  )
}