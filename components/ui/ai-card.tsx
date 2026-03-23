import { cn } from '@/lib/utils'
import { LoadingSpinner } from '@/components/feedback/loading-spinner'

interface AiCardProps {
  text: string | null
  isLoading?: boolean
  error?: string | null
  className?: string
  'aria-label'?: string
}

export function AiCard({
  text,
  isLoading = false,
  error = null,
  className,
  'aria-label': ariaLabel = 'KI-Empfehlung',
}: AiCardProps): React.JSX.Element {
  return (
    <div
      aria-label={ariaLabel}
      aria-live="polite"
      className={cn('min-h-[64px] rounded-lg p-4', 'bg-navy-900 text-white', className)}
    >
      {isLoading && <LoadingSpinner label="KI denkt nach…" size="sm" />}
      {!isLoading && error && <p className="text-sm text-red-300">{error}</p>}
      {!isLoading && !error && text && (
        <p className="text-[1.25rem] leading-snug font-bold">{text}</p>
      )}
      {!isLoading && !error && !text && (
        <p className="text-sm text-slate-400 italic">Noch keine KI-Empfehlung</p>
      )}
    </div>
  )
}
