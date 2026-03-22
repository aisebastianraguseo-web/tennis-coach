interface ErrorMessageProps {
  message: string
  id?: string
}

export function ErrorMessage({ message, id }: ErrorMessageProps): React.JSX.Element {
  return (
    <div
      id={id}
      role="alert"
      aria-live="polite"
      className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
    >
      {message}
    </div>
  )
}
