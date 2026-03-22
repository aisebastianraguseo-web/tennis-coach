export default function RootLoading(): React.JSX.Element {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label="Wird geladen"
    >
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-slate-200 border-t-navy-900" />
    </div>
  )
}
