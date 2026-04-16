import { Metadata } from 'next'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Scale, Heart, MessageCircle, AlertTriangle, Check, X, Info } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Regras de Conduta | Flando Como Profeta',
  description: 'Regras de Conduta e Comunidade do Flando Como Profeta. Mantenha nosso ambiente respeitoso.',
}

export default function RegrasDeCondutaPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center p-4 bg-orange-100 dark:bg-orange-900/30 rounded-full mb-6">
            <Scale className="h-8 w-8 text-orange-600 dark:text-orange-400" />
          </div>
          <h1 className="text-4xl font-bold mb-4">
            Regras de <span className="text-orange-600">Conduta</span>
          </h1>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Nossas diretrizes para manter uma comunidade acolhedora, respeitosa e 
            edificante para todos os usuários.
          </p>
        </div>

        {/* Princípios Fundamentais */}
        <Card className="mb-8 border-orange-200 dark:border-orange-800">
          <CardHeader>
            <div className="flex items-center gap-3">
              <Heart className="h-6 w-6 text-orange-600" />
              <CardTitle>Princípios Fundamentais</CardTitle>
            </div>
            <CardDescription>
              Os valores que guiam nossa comunidade
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: 'Amor', desc: 'Trate todos com amor e caridade cristã' },
                { title: 'Respeito', desc: 'Respeite diferentes tradições e interpretações' },
                { title: 'Humildade', desc: 'Reconheça que ninguém tem todas as respostas' },
                { title: 'Honestidade', desc: 'Seja genuíno em suas perguntas e interações' },
                { title: 'Edificação', desc: 'Busque construir, nunca destruir' },
                { title: 'Discernimento', desc: 'Use a IA como ferramenta, não oráculo' },
              ].map((principle, idx) => (
                <div key={idx} className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <Check className="h-5 w-5 text-orange-600 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium">{principle.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{principle.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          {/* O que é permitido */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Check className="h-6 w-6 text-green-600" />
                <CardTitle>O que é Permitido</CardTitle>
              </div>
              <CardDescription>
                Comportamentos e perguntas bem-vindos na plataforma
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {[
                  'Perguntas sobre passagens bíblicas e seus significados',
                  'Dúvidas teológicas e doutrinárias (respeitosas)',
                  'Busca por orientação espiritual e conselhos práticos',
                  'Discussões sobre história cristã e interpretações',
                  'Perguntas sobre aplicação da fé no dia a dia',
                  'Curiosidades sobre costumes e tradições cristãs',
                  'Solicitação de esclarecimentos sobre termos teológicos',
                  'Perguntas sobre relacionamentos à luz da fé cristã',
                  'Dúvidas sobre propósito, vocação e chamado',
                  'Questões sobre ética cristã contemporânea',
                ].map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="h-4 w-4 text-green-500 shrink-0 mt-1" />
                    <span className="text-gray-700 dark:text-gray-300">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* O que é proibido */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <X className="h-6 w-6 text-red-600" />
                <CardTitle>O que é Proibido</CardTitle>
              </div>
              <CardDescription className="text-red-600">
                Comportamentos que resultarão em suspensão ou banimento
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Discurso de Ódio e Discriminação</h4>
                  <ul className="space-y-2 ml-4">
                    {[
                      'Perguntas ou comentários racistas, xenófobos ou discriminatórios',
                      'Homofobia, transfobia ou discriminação de qualquer orientação',
                      'Discriminação baseada em gênero, idade ou deficiência',
                      'Discurso de ódio contra qualquer grupo religioso ou não religioso',
                      'Antissemitismo ou qualquer forma de preconceito étnico',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-red-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Conteúdo Inapropriado</h4>
                  <ul className="space-y-2 ml-4">
                    {[
                      'Perguntas de natureza sexual explícita ou pornográfica',
                      'Violência gráfica ou incitação ao ódio',
                      'Conteúdo ilegal ou que promova atividades criminosas',
                      'Assédio, bullying ou ameaças contra outros usuários',
                      'Spam, publicidade não autorizada ou promoção excessiva',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-red-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Uso Indevido da Plataforma</h4>
                  <ul className="space-y-2 ml-4">
                    {[
                      'Tentativas de hackear ou explorar vulnerabilidades',
                      'Criação de múltiplas contas para burlar limites',
                      'Uso de bots, scripts ou automações não autorizadas',
                      'Compartilhamento de credenciais de conta',
                      'Violação de direitos autorais de terceiros',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-red-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-red-600 mb-3">Comportamento Anti-Comunitário</h4>
                  <ul className="space-y-2 ml-4">
                    {[
                      'Trollagem ou provocações intencionais',
                      'Falsificação de identidade',
                      'Espalhar desinformação ou fake news conscientemente',
                      'Ataques pessoais ou difamação',
                      'Pressão ou manipulação de outros usuários',
                    ].map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-gray-700 dark:text-gray-300">
                        <span className="text-red-500">•</span> {item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Limitações da IA */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Info className="h-6 w-6 text-blue-600" />
                <CardTitle>Limitações da IA</CardTitle>
              </div>
              <CardDescription>
                O que a IA pode e não pode fazer
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                É importante entender que a IA do Flando Como Profeta tem limitações:
              </p>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">
                    <Check className="h-4 w-4 inline mr-1" /> A IA PODE
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Explicar passagens bíblicas</li>
                    <li>• Apresentar diferentes interpretações</li>
                    <li>• Oferecer perspectivas históricas</li>
                    <li>• Sugerir reflexões espirituais</li>
                    <li>• Responder dúvidas teológicas gerais</li>
                    <li>• Compartilhar insights edificantes</li>
                  </ul>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <h4 className="font-medium text-orange-800 dark:text-orange-400 mb-2">
                    <X className="h-4 w-4 inline mr-1" /> A IA NÃO PODE
                  </h4>
                  <ul className="text-sm space-y-1">
                    <li>• Substituir um pastor ou conselheiro</li>
                    <li>• Dar diagnósticos médicos/psicológicos</li>
                    <li>• Fazer profecias ou prever o futuro</li>
                    <li>• Fornecer conselhos jurídicos</li>
                    <li>• Garantir interpretações absolutas</li>
                    <li>• Resolver crises emergenciais</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Denúncias */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-yellow-600" />
                <CardTitle>Como Denunciar Violações</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Se você encontrar conteúdo ou comportamento que viole estas regras:
              </p>
              <ol className="list-decimal list-inside space-y-2 ml-4">
                <li>Use o botão "Denunciar" disponível nas conversas</li>
                <li>Envie um e-mail para: moderacao@falandocomoprofeta.com.br</li>
                <li>Inclua evidências (capturas de tela, descrição detalhada)</li>
                <li>Nossa equipe analisará em até 48 horas úteis</li>
              </ol>
              <p className="text-sm mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <strong>Importante:</strong> Denúncias falsas ou retaliatórias também 
                violam nossas regras e podem resultar em suspensão.
              </p>
            </CardContent>
          </Card>

          {/* Consequências */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Scale className="h-6 w-6 text-orange-600" />
                <CardTitle>Consequências de Violações</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <span className="font-bold text-yellow-700">1ª</span>
                  <div>
                    <h4 className="font-medium">Advertência</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Notificação sobre a violação e orientação sobre as regras
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <span className="font-bold text-orange-700">2ª</span>
                  <div>
                    <h4 className="font-medium">Suspensão Temporária</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bloqueio de 3 a 30 dias dependendo da gravidade
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <span className="font-bold text-red-700">3ª</span>
                  <div>
                    <h4 className="font-medium">Banimento Permanente</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Remoção definitiva da conta e proibição de novos cadastros
                    </p>
                  </div>
                </div>
              </div>
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <strong>Nota:</strong> Violações graves (discurso de ódio, ameaças, conteúdo 
                ilegal) podem resultar em banimento imediato, sem advertências prévias.
              </p>
            </CardContent>
          </Card>

          {/* Contato Moderação */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <MessageCircle className="h-6 w-6 text-orange-600" />
                <CardTitle>Fale com a Moderação</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-4 text-gray-600 dark:text-gray-400">
              <p>
                Dúvidas sobre as regras? Quer sugerir melhorias? Entre em contato:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>E-mail: moderacao@falandocomoprofeta.com.br</li>
                <li>Seção "Suporte" dentro da plataforma</li>
                <li>Tempo médio de resposta: 24-48 horas úteis</li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center">
          <p className="text-lg text-gray-700 dark:text-gray-300 mb-4">
            Ao usar o Flando Como Profeta, você concorda em seguir estas regras 
            e ajudar a manter nossa comunidade acolhedora.
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Flando Como Profeta. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </div>
  )
}
