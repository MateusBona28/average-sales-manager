"use client"

import React, { createContext, useContext, useState } from 'react'

interface Produto {
  item: string
  quantidade: number
  periodo: string
  valor_total: number
  valor_unitario: number
}

interface ProdutosContextType {
  formattedData: Produto[] | null
  setFormattedData: (data: Produto[]) => void
}

const ProdutosContext = createContext<ProdutosContextType | undefined>(undefined)

export function ProdutosProvider({ children }: { children: React.ReactNode }) {
  const [formattedData, setFormattedData] = useState<Produto[] | null>(null)

  return (
    <ProdutosContext.Provider value={{ formattedData, setFormattedData }}>
      {children}
    </ProdutosContext.Provider>
  )
}

export function useProdutos() {
  const context = useContext(ProdutosContext)
  if (context === undefined) {
    throw new Error('useProdutos deve ser usado dentro de um ProdutosProvider')
  }
  return context
} 