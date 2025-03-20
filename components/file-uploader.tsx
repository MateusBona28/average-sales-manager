"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import * as XLSX from 'xlsx'
import { FileUploadCard } from '@/components/file-upload-card'
import { useProdutos } from '@/contexts/ProdutosContext'
import { useVendas } from '@/contexts/VendasContext'
import { toast } from 'sonner'
import { encryptData, decryptData } from '@/utils/encryption'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Lock } from "lucide-react"

interface ExcelVenda {
  Tipo: string
  Data: number
  Descrição: string
  "Vl.Produtos": string
  Desconto: number
  "Preço de Venda": number
}

interface ProtudoExcel {
  Produto: string
  "Preço": number
}

interface ProdutoBase {
  item: string
  valor_unitario: number
}

interface FormattedItem {
  item: string
  quantidade: number
  periodo: string
  valor_total: number
  valor_unitario: number
  data: Date
  isContaVenda: boolean
}

interface VendaDiaria {
  data: string
  valor: number
  descontos: number
}

export function FileUploader() {
  const router = useRouter()
  const { setFormattedData } = useProdutos()
  const { setVendasDiarias } = useVendas()

  // Estados para o upload da base de dados
  const [isUploadingBase, setIsUploadingBase] = useState(false)
  const [progressBase, setProgressBase] = useState(0)
  const [isErrorBase, setIsErrorBase] = useState(false)
  const [showPasswordDialog, setShowPasswordDialog] = useState(false)
  const [password, setPassword] = useState("")
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Estados para o upload de vendas
  const [isUploadingVendas, setIsUploadingVendas] = useState(false)
  const [progressVendas, setProgressVendas] = useState(0)
  const [isErrorVendas, setIsErrorVendas] = useState(false)

  // Adicionar novo estado após os outros estados
  const [produtosNaoEncontrados, setProdutosNaoEncontrados] = useState<string[]>([]) //eslint-disable-line

  const handlePasswordSubmit = async () => {
    if (password === process.env.NEXT_PRIVATE_DB_PASSWORD) {
      setShowPasswordDialog(false)
      if (selectedFile) {
        await processarBaseDados(selectedFile)
      }
      setPassword("")
      setSelectedFile(null)
    } else {
      toast.error('Senha incorreta', {
        description: 'Por favor, verifique a senha e tente novamente.'
      })
    }
  }

  const handleBaseFileSelect = async (file: File) => {
    setSelectedFile(file)
    setShowPasswordDialog(true)
  }

  const limparCaracteresEspeciais = (texto: string): string => {
    return texto.replace(/["]/g, '').trim()
  }

  const validarBaseDados = (venda: ProtudoExcel): boolean => {
    return (
      venda &&
      typeof venda.Produto === 'string' &&
      venda.Produto.trim() !== '' &&
      typeof venda["Preço"] === 'number' &&
      venda["Preço"] > 0
    )
  }

  const formatarProdutoBase = (produto: string): string => {
    // Faz o split em X e limpa cada parte
    const partes = produto.split('X').map(str => limparCaracteresEspeciais(str))
    // Junta todas as partes com X, pois aqui não tem quantidade
    return partes.join('X').trim()
  }

  const processarBaseDados = async (file: File) => {
    setIsUploadingBase(true)
    setProgressBase(0)

    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ProtudoExcel[]

          // Filtrar e formatar apenas os dados válidos
          const produtosBase: ProdutoBase[] = jsonData
            .filter(validarBaseDados)
            .map(venda => ({
              item: formatarProdutoBase(venda.Produto),
              valor_unitario: Number(venda["Preço"])
            }))
            .sort((a, b) => a.item.localeCompare(b.item))

          // Verificar se há produtos duplicados após a formatação
          const produtosUnicos = new Map<string, ProdutoBase>()
          const duplicados = new Set<string>()

          produtosBase.forEach(produto => {
            if (produtosUnicos.has(produto.item)) {
              duplicados.add(produto.item)
            } else {
              produtosUnicos.set(produto.item, produto)
            }
          })

          // Se houver duplicados, mostrar aviso
          if (duplicados.size > 0) {
            const duplicadosLista = Array.from(duplicados)
            toast.warning('Produtos duplicados encontrados', {
              description: `Os seguintes produtos aparecem mais de uma vez: ${duplicadosLista.join(', ')}`
            })
          }

          // Usar apenas produtos únicos
          const produtosFinais = Array.from(produtosUnicos.values())

          if (produtosFinais.length === 0) {
            throw new Error('Nenhum produto válido encontrado na planilha')
          }

          // Criptografar os dados
          const dadosCriptografados = encryptData(produtosFinais)

          // Enviar para a API route
          const response = await fetch('/api/save-db', {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: dadosCriptografados,
          })

          if (!response.ok) {
            throw new Error('Erro ao salvar arquivo')
          }

          toast.success('Base de dados atualizada com sucesso!', {
            description: `${produtosFinais.length} produtos foram processados.`
          })
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          setIsErrorBase(true)
          toast.error('Erro ao processar arquivo da base de dados', {
            description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
          })
          setTimeout(() => setIsErrorBase(false), 3000)
        } finally {
          setIsUploadingBase(false)
          setProgressBase(0)
        }
      }

      reader.onerror = () => {
        setIsErrorBase(true)
        toast.error('Erro ao ler arquivo da base de dados', {
          description: 'Verifique se o arquivo está correto e tente novamente.'
        })
        setTimeout(() => setIsErrorBase(false), 3000)
        setIsUploadingBase(false)
        setProgressBase(0)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsErrorBase(true)
      toast.error('Erro ao processar arquivo da base de dados', {
        description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
      })
      setTimeout(() => setIsErrorBase(false), 3000)
      setIsUploadingBase(false)
      setProgressBase(0)
    }
  }

  const formatarDescricao = (descricao: string) => {
    const partes = descricao.split('X').map(str => limparCaracteresEspeciais(str))

    if (partes.length > 2) {
      // Se tiver mais de 2 partes, a primeira é quantidade e o resto é a descrição
      const quantidade = partes[0]
      const descricaoCompleta = partes.slice(1).join('X').trim()
      return { quantidade, descricao: descricaoCompleta }
    } else {
      // Se tiver 2 ou menos partes, mantém o comportamento atual
      return { quantidade: partes[0], descricao: partes[1] }
    }
  }

  const buscarBaseDados = async (): Promise<ProdutoBase[]> => {
    try {
      const response = await fetch('/api/read-db')
      if (!response.ok) {
        throw new Error('Erro ao ler base de dados')
      }
      const dadosCriptografados = await response.text()
      const baseDados = decryptData(dadosCriptografados) as ProdutoBase[]

      if (!baseDados || baseDados.length === 0) {
        throw new Error('Base de dados está vazia')
      }

      return baseDados
    } catch (error) {
      console.error('Erro ao buscar base de dados:', error)
      throw new Error('Não foi possível acessar a base de dados. Por favor, verifique se a base de dados foi carregada.')
    }
  }

  const formatAndSetProductsData = async (vendas: ExcelVenda[]) => {
    try {
      // Buscar base de dados primeiro
      const baseDados = await buscarBaseDados()
      const naoEncontrados = new Set<string>()

      // Mapear e processar os itens
      const itensProcessados = vendas.flatMap((venda) => {
        const processarItem = (descricao: string, data: Date): FormattedItem | null => {
          const resultado = formatarDescricao(descricao)
          const isContaVenda = resultado.descricao.toUpperCase().includes('CONTA VENDA')

          if (isContaVenda) {
            // Para CONTA VENDA, usar o valor da própria venda
            const valorString = venda["Vl.Produtos"].replace('R$', '').trim()
            const valor = parseFloat(valorString.replace('.', '').replace(',', '.'))

            return {
              item: resultado.descricao,
              quantidade: parseInt(resultado.quantidade),
              data,
              valor_unitario: valor / parseInt(resultado.quantidade), // Calcula valor unitário
              valor_total: valor,
              periodo: '', // será preenchido depois
              isContaVenda: true
            }
          }

          // Buscar valor unitário na base de dados para itens normais
          const produtoBase = baseDados.find(p => p.item === resultado.descricao)
          if (!produtoBase) {
            naoEncontrados.add(resultado.descricao)
            return null
          }

          return {
            item: resultado.descricao,
            quantidade: parseInt(resultado.quantidade),
            data,
            valor_unitario: produtoBase.valor_unitario,
            valor_total: produtoBase.valor_unitario * parseInt(resultado.quantidade),
            periodo: '', // será preenchido depois
            isContaVenda: false
          }
        }

        const data = new Date(venda.Data * 24 * 60 * 60 * 1000 + new Date(Date.UTC(1899, 11, 30)).getTime())

        if (venda.Descrição.includes('\r\n')) {
          // Se tiver quebra de linha, processa cada linha separadamente
          const linhas = venda.Descrição.split('\r\n')
          return linhas.map(linha => processarItem(linha, data)).filter((item): item is FormattedItem => item !== null)
        } else {
          // Se não tiver quebra de linha, processa normalmente
          const item = processarItem(venda.Descrição, data)
          return item ? [item] : []
        }
      })

      // Atualizar o estado dos produtos não encontrados
      setProdutosNaoEncontrados(Array.from(naoEncontrados).sort())

      // Se tiver produtos não encontrados, mostrar toast de aviso
      if (naoEncontrados.size > 0) {
        toast.warning('Alguns produtos não foram encontrados na base de dados', {
          description: `${naoEncontrados.size} produtos não foram processados por não estarem cadastrados.`
        })
      }

      // Continua apenas se houver itens processados
      if (itensProcessados.length === 0) {
        throw new Error('Nenhum produto válido encontrado na planilha de vendas')
      }

      // Encontrar a menor e maior data de todas as vendas
      const datas = itensProcessados.map(item => item.data)
      const dataMin = new Date(Math.min(...datas.map(d => d.getTime())))
      const dataMax = new Date(Math.max(...datas.map(d => d.getTime())))

      // Formatar o período global
      const formatarData = (date: Date) => {
        const dia = date.getDate().toString().padStart(2, '0')
        const mes = (date.getMonth() + 1).toString().padStart(2, '0')
        const ano = date.getFullYear()
        return `${dia}/${mes}/${ano}`
      }

      const periodoGlobal = `${formatarData(dataMin)} até ${formatarData(dataMax)}`

      // Reduzir para somar quantidades de itens iguais
      const itensAgrupados = itensProcessados.reduce<FormattedItem[]>((acc, curr) => {
        const itemExistente = acc.find((item) => item.item === curr.item)
        if (itemExistente) {
          itemExistente.quantidade += curr.quantidade
          itemExistente.valor_total += curr.valor_total
          // Recalcula o valor unitário médio para CONTA VENDA
          if (itemExistente.isContaVenda) {
            itemExistente.valor_unitario = itemExistente.valor_total / itemExistente.quantidade
          }
        } else {
          acc.push({
            ...curr,
            periodo: periodoGlobal
          })
        }
        return acc
      }, [])

      // Ordenar por descrição
      const itensFinais = itensAgrupados.sort((a, b) => a.item.localeCompare(b.item))

      setFormattedData(itensFinais)
    } catch (error) {
      console.error('Erro ao processar vendas:', error)
      throw error
    }
  }

  const formatAndSetDailySales = (vendas: ExcelVenda[]) => {
    // Agrupar vendas por data
    const vendasPorDia = vendas.reduce<Record<string, { valor: number; descontos: number }>>((acc, venda) => {
      // Converter número do Excel para data JavaScript
      const excelDate = venda.Data
      const millisecondsPerDay = 24 * 60 * 60 * 1000
      const excelEpoch = new Date(Date.UTC(1899, 11, 30))
      const date = new Date(excelEpoch.getTime() + (excelDate * millisecondsPerDay))

      // Formatar a data como chave (DD/MM/YYYY)
      const dataFormatada = date.toLocaleDateString('pt-BR')

      // Extrair e converter valor dos produtos
      const valorString = venda["Vl.Produtos"].replace('R$', '').trim()
      const valor = parseFloat(valorString.replace('.', '').replace(',', '.'))

      // Extrair e converter valor dos descontos
      const desconto = venda.Desconto || 0 // Se não tiver desconto, usa 0

      // Acumular valores para a data
      if (!acc[dataFormatada]) {
        acc[dataFormatada] = { valor: 0, descontos: 0 }
      }

      acc[dataFormatada].valor += valor
      acc[dataFormatada].descontos += desconto

      return acc
    }, {})

    // Converter objeto em array e ordenar por data
    const vendasDiarias: VendaDiaria[] = Object.entries(vendasPorDia).map(([data, valores]) => ({
      data,
      valor: Number((valores.valor - valores.descontos).toFixed(2)), // Subtrai os descontos do valor total
      descontos: Number(valores.descontos.toFixed(2))
    })).sort((a, b) => {
      const [diaA, mesA, anoA] = a.data.split('/').map(Number)
      const [diaB, mesB, anoB] = b.data.split('/').map(Number)
      return new Date(anoA, mesA - 1, diaA).getTime() - new Date(anoB, mesB - 1, diaB).getTime()
    })

    setVendasDiarias(vendasDiarias)
  }

  const processarVendas = async (file: File) => {
    setIsUploadingVendas(true)
    setProgressVendas(0)

    try {
      const reader = new FileReader()

      reader.onload = async (e) => {
        try {
          const data = e.target?.result
          const workbook = XLSX.read(data, { type: 'array' })
          const firstSheetName = workbook.SheetNames[0]
          const worksheet = workbook.Sheets[firstSheetName]
          const jsonData = XLSX.utils.sheet_to_json(worksheet) as ExcelVenda[]

          // Filtrar apenas vendas
          const vendas = jsonData.filter((item) => item.Tipo === "Venda")

          if (vendas.length === 0) {
            throw new Error('Nenhuma venda encontrada na planilha')
          }

          // Processar produtos
          await formatAndSetProductsData(vendas)

          // Processar vendas diárias
          formatAndSetDailySales(vendas)

          toast.success('Planilha de vendas processada com sucesso!', {
            description: `${vendas.length} vendas foram processadas.`
          })

          router.push('/visao-geral')
        } catch (error) {
          console.error('Erro ao processar arquivo:', error)
          setIsErrorVendas(true)
          toast.error('Erro ao processar arquivo de vendas', {
            description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
          })
          setTimeout(() => setIsErrorVendas(false), 3000)
        }
      }

      reader.onerror = () => {
        setIsErrorVendas(true)
        toast.error('Erro ao ler arquivo de vendas', {
          description: 'Verifique se o arquivo está correto e tente novamente.'
        })
        setTimeout(() => setIsErrorVendas(false), 3000)
      }

      reader.readAsArrayBuffer(file)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsErrorVendas(true)
      toast.error('Erro ao processar arquivo de vendas', {
        description: error instanceof Error ? error.message : 'Verifique se o arquivo está correto e tente novamente.'
      })
      setTimeout(() => setIsErrorVendas(false), 3000)
    } finally {
      setIsUploadingVendas(false)
      setProgressVendas(0)
    }
  }

  return (
    <>
      <div className="flex flex-row gap-6">
        <FileUploadCard
          title="Enviar Base de Dados"
          description="Faça upload da planilha com os dados dos produtos"
          onFileSelect={handleBaseFileSelect}
          isUploading={isUploadingBase}
          progress={progressBase}
          isError={isErrorBase}
        />
        <FileUploadCard
          title="Enviar Vendas"
          description="Faça upload da planilha com os dados das vendas"
          onFileSelect={processarVendas}
          isUploading={isUploadingVendas}
          progress={progressVendas}
          isError={isErrorVendas}
        />
      </div>

      <Dialog open={showPasswordDialog} onOpenChange={setShowPasswordDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Senha Necessária</DialogTitle>
            <DialogDescription>
              Digite a senha para processar a base de dados
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 border rounded-lg p-2">
              <Lock className="h-4 w-4 text-gray-500" />
              <Input
                type="password"
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border-0 focus-visible:ring-0"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handlePasswordSubmit()
                  }
                }}
              />
            </div>
            <Button onClick={handlePasswordSubmit}>
              Confirmar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

