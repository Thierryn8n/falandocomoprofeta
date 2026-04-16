import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { XCircle, ArrowLeft, FileText, Shield, HelpCircle } from 'lucide-react'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Acesso Negado | Flando Como Profeta',
  description: 'Você precisa aceitar os Termos de Uso para acessar a plataforma.',
}

export default function TermosRecusadosPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <Card className="border-red-200 dark:border-red-800">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-red-100 dark:bg-red-900/30 rounded-full">
                <XCircle className="h-12 w-12 text-red-600" />
              </div>
            </div>
            <CardTitle className="text-2xl text-red-600">
              Aceitação Necessária
            </CardTitle>
            <CardDescription>
              Você escolheu não aceitar nossos Termos de Uso e Política de Privacidade.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg">
              <p className="text-gray-700 dark:text-gray-300 text-center">
                Sem aceitar estes documentos, não podemos permitir o acesso à plataforma 
                pois precisamos garantir:
              </p>
              <ul className="mt-4 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  Sua segurança e privacidade de dados
                </li>
                <li className="flex items-start gap-2">
                  <FileText className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  Conformidade com a LGPD (Lei de Proteção de Dados)
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                  Um ambiente seguro para todos os usuários
                </li>
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-medium text-center">O que você pode fazer:</h4>
              
              <div className="grid gap-3">
                <Link href="/termos-de-uso" target="_blank">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Ler os Termos de Uso
                    </span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </Link>

                <Link href="/politica-privacidade" target="_blank">
                  <Button variant="outline" className="w-full justify-between">
                    <span className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Ler a Política de Privacidade
                    </span>
                    <ArrowLeft className="h-4 w-4 rotate-180" />
                  </Button>
                </Link>

                <Link href="/">
                  <Button className="w-full bg-orange-600 hover:bg-orange-700">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar e Aceitar os Termos
                  </Button>
                </Link>
              </div>
            </div>

            <div className="pt-4 border-t text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                Tem dúvidas sobre nossos termos?
              </p>
              <a 
                href="mailto:legal@falandocomoprofeta.com.br"
                className="text-sm text-orange-600 hover:underline inline-flex items-center gap-1"
              >
                <HelpCircle className="h-4 w-4" />
                Fale com nosso time jurídico
              </a>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          © {new Date().getFullYear()} Flando Como Profeta. Todos os direitos reservados.
        </p>
      </div>
    </div>
  )
}
