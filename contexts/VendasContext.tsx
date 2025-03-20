"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface VendaDiaria {
  data: string
  valor: number
  descontos: number
}

interface VendasContextType {
  vendasDiarias: VendaDiaria[]
  setVendasDiarias: (data: VendaDiaria[]) => void
}

const VendasContext = createContext<VendasContextType | undefined>(undefined)

export function VendasProvider({ children }: { children: ReactNode }) {
  const [vendasDiarias, setVendasDiarias] = useState<VendaDiaria[]>([])

  return (
    <VendasContext.Provider value={{ vendasDiarias, setVendasDiarias }}>
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