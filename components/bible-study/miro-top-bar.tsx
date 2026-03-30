'use client'
import { Button } from '@/components/ui/button'
import { BookOpen, Play, Share, MoreHorizontal, Trash2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

interface MiroTopBarProps {
  panel: any
  onNewStudy: () => void
  onDelete?: () => void
  canDelete?: boolean
}

export default function MiroTopBar({ panel, onNewStudy, onDelete, canDelete }: MiroTopBarProps) {
  return (
    <div className="h-14 bg-card border-b flex items-center px-4 gap-4 z-50 shrink-0">
      <div className="flex items-center gap-4 min-w-0 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-2xl flex items-center justify-center text-primary-foreground text-xl">📖</div>
          <div>
            <span className="font-bold text-xl tracking-tight">Estudos</span>
            <span className="font-bold text-xl text-primary tracking-tight">Miro</span>
          </div>
        </div>

        <Button variant="outline" size="sm" onClick={onNewStudy}>
          <BookOpen className="mr-2 h-4 w-4" />
          Novo Estudo
        </Button>
      </div>

      <div className="flex-1 min-w-0 text-center text-sm font-medium text-muted-foreground truncate px-2">
        <span className="text-foreground font-semibold">{panel.title}</span>
        <span className="mx-2">•</span>
        <span>{panel.bible_version}</span>
        {panel.theme && (
          <>
            <span className="mx-2">•</span>
            <span className="font-normal">{panel.theme}</span>
          </>
        )}
        {panel.prophet_assistance && <span className="ml-2 text-primary">✨ Com Profeta</span>}
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {canDelete && onDelete && (
          <Button variant="destructive" size="sm" onClick={onDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Deletar
          </Button>
        )}

        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Play className="mr-2 h-4 w-4" />
          Present
        </Button>
        <Button variant="ghost" size="sm" className="hidden sm:inline-flex">
          <Share className="mr-2 h-4 w-4" />
          Compartilhar
        </Button>

        <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-2xl">
          <Avatar className="w-7 h-7">
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">PB</AvatarFallback>
          </Avatar>
          <span className="text-sm font-medium hidden sm:inline">Profeta Branham</span>
        </div>

        <Button variant="ghost" size="icon">
          <MoreHorizontal />
        </Button>
      </div>
    </div>
  )
}
