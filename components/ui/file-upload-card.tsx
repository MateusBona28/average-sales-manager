"use client"

import { useState, useRef } from "react"
import { Upload, FileUp, AlertCircle, X } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"

interface FileUploadCardProps {
  title: string
  description?: string
  onFileProcess: (file: File) => Promise<void>
  accept?: string
}

export function FileUploadCard({
  title,
  description,
  onFileProcess,
  accept = ".xlsx,.xls"
}: FileUploadCardProps) {
  const [isError, setIsError] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [file, setFile] = useState<File | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0]
      if (
        selectedFile.type === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" || // .xlsx
        selectedFile.type === "application/vnd.ms-excel" // .xls
      ) {
        setFile(selectedFile)
        setIsError(false)
      } else {
        setIsError(true)
        setTimeout(() => setIsError(false), 3000)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setIsError(true)
      setTimeout(() => setIsError(false), 3000)
      return
    }

    setIsUploading(true)
    setProgress(0)

    try {
      await onFileProcess(file)
    } catch (error) {
      console.error('Erro ao processar arquivo:', error)
      setIsError(true)
      setTimeout(() => setIsError(false), 3000)
    } finally {
      setIsUploading(false)
      setProgress(0)
    }
  }

  const handleRemoveFile = () => {
    setFile(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  return (
    <Card className="border-2 border-sky-100 h-[fit-content]">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl font-semibold text-gray-800">{title}</CardTitle>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {isError ? (
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="flex items-center justify-center bg-red-50 text-red-500 rounded-lg p-4 w-full">
                <AlertCircle className="h-6 w-6 mr-2" />
                <span>Por favor, envie apenas arquivos .xlsx ou .xls</span>
              </div>
              <Button
                onClick={() => setIsError(false)}
                variant="outline"
                className="border-sky-200 text-sky-700 hover:bg-sky-50"
              >
                Tente novamente
              </Button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Input
                  ref={fileInputRef}
                  type="file"
                  accept={accept}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-sky-200 rounded-lg p-6 cursor-pointer hover:border-sky-300 transition-colors"
                >
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Upload className="h-8 w-8 text-sky-500" />
                    <p className="text-sm text-gray-500 text-center">
                      {file ? file.name : "Clique para selecionar um arquivo"}
                    </p>
                    <p className="text-xs text-gray-400">
                      Apenas arquivos .xlsx ou .xls
                    </p>
                  </div>
                </div>
                {file && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-white border border-gray-200 hover:bg-gray-100"
                    onClick={handleRemoveFile}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              <Button
                type="submit"
                className="w-full bg-sky-500 hover:bg-sky-600 text-white"
                disabled={isUploading || !file}
              >
                {isUploading ? (
                  <div className="flex items-center space-x-2">
                    <FileUp className="h-4 w-4 animate-pulse" />
                    <span>Processando...</span>
                    <Progress value={progress} className="w-24 h-1 bg-sky-100" />
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Upload className="h-4 w-4" />
                    <span>Enviar</span>
                  </div>
                )}
              </Button>
            </>
          )}
        </form>
      </CardContent>
    </Card>
  )
} 