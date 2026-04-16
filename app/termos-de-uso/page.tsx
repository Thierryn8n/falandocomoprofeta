import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, User, Scale, MessageSquare, CreditCard, AlertTriangle, Check } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Termos de Uso | Flando Como Profeta',
  description: 'Termos de Uso e Condições do Flando Como Profeta. Leia com atenção.',
}

export default function TermosDeUsoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
            <FileText className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Termos de <span className="text-orange-600">Uso</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Última atualização: {new Date().toLocaleDateString('pt-BR')} | Versão 1.0
          </p>
        </div>

        <div className="space-y-6">
          {/* Aceitação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-orange-600" />
                <CardTitle>1. Aceitação dos Termos</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Ao acessar ou usar o Flando Como Profeta ("Plataforma"), você concorda 
                em cumprir e estar vinculado a estes Termos de Uso. Se você não concorda 
                com qualquer parte destes termos, não deve usar nossos serviços.
              </p>
              <p>
                Reservamo-nos o direito de modificar estes termos a qualquer momento. 
                Alterações significativas serão notificadas por e-mail ou através da 
                Plataforma. O uso continuado após as alterações constitui aceitação 
                dos novos termos.
              </p>
            </CardContent>
          </Card>

          {/* Definições */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <FileText className="h-6 w-6 text-orange-600" />
                <CardTitle>2. Definições</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <ul className="list-disc list-inside space-y-2">
                <li><strong>"Plataforma"</strong> ou <strong>"Serviço"</strong>: O site e aplicativo Flando Como Profeta</li>
                <li><strong>"Usuário"</strong> ou <strong>"Você"</strong>: Qualquer pessoa que acesse ou use a Plataforma</li>
                <li><strong>"Conteúdo"</strong>: Textos, imagens, áudios, vídeos e outros materiais disponíveis na Plataforma</li>
                <li><strong>"IA"</strong> ou <strong>"Profeta"</strong>: O assistente virtual baseado em inteligência artificial</li>
                <li><strong>"Respostas"</strong>: As mensagens geradas pela IA em resposta às perguntas dos usuários</li>
              </ul>
            </CardContent>
          </Card>

          {/* Serviços */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageSquare className="h-6 w-6 text-orange-600" />
                <CardTitle>3. Descrição dos Serviços</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                O Flando Como Profeta é uma plataforma que utiliza inteligência artificial 
                para responder perguntas sobre temas bíblicos, espirituais e de orientação 
                cristã. Nossos serviços incluem:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Chat interativo com IA treinada em conteúdo bíblico</li>
                <li>Respostas por texto e áudio</li>
                <li>Sistema de perguntas gratuitas e pagas</li>
                <li>Planos de assinatura para acesso ilimitado</li>
                <li>Histórico de conversas</li>
                <li>Conteúdo educacional e devocional</li>
              </ul>
              <p className="mt-4">
                <strong>Importante:</strong> As respostas da IA são geradas automaticamente 
                e não substituem aconselhamento pastoral, terapêutico ou profissional qualificado.
              </p>
            </CardContent>
          </Card>

          {/* Cadastro */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <User className="h-6 w-6 text-orange-600" />
                <CardTitle>4. Cadastro e Conta</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">4.1 Elegibilidade</h4>
              <p>
                Para usar a Plataforma, você deve ter pelo menos 13 anos de idade. 
                Menores de idade devem usar o serviço sob supervisão de um responsável legal.
              </p>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">4.2 Informações da Conta</h4>
              <p>
                Você concorda em fornecer informações verdadeiras, precisas e completas 
                durante o cadastro. É sua responsabilidade manter suas credenciais de 
                login seguras e não compartilhá-las com terceiros.
              </p>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">4.3 Atividades Proibidas</h4>
              <p>Você concorda em NÃO:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Compartilhar sua senha ou credenciais de acesso</li>
                <li>Usar a conta de outro usuário sem permissão</li>
                <li>Criar múltiplas contas para burlar limites</li>
                <li>Fornecer informações falsas ou enganosas</li>
                <li>Transferir sua conta para terceiros</li>
              </ul>
            </CardContent>
          </Card>

          {/* Pagamento */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <CreditCard className="h-6 w-6 text-orange-600" />
                <CardTitle>5. Pagamentos e Assinaturas</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <h4 className="font-medium text-gray-900 dark:text-gray-100">5.1 Planos Disponíveis</h4>
              <p>
                Oferecemos planos gratuitos e pagos. Os planos pagos dão acesso a 
                perguntas ilimitadas e recursos exclusivos.
              </p>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">5.2 Processamento de Pagamentos</h4>
              <p>
                Processamos pagamentos através de gateways seguros (Mercado Pago). 
                Não armazenamos números de cartão de crédito em nossos servidores.
              </p>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">5.3 Cancelamento</h4>
              <p>
                Você pode cancelar sua assinatura a qualquer momento através das 
                configurações da conta. O cancelamento terá efeito no próximo ciclo 
                de cobrança.
              </p>

              <h4 className="font-medium text-gray-900 dark:text-gray-100 mt-6">5.4 Reembolsos</h4>
              <p>
                Avaliamos solicitações de reembolso caso a caso. Não garantimos 
                reembolsos por arrependimento de compra após o uso do serviço.
              </p>
            </CardContent>
          </Card>

          {/* Conduta */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-orange-600" />
                <CardTitle>6. Conduta do Usuário</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Ao usar a Plataforma, você concorda em:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>Não fazer perguntas ofensivas, discriminatórias ou de ódio</li>
                <li>Não solicitar conteúdo ilegal, violento ou sexualmente explícito</li>
                <li>Não usar a Plataforma para assédio ou bullying</li>
                <li>Não tentar hackear, derrubar ou sobrecarregar os servidores</li>
                <li>Não usar bots, scrapers ou automações não autorizadas</li>
                <li>Não violar direitos autorais de terceiros</li>
                <li>Usar a Plataforma de forma ética e respeitosa</li>
              </ul>
              <p className="mt-4">
                <Link href="/regras-de-conduta" className="text-orange-600 hover:underline">
                  Leia nossas Regras de Conduta completas →
                </Link>
              </p>
            </CardContent>
          </Card>

          {/* Propriedade Intelectual */}
          <Card>
            <CardHeader>
              <CardTitle>7. Propriedade Intelectual</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Todo o conteúdo da Plataforma, incluindo textos, gráficos, logos, 
                ícones, imagens e software, é propriedade do Flando Como Profeta 
                ou de seus licenciadores e está protegido por leis de direitos 
                autorais e marcas registradas.
              </p>
              <p>
                Você pode usar o conteúdo para uso pessoal e não comercial. 
                É proibido copiar, modificar, distribuir ou criar trabalhos 
                derivados sem autorização expressa.
              </p>
            </CardContent>
          </Card>

          {/* Limitação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-orange-600" />
                <CardTitle>8. Limitação de Responsabilidade</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                <strong>8.1 Natureza das Respostas:</strong> As respostas da IA são 
                geradas por algoritmos de inteligência artificial e não representam 
                necessariamente posições teológicas oficiais. Elas devem ser 
                consideradas como material de referência e reflexão, não como 
                verdades absolutas ou substituto de estudo bíblico profundo.
              </p>
              <p>
                <strong>8.2 Aconselhamento:</strong> As respostas não constituem 
                aconselhamento pastoral, médico, psicológico, jurídico ou profissional. 
                Consulte profissionais qualificados para questões específicas.
              </p>
              <p>
                <strong>8.3 Precisão:</strong> Fazemos esforços para garantir a 
                precisão das informações, mas não garantimos que todo o conteúdo 
                esteja livre de erros ou omissões.
              </p>
              <p>
                <strong>8.4 Danos:</strong> Na máxima extensão permitida por lei, 
                não seremos responsáveis por danos indiretos, incidentais, especiais 
                ou consequenciais resultantes do uso ou incapacidade de usar a Plataforma.
              </p>
            </CardContent>
          </Card>

          {/* Modificações */}
          <Card>
            <CardHeader>
              <CardTitle>9. Modificações e Interrupções</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Reservamo-nos o direito de modificar, suspender ou descontinuar 
                qualquer parte da Plataforma a qualquer momento, com ou sem aviso prévio.
              </p>
              <p>
                Não seremos responsáveis por qualquer modificação, alteração de preços, 
                suspensão ou descontinuação do serviço.
              </p>
            </CardContent>
          </Card>

          {/* Rescisão */}
          <Card>
            <CardHeader>
              <CardTitle>10. Rescisão</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Podemos suspender ou encerrar sua conta e acesso à Plataforma 
                imediatamente, sem aviso prévio, por qualquer motivo, incluindo 
                violação destes Termos.
              </p>
              <p>
                Após a rescisão, todas as disposições que, por sua natureza, 
                devam sobreviver à rescisão permanecerão em vigor.
              </p>
            </CardContent>
          </Card>

          {/* Lei */}
          <Card>
            <CardHeader>
              <CardTitle>11. Lei Aplicável</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Estes Termos são regidos pelas leis da República Federativa do Brasil. 
                Qualquer disputa será resolvida nos tribunais competentes da 
                Comarca de São Paulo - SP.
              </p>
            </CardContent>
          </Card>

          {/* Contato */}
          <Card>
            <CardHeader>
              <CardTitle>12. Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>Para dúvidas sobre estes Termos de Uso:</p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>E-mail: legal@falandocomoprofeta.com.br</li>
                <li>Seção de Suporte na Plataforma</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Aceitação Checkbox */}
        <div className="mt-12 p-6 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800">
          <p className="text-center text-gray-700 dark:text-gray-300">
            Ao criar uma conta ou usar a Plataforma, você confirma que leu, 
            entendeu e concorda com estes Termos de Uso.
          </p>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} Flando Como Profeta. Todos os direitos reservados.</p>
        </div>
      </div>
    </div>
  )
}
