"use client"

import React, { createContext, useContext, useState } from 'react'

interface VendasData {
  totalVendas: number
  totalPendente: number
  totalDescontos: number
  periodo: string
}

interface VendasContextType {
  vendasData: VendasData | null
  setVendasData: (data: VendasData) => void
}

const VendasContext = createContext<VendasContextType | undefined>(undefined)

export function VendasProvider({ children }: { children: React.ReactNode }) {
  const [vendasData, setVendasData] = useState<VendasData | null>(null)

  return (
    <VendasContext.Provider value={{ vendasData, setVendasData }}>
      {children}
    </VendasContext.Provider>
  )
}

export function useVendas() {
  const context = useContext(VendasContext)
  if (context === undefined) {
    throw new Error('useVendas deve ser usado dentro de um VendasProvider')
  }
  return context
} 