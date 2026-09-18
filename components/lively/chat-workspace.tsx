'use client'

import { useEffect, useState, type FormEvent } from 'react'
import { signOut, type User } from 'firebase/auth'
import { Heart, LogOut, MessageCircle, Plus, ArrowRight, ShieldCheck, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { useFirebaseValue } from '@/hooks/use-firebase-data'
import { firebaseClient, friendlyError, type FirebaseConfig } from '@/lib/firebase'
import { createRoom, joinRoom, memberFor, type RoomIndex } from '@/lib/chat'
import { cn } from '@/lib/utils'
import { Conversation } from './conversation'

export function ChatWorkspace({ config, user }: { config: FirebaseConfig; user: User }) {
  const { data: rooms, error: roomsError } = useFirebaseValue<RoomIndex>(config, user.uid, `lively/userRooms/${user.uid}`)
  const [selected, setSelected] = useState<string | null>(null)
  const [title, setTitle] = useState('')
  const [invite, setInvite] = useState('')
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [callActive, setCallActive] = useState(false)
  const member = memberFor(user)

  useEffect(() => {
    const readInvite = () => {
      if (window.location.hash.startsWith('#join=')) setInvite(window.location.hash.slice(6))
    }
    readInvite()
    window.addEventListener('hashchange', readInvite)
    return () => window.removeEventListener('hashchange', readInvite)
  }, [])

  async function submit(event: FormEvent, kind: 'create' | 'join') {
    event.preventDefault()
    if (busy || callActive) return
    setBusy(kind); setError('')
    try {
      const id = kind === 'create' ? await createRoom(config, user, title) : await joinRoom(config, user, invite)
      setSelected(id)
      if (kind === 'create') setTitle('')
      else { setInvite(''); window.history.replaceState(null, '', window.location.pathname + window.location.search) }
    } catch (error) { setError(friendlyError(error)) }
    finally { setBusy('') }
  }

  async function logout() {
    setError('')
    try { await signOut(firebaseClient(config).auth) } catch (error) { setError(friendlyError(error)) }
  }

  return (
    <div className="chat-app">
      <header className="chat-topbar">
        <a href="/" className="wordmark" aria-label="lively home"><span className="brand-symbol"><MessageCircle aria-hidden="true" /></span>lively<span className="brand-dot">.</span></a>
        <p className="chat-tagline">Your people. Your little corner.</p>
        <div className="account-controls"><span className="account-name">{member.name}</span><Button variant="ghost" size="icon" onClick={logout} disabled={callActive} aria-label="Sign out" title={callActive ? 'End your call before signing out' : 'Sign out'}><LogOut /></Button></div>
      </header>
      <main className={cn('chat-layout', selected && 'has-conversation')}>
        <aside className="chat-sidebar" aria-label="Your conversations">
          <div className="sidebar-heading"><h1>Your conversations</h1><Heart aria-hidden="true" className="size-4" /></div>
          <p className="sidebar-description">A little hello goes a long way.</p>
          {(error || roomsError) && <Alert variant="destructive"><AlertTitle>Couldn&apos;t connect</AlertTitle><AlertDescription>{error || friendlyError(roomsError)}</AlertDescription></Alert>}
          <div className="room-list">
            {rooms === undefined && !roomsError && <p className="loading-line" role="status"><LoaderCircle className="size-4 animate-spin" />Loading conversations…</p>}
            {rooms === null && <p className="sidebar-description">No conversations yet. Invite your first friend below.</p>}
            {Object.entries(rooms ?? {}).sort((a, b) => b[1].joinedAt - a[1].joinedAt).map(([id, room]) => (
              <button key={id} className={cn('room-link', selected === id && 'is-selected')} onClick={() => setSelected(id)} disabled={callActive} aria-current={selected === id ? 'page' : undefined}>
                <span className="room-avatar"><MessageCircle aria-hidden="true" /></span><span className="room-link-copy"><strong>{room.title}</strong><span>Private conversation</span></span><ArrowRight className="size-4 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
          <form onSubmit={(event) => submit(event, 'create')} className="sidebar-form">
            <FieldGroup><Field><FieldLabel htmlFor="conversation-name">Make a little space</FieldLabel><Input id="conversation-name" placeholder="e.g. Weekend catch-ups" value={title} onChange={(event) => setTitle(event.target.value)} required maxLength={60} disabled={!!busy || callActive} /></Field></FieldGroup>
            <Button type="submit" disabled={!!busy || callActive} className="w-full"><Plus data-icon="inline-start" />{busy === 'create' ? 'Creating…' : 'New conversation'}</Button>
          </form>
          <form onSubmit={(event) => submit(event, 'join')} className="sidebar-form">
            <FieldGroup><Field><FieldLabel htmlFor="invite-code">Got an invitation?</FieldLabel><Input id="invite-code" placeholder="Paste your friend’s invite link" value={invite} onChange={(event) => setInvite(event.target.value)} required disabled={!!busy || callActive} /></Field></FieldGroup>
            <Button type="submit" variant="outline" disabled={!!busy || callActive} className="w-full">{busy === 'join' ? 'Joining…' : 'Join a friend'}<ArrowRight data-icon="inline-end" /></Button>
          </form>
          <details className="firebase-help">
            <summary>Firebase setup & privacy</summary>
            <p>Enable Email/Password in Authentication. This app uses your existing <strong>Realtime Database</strong>, not Firestore.</p>
            <p>In Realtime Database → Rules, merge the supplied <code>lively</code> section into your existing rules. Do not replace unrelated app rules. Root-level public access must be removed: parent grants override these restrictions.</p>
            <a href="/firebase-rules.json" target="_blank" rel="noreferrer">Open the database rules</a>
            <p>Each invite admits one friend and expires after 24 hours. Only those two accounts can access the conversation. Messages are stored in Firebase; they are not end-to-end encrypted.</p>
            <p>Calls use a direct WebRTC connection. Some networks need a TURN relay, which is not configured yet. Both friends must open the same conversation to receive calls.</p>
          </details>
          <p className="sidebar-footer"><ShieldCheck className="size-3" aria-hidden="true" />Made for friends. Not followers.</p>
        </aside>
        <section className="conversation-area" aria-label="Conversation">
          {selected ? <Conversation key={selected} config={config} user={user} roomId={selected} onBack={() => setSelected(null)} onCallActive={setCallActive} /> : <Empty><EmptyHeader><EmptyMedia variant="icon"><MessageCircle /></EmptyMedia><EmptyTitle>Your next hello starts here.</EmptyTitle><EmptyDescription>Create a private conversation and share its invitation with a friend. Messages and calls, all in your little corner.</EmptyDescription></EmptyHeader></Empty>}
        </section>
      </main>
    </div>
  )
}
