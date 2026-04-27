'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Home, ArrowLeft } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F4ECD8] p-4">
      <Card className="w-full max-w-md border-[#D4C4A8] bg-[#FAF3E8]">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-[#5C4D3C]">Página não encontrada</CardTitle>
          <CardDescription className="text-[#6B5D4C]">
            A página que você está procurando não existe ou foi movida.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-6xl font-bold text-[#8B7355] mb-4">404</div>
          </div>
          <div className="flex flex-col gap-2">
            <Button asChild className="w-full bg-gradient-to-r from-[#8B7355] to-[#A89080] hover:from-[#7A6545] hover:to-[#978070] text-white">
              <Link href="/">
                <Home className="mr-2 h-4 w-4" />
                Voltar ao início
              </Link>
            </Button>
            <Button 
              variant="outline" 
              className="w-full border-[#D4C4A8] text-[#8B7355] hover:bg-[#E8DCC8]"
              onClick={() => {
                if (typeof window !== 'undefined') {
                  window.history.back()
                }
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}