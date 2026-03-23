interface LoadingSpinnerProps {
  label?: string
  size?: 'sm' | 'md' | 'lg'
}

const sizeClasses = {
  sm: 'h-4 w-4 border-2',
  md: 'h-6 w-6 border-2',
  lg: 'h-8 w-8 border-4',
} as const

export function LoadingSpinner({
  label = 'Wird geladen…',
  size = 'md',
}: LoadingSpinnerProps): React.JSX.Element {
  return (
    <div role="status" aria-label={label} className="inline-flex items-center gap-2">
      <div
        className={`border-t-navy-900 animate-spin rounded-full border-slate-200 ${sizeClasses[size]}`}
      />
      <span className="sr-only">{label}</span>
    </div>
  )
}
