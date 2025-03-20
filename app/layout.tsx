import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { ProdutosProvider } from "@/contexts/ProdutosContext"
import { VendasProvider } from "@/contexts/VendasContext"
import { Sidebar } from "@/components/ui/sidebar"
import { Toaster } from 'sonner'

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Lojinho",
  description: "Aplicação para processamento de arquivos Excel",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <ProdutosProvider>
          <VendasProvider>
            <div className="flex h-screen overflow-hidden">
              <Sidebar />
              <main className="flex-1 overflow-y-auto bg-gray-50 p-8 transition-all duration-300">
                {children}
              </main>
            </div>
          </VendasProvider>
        </ProdutosProvider>
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}

