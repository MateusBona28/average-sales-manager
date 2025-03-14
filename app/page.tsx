"use client"
import { FileUploader } from "@/components/file-uploader";
import { ProdutosTable } from "@/components/product-table";
import { useState } from "react";

export default function Home() {
  const [formattedData, setFormattedData] = useState<any[]>([])
  return (
    <main className="flex min-h-screen flex-col pt-10 bg-white">
      <div className="max-w-[100vw] flex flex-col gap-8 items-center">
        <div className="self-center"><FileUploader setFormattedData={setFormattedData} formattedData={formattedData} /></div>
        {formattedData.length > 0 && <div className="w-[100%] flex flex-col gap-8 items-center"><ProdutosTable produtosData={formattedData} /></div>}
      </div>
    </main>
  )
}

