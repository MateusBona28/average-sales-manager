"use client"

import { Home, Upload, Settings } from "lucide-react"
import { Table, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Button } from "./button"

export function Sidebar() {
  const pathname = usePathname()
  const [isCollapsed, setIsCollapsed] = useState(false)

  const menuItems = [
    {
      title: "Upload",
      icon: Upload,
      href: "/",
    },
    {
      title: "Produtos",
      icon: Table,
      href: "/produtos",
    },
    /*{
      title: "Visão Geral",
      icon: BarChart,
      href: "/visao-geral",
    },*/
  ]

  return (
    <div
      className={cn(
        "flex h-full flex-col bg-white border-r relative transition-all duration-300 ease-in-out",
        isCollapsed ? "w-[70px]" : "w-[200px]"
      )}
    >
      <Button
        variant="ghost"
        size="icon"
        className="absolute -right-3 top-6 h-6 w-6 rounded-full border bg-white shadow-md"
        onClick={() => setIsCollapsed(!isCollapsed)}
      >
        {isCollapsed ? (
          <ChevronRight className="h-4 w-4" />
        ) : (
          <ChevronLeft className="h-4 w-4" />
        )}
      </Button>
      <div className="flex h-14 items-center border-b px-4">
        <span className={cn(
          "font-semibold whitespace-nowrap transition-all duration-300",
          isCollapsed ? "scale-90 opacity-100" : "opacity-100"
        )}>
        </span>
      </div>
      <nav className="flex-1 space-y-1 p-2">
        {menuItems.map((item) => {
          const isActive = pathname === item.href
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-x-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-300",
                isActive
                  ? "bg-sky-50 text-sky-700"
                  : "text-gray-700 hover:bg-gray-50 hover:text-gray-900",
                isCollapsed && "justify-center"
              )}
              title={isCollapsed ? item.title : undefined}
            >
              <item.icon className="h-5 w-5 flex-shrink-0" />
              <span
                className={cn(
                  "transition-all duration-300",
                  isCollapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                )}
              >
                {item.title}
              </span>
            </Link>
          )
        })}
      </nav>
    </div>
  )
} 