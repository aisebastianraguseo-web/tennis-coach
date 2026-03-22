interface ProfileIndicatorProps {
  matchCount: number
  raumStatus: string
  hoeheStatus: string
  mentalStatus: string
}

type IndicatorColor = 'grey' | 'yellow' | 'green'

function getColor({
  matchCount,
  raumStatus,
  hoeheStatus,
  mentalStatus,
}: ProfileIndicatorProps): IndicatorColor {
  if (matchCount === 0) return 'grey'
  const allKnown =
    raumStatus !== 'unknown' && hoeheStatus !== 'unknown' && mentalStatus !== 'unknown'
  return allKnown ? 'green' : 'yellow'
}

const colorClasses: Record<IndicatorColor, string> = {
  grey: 'bg-slate-300',
  yellow: 'bg-amber-400',
  green: 'bg-green-500',
}

const colorLabels: Record<IndicatorColor, string> = {
  grey: 'Kein Profil',
  yellow: 'Profil unvollständig',
  green: 'Profil vollständig',
}

export function ProfileIndicator(props: ProfileIndicatorProps): React.JSX.Element {
  const color = getColor(props)
  return (
    <span
      aria-label={colorLabels[color]}
      title={colorLabels[color]}
      className={`inline-block h-3 w-3 flex-shrink-0 rounded-full ${colorClasses[color]}`}
    />
  )
}
