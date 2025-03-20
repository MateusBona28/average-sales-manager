"use client"

import { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, FileText, Loader2 } from "lucide-react"

interface FileUploadCardProps {
  title: string
  description: string
  accept: string
  onFileSelect: (file: File) => Promise<void>
  isUploading: boolean
  progress: number
  isError: boolean
}

export function FileUploadCard({
  title,
  description,
  accept,
  onFileSelect,
  isUploading,
  progress,
  isError
}: FileUploadCardProps) {
  const [isDragging, setIsDragging] = useState(false)

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onFileSelect(acceptedFiles[0])
    }
  }, [onFileSelect])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    maxFiles: 1,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false)
  })

  return (
    <Card className={`transition-colors ${isError ? 'border-red-500' : ''}`}>
      <CardHeader>
        <CardTitle className="text-lg">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors duration-200 ease-in-out
            ${isDragging ? 'border-sky-500 bg-sky-50' : 'border-gray-300 hover:border-sky-500 hover:bg-sky-50'}
            ${isError ? 'border-red-500 bg-red-50' : ''}
          `}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="space-y-4">
              <Loader2 className="h-8 w-8 animate-spin mx-auto text-sky-500" />
              <div className="text-sm text-gray-600">
                Processando arquivo... {progress}%
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex justify-center">
                {isDragActive ? (
                  <Upload className="h-8 w-8 text-sky-500" />
                ) : (
                  <FileText className="h-8 w-8 text-gray-400" />
                )}
              </div>
              <div className="text-sm text-gray-600">
                {isDragActive
                  ? "Solte o arquivo aqui"
                  : "Arraste e solte um arquivo aqui, ou clique para selecionar"}
              </div>
              <div className="text-xs text-gray-500">
                {description}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
} 