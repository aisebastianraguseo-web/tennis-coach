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
      className={cn(
        'min-h-[64px] rounded-lg p-4',
        'bg-navy-900 text-white',
        className
      )}
    >
      {isLoading && (
        <LoadingSpinner label="KI denkt nach…" size="sm" />
      )}
      {!isLoading && error && (
        <p className="text-red-300 text-sm">{error}</p>
      )}
      {!isLoading && !error && text && (
        <p className="text-[1.25rem] font-bold leading-snug">{text}</p>
      )}
      {!isLoading && !error && !text && (
        <p className="text-slate-400 text-sm italic">Noch keine KI-Empfehlung</p>
      )}
    </div>
  )
}
