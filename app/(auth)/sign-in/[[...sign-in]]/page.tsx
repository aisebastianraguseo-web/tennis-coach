import { SignIn } from '@clerk/nextjs'

export default function SignInPage(): React.JSX.Element {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-surface-muted p-4"
    >
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-bold text-navy-900">Tennis Coach</h1>
        <p className="mt-1 text-slate-600">Melde dich an, um fortzufahren</p>
      </div>
      <SignIn />
    </main>
  )
}
