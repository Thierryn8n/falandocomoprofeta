import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Shield, Eye, Lock, User, Database, Clock, Globe, Mail } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Política de Privacidade | Flando Como Profeta',
  description: 'Política de Privacidade e LGPD do Flando Como Profeta. Saiba como protegemos seus dados.',
}

export default function PoliticaPrivacidadePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-orange-600">Política</span> de Privacidade
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>
        </div>

        <div className="space-y-6">
          {/* Introdução */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Shield className="h-6 w-6 text-orange-600" />
                <CardTitle>1. Introdução</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                O Flando Como Profeta ("nós", "nosso" ou "plataforma") está comprometido 
                com a proteção da sua privacidade e dos seus dados pessoais. Esta Política 
                de Privacidade explica como coletamos, usamos, armazenamos e protegemos 
                suas informações, em conformidade com a Lei Geral de Proteção de Dados 
                (LGPD - Lei nº 13.709/2018) e o Regulamento Geral de Proteção de Dados 
                (GDPR) da União Europeia.
              </p>
              <p>
                Ao usar nossa plataforma, você concorda com as práticas descritas nesta 
                política. Se tiver dúvidas, entre em contato conosco através dos canais 
                indicados na seção "Como Entrar em Contato".
              </p>
            </CardContent>
          </Card>

          {/* Dados Coletados */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Database className="h-6 w-6 text-orange-600" />
                <CardTitle>2. Dados que Coletamos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">2.1 Dados fornecidos por você:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Nome completo</li>
                <li>Endereço de e-mail</li>
                <li>Informações de pagamento (processadas de forma segura por terceiros)</li>
                <li>Histórico de conversas e perguntas</li>
                <li>Preferências de configuração</li>
              </ul>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">2.2 Dados coletados automaticamente:</h4>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Endereço IP</li>
                <li>Tipo de navegador e dispositivo</li>
                <li>Sistema operacional</li>
                <li>Data e hora de acesso</li>
                <li>Cookies e tecnologias similares</li>
                <li>Localização aproximada (com base no IP)</li>
              </ul>
            </CardContent>
          </Card>

          {/* Finalidade */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Eye className="h-6 w-6 text-orange-600" />
                <CardTitle>3. Como Usamos Seus Dados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Utilizamos seus dados pessoais para as seguintes finalidades:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Fornecer nossos serviços:</strong> Autenticação, processamento de perguntas e respostas</li>
                <li><strong>Melhorar a experiência:</strong> Personalização de conteúdo e recomendações</li>
                <li><strong>Comunicação:</strong> Envio de notificações importantes sobre sua conta</li>
                <li><strong>Segurança:</strong> Proteção contra fraudes e atividades maliciosas</li>
                <li><strong>Cumprimento legal:</strong> Atender obrigações legais e regulatórias</li>
                <li><strong>Análise:</strong> Métricas de uso para melhoria contínua da plataforma</li>
              </ul>
            </CardContent>
          </Card>

          {/* Base Legal */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Globe className="h-6 w-6 text-orange-600" />
                <CardTitle>4. Base Legal para Tratamento</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>De acordo com a LGPD, processamos seus dados com base nas seguintes hipóteses:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Consentimento:</strong> Quando você aceita nossos termos e política de privacidade</li>
                <li><strong>Execução de contrato:</strong> Para fornecer os serviços contratados</li>
                <li><strong>Cumprimento de obrigação legal:</strong> Quando exigido por lei</li>
                <li><strong>Legítimo interesse:</strong> Para segurança, prevenção de fraudes e melhoria de serviços</li>
              </ul>
            </CardContent>
          </Card>

          {/* Compartilhamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-orange-600" />
                <CardTitle>5. Compartilhamento de Dados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Podemos compartilhar seus dados com:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Provedores de serviço:</strong> Processamento de pagamentos (Mercado Pago), hospedagem (Supabase), análise (Google Analytics)</li>
                <li><strong>Autoridades competentes:</strong> Quando exigido por lei ou ordem judicial</li>
                <li><strong>Empresas do grupo:</strong> Em caso de reorganização societária</li>
              </ul>
              <p className="mt-4">
                <strong>Importante:</strong> Não vendemos seus dados pessoais a terceiros para fins de marketing.
              </p>
            </CardContent>
          </Card>

          {/* Segurança */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Lock className="h-6 w-6 text-orange-600" />
                <CardTitle>6. Segurança dos Dados</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Adotamos medidas técnicas e organizacionais para proteger seus dados:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Criptografia SSL/TLS em todas as conexões</li>
                <li>Autenticação de dois fatores (2FA) disponível</li>
                <li>Row Level Security (RLS) no banco de dados</li>
                <li>Monitoramento contínuo de segurança</li>
                <li>Backups regulares e criptografados</li>
                <li>Auditorias de segurança periódicas</li>
              </ul>
            </CardContent>
          </Card>

          {/* Retenção */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Clock className="h-6 w-6 text-orange-600" />
                <CardTitle>7. Tempo de Retenção</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Mantemos seus dados apenas pelo tempo necessário:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Dados de conta:</strong> Enquanto sua conta estiver ativa</li>
                <li><strong>Histórico de conversas:</strong> Conforme suas preferências de privacidade</li>
                <li><strong>Dados de pagamento:</strong> Conforme exigências legais (5 anos)</li>
                <li><strong>Logs de acesso:</strong> 12 meses para segurança</li>
              </ul>
              <p className="mt-4">
                Após o prazo de retenção, seus dados são anonimizados ou excluídos de forma segura.
              </p>
            </CardContent>
          </Card>

          {/* Seus Direitos */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-orange-600" />
                <CardTitle>8. Seus Direitos (LGPD/GDPR)</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Você tem os seguintes direitos em relação aos seus dados:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>Acesso:</strong> Solicitar cópia dos seus dados</li>
                <li><strong>Correção:</strong> Retificar dados incompletos ou desatualizados</li>
                <li><strong>Exclusão:</strong> Solicitar a eliminação dos seus dados ("direito ao esquecimento")</li>
                <li><strong>Portabilidade:</strong> Receber dados em formato estruturado</li>
                <li><strong>Revogação:</strong> Retirar consentimento a qualquer momento</li>
                <li><strong>Informação:</strong> Saber com quem seus dados foram compartilhados</li>
                <li><strong>Oposição:</strong> Discordar do tratamento baseado em interesse legítimo</li>
              </ul>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Mail className="h-6 w-6 text-orange-600" />
                <CardTitle>9. Como Entrar em Contato</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Para exercer seus direitos ou tirar dúvidas sobre esta política:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li><strong>E-mail:</strong> privacidade@falandocomoprofeta.com.br</li>
                <li><strong>Formulário:</strong> Acesse sua conta e vá em "Configurações &gt; Privacidade"</li>
                <li><strong>Resposta:</strong> Responderemos em até 15 dias úteis</li>
              </ul>
              <p className="mt-4">
                Se não estiver satisfeito com nossa resposta, você pode reclamar à 
                <strong> Autoridade Nacional de Proteção de Dados (ANPD)</strong>.
              </p>
            </CardContent>
          </Card>

          {/* Alterações */}
          <Card>
            <CardHeader>
              <CardTitle>10. Alterações nesta Política</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Podemos atualizar esta política periodicamente. Notificaremos você sobre 
                mudanças significativas por e-mail ou através de aviso na plataforma. 
                Recomendamos revisar esta página regularmente.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Flando Como Profeta. Todos os direitos reservados.</p>
          <p className="mt-2">
            Esta política é regida pelas leis da República Federativa do Brasil.
          </p>
        </div>
      </div>
    </div>
  )
}
