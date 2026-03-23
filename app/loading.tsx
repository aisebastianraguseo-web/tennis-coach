export default function RootLoading(): React.JSX.Element {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      role="status"
      aria-label="Wird geladen"
    >
      <div className="border-t-navy-900 h-8 w-8 animate-spin rounded-full border-4 border-slate-200" />
    </div>
  )
}
