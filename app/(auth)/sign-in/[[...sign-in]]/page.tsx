import { SignIn } from '@clerk/nextjs'

export default function SignInPage(): React.JSX.Element {
  return (
    <main
      id="main-content"
      className="bg-surface-muted flex min-h-screen flex-col items-center justify-center p-4"
    >
      <div className="mb-6 text-center">
        <h1 className="text-navy-900 text-2xl font-bold">Tennis Coach</h1>
        <p className="mt-1 text-slate-600">Melde dich an, um fortzufahren</p>
      </div>
      <SignIn />
    </main>
  )
}
