"use client"
import { FileUploader } from "@/components/file-uploader"

export default function Home() {
  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Upload de Planilha</h1>
      <FileUploader />
    </div>
  )
}

