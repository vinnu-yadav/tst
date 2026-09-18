'use client'

import { LoaderCircle } from 'lucide-react'
import { useFirebaseUser } from '@/hooks/use-firebase-data'
import { type FirebaseConfig, friendlyError } from '@/lib/firebase'
import { Welcome } from './welcome'
import { ChatWorkspace } from './chat-workspace'

export function LivelyApp({ config }: { config: FirebaseConfig }) {
  const { data: user, error } = useFirebaseUser(config)
  if (error) return <Welcome config={config} configurationError={friendlyError(error)} />
  if (user === undefined) return <main className="flex min-h-svh items-center justify-center gap-3" role="status"><LoaderCircle className="size-5 animate-spin" />Getting your little corner ready…</main>
  if (!user) return <Welcome config={config} />
  return <ChatWorkspace key={user.uid} config={config} user={user} />
}
