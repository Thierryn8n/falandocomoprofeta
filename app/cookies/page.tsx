import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Cookie, Info, Check, X, Settings } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Política de Cookies | Flando Como Profeta',
  description: 'Saiba mais sobre como usamos cookies no Flando Como Profeta.',
}

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
            <Cookie className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Política de <span className="text-orange-600">Cookies</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Entenda como utilizamos cookies e tecnologias similares para melhorar 
            sua experiência em nossa plataforma.
          </p>
        </div>

        <div className="space-y-6">
          {/* O que são cookies */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-orange-600" />
                <CardTitle>O que são Cookies?</CardTitle>
              </div>
              <CardDescription>
                Pequenos arquivos de texto armazenados no seu dispositivo
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Cookies são pequenos arquivos de texto que um site salva no seu 
                computador ou dispositivo móvel quando você o visita. Eles permitem 
                que o site lembre-se de suas ações e preferências (como login, 
                idioma, tamanho da fonte e outras preferências de exibição) por 
                um período de tempo, para que você não tenha que redefinir 
                sempre que voltar ao site ou navegar de uma página para outra.
              </p>
              <p>
                Além dos cookies, utilizamos outras tecnologias similares como 
                <strong> localStorage</strong>, <strong>sessionStorage</strong> e 
                <strong> web beacons</strong> para armazenar informações no seu navegador.
              </p>
            </CardContent>
          </Card>

          {/* Tipos de cookies */}
          <Card>
            <CardHeader>
              <CardTitle>Tipos de Cookies que Utilizamos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {/* Essenciais */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg shrink-0">
                      <Check className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Cookies Essenciais</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-400 mt-1">
                        Sempre Ativos
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Necessários para o funcionamento básico do site. Sem eles, 
                    a plataforma não funciona corretamente.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                    <li>• Autenticação e sessão de usuário</li>
                    <li>• Segurança (CSRF tokens)</li>
                    <li>• Preferências de idioma</li>
                    <li>• Salvamento de progresso</li>
                  </ul>
                  <div className="mt-3 text-xs text-gray-500">
                    Exemplos: <code>supabase-auth-token</code>, <code>session-id</code>
                  </div>
                </div>

                {/* Analytics */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg shrink-0">
                      <Settings className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Cookies de Analytics</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-400 mt-1">
                        Opcional
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Nos ajudam a entender como os visitantes interagem com o site, 
                    identificando áreas que precisam de melhoria.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                    <li>• Métricas de uso e engajamento</li>
                    <li>• Performance do site</li>
                    <li>• Relatórios de erro</li>
                    <li>• Testes A/B</li>
                  </ul>
                  <div className="mt-3 text-xs text-gray-500">
                    Exemplos: <code>_ga</code>, <code>_gid</code> (Google Analytics)
                  </div>
                </div>

                {/* Marketing */}
                <div className="border rounded-xl p-4">
                  <div className="flex items-start gap-3 mb-3">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg shrink-0">
                      <X className="h-5 w-5 text-orange-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-lg">Cookies de Marketing</h4>
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-400 mt-1">
                        Opcional
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mb-3">
                    Utilizados para personalizar anúncios e conteúdo promocional, 
                    medir a eficácia de campanhas.
                  </p>
                  <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 ml-2">
                    <li>• Anúncios personalizados</li>
                    <li>• Remarketing</li>
                    <li>• Integração com redes sociais</li>
                    <li>• Tracking de conversões</li>
                  </ul>
                  <div className="mt-3 text-xs text-gray-500">
                    Exemplos: <code>_fbp</code>, <code>ads-id</code>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Como gerenciar */}
          <Card>
            <CardHeader>
              <CardTitle>Como Gerenciar Cookies</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Você pode gerenciar suas preferências de cookies de várias formas:
              </p>
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">1. Painel de Preferências</h4>
                  <p className="text-sm mb-3">
                    Use nosso painel de preferências para controlar quais cookies 
                    deseja aceitar.
                  </p>
                  <Link href="/">
                    <Button variant="outline" size="sm">
                      Abrir Preferências
                    </Button>
                  </Link>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">2. Configurações do Navegador</h4>
                  <p className="text-sm mb-2">
                    Todos os navegadores modernos permitem controlar cookies:
                  </p>
                  <ul className="text-sm space-y-1 ml-4">
                    <li><strong>Chrome:</strong> Configurações &gt; Privacidade e segurança &gt; Cookies</li>
                    <li><strong>Firefox:</strong> Opções &gt; Privacidade &amp; Segurança &gt; Cookies</li>
                    <li><strong>Safari:</strong> Preferências &gt; Privacidade &gt; Cookies</li>
                    <li><strong>Edge:</strong> Configurações &gt; Cookies e permissões de site</li>
                  </ul>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">3. Ferramentas de Opt-out</h4>
                  <p className="text-sm">
                    Você pode optar por não participar de cookies de rastreamento 
                    através de ferramentas como:
                  </p>
                  <ul className="text-sm space-y-1 ml-4 mt-2">
                    <li>• Google Analytics Opt-out Browser Add-on</li>
                    <li>• Network Advertising Initiative (NAI) Opt-out</li>
                    <li>• Digital Advertising Alliance (DAA) Consumer Choice</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mais informações */}
          <Card>
            <CardHeader>
              <CardTitle>Mais Informações</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Para mais detalhes sobre como processamos seus dados pessoais, 
                consulte nossa <Link href="/politica-privacidade" className="text-orange-600 hover:underline">Política de Privacidade</Link>.
              </p>
              <p>
                Se tiver dúvidas sobre cookies, entre em contato:
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>E-mail: privacidade@falandocomoprofeta.com.br</li>
                <li>Seção de preferências em sua conta</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Flando Como Profeta. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
