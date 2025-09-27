import { Loader2 } from 'lucide-react'

export default function UpgradeLoading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-purple-500" />
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300">
              Carregando planos...
            </h2>
            <p className="text-muted-foreground">
              Preparando as melhores opções para você
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}