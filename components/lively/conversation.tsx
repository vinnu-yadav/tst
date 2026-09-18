'use client'

import { useState, type FormEvent } from 'react'
import type { User } from 'firebase/auth'
import { ArrowLeft, Copy, Check, Send, Phone, Video, MessageCircle, LoaderCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'
import { Empty, EmptyHeader, EmptyMedia, EmptyTitle, EmptyDescription } from '@/components/ui/empty'
import { Message, MessageContent, MessageFooter } from '@/components/ui/message'
import { Bubble, BubbleContent } from '@/components/ui/bubble'
import { Marker, MarkerContent } from '@/components/ui/marker'
import { MessageScroller, MessageScrollerViewport, MessageScrollerContent, MessageScrollerItem, MessageScrollerButton } from '@/components/ui/message-scroller'
import { useFirebaseValue } from '@/hooks/use-firebase-data'
import { useLivelyCall } from '@/hooks/use-lively-call'
import { friendlyError, type FirebaseConfig } from '@/lib/firebase'
import { sendMessage, type ChatMessage, type Room } from '@/lib/chat'
import { CallPanel } from './call-panel'

export function Conversation({ config, user, roomId, onBack, onCallActive }: { config: FirebaseConfig; user: User; roomId: string; onBack: () => void; onCallActive: (active: boolean) => void }) {
  const { data: room, error: roomError } = useFirebaseValue<Room>(config, user.uid, `lively/rooms/${roomId}`)
  const [messageLimit, setMessageLimit] = useState(100)
  const { data: messages, error: messagesError } = useFirebaseValue<Record<string, ChatMessage>>(config, user.uid, room ? `lively/messages/${roomId}` : null, messageLimit)
  const { data: connected } = useFirebaseValue<boolean>(config, user.uid, '.info/connected')
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const [copied, setCopied] = useState(false)
  const [manualInvite, setManualInvite] = useState('')
  const other = room?.host.uid === user.uid ? room.guest : room?.host
  const call = useLivelyCall(config, user, roomId, onCallActive)

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (sending || !text.trim() || !connected) return
    setSending(true); setError('')
    try { await sendMessage(config, user, roomId, text); setText('') }
    catch (error) { setError(friendlyError(error)) }
    finally { setSending(false) }
  }

  async function copyInvite() {
    const url = `${window.location.origin}/#join=${roomId}`
    try { await navigator.clipboard.writeText(url); setCopied(true) }
    catch { setManualInvite(url) }
  }

  if (roomError) return <div className="p-6"><Button variant="ghost" onClick={onBack}><ArrowLeft />Back</Button><Alert variant="destructive"><AlertTitle>Conversation unavailable</AlertTitle><AlertDescription>{friendlyError(roomError)}</AlertDescription></Alert></div>
  if (room === undefined) return <div className="loading-line p-6" role="status"><LoaderCircle className="size-4 animate-spin" />Opening your conversation…</div>
  if (!room) return <Empty><EmptyHeader><EmptyTitle>This conversation is unavailable.</EmptyTitle><EmptyDescription>Ask your friend for a new invitation.</EmptyDescription></EmptyHeader><Button variant="outline" onClick={onBack}>Back to conversations</Button></Empty>

  const entries = Object.entries(messages ?? {}).sort(([a], [b]) => a.localeCompare(b))
  return (
    <div className="conversation-content">
      <header className="conversation-header">
        <Button variant="ghost" size="icon" onClick={onBack} disabled={call.active} aria-label="Back to conversations" className="conversation-back"><ArrowLeft /></Button>
        <span className="room-avatar"><MessageCircle aria-hidden="true" /></span>
        <div className="conversation-title"><h2>{room.title}</h2><p>{other ? `With ${other.name}` : 'Your friend’s spot is waiting'} · {connected ? 'Live sync' : 'Reconnecting…'}</p></div>
        <div className="call-actions"><Button variant="outline" size="icon" aria-label="Start voice call" title={other ? 'Voice call' : 'Invite a friend to call'} disabled={!other || call.active || !connected} onClick={() => other && call.start('audio', other.uid)}><Phone /></Button><Button variant="outline" size="icon" aria-label="Start video call" title={other ? 'Video call' : 'Invite a friend to call'} disabled={!other || call.active || !connected} onClick={() => other && call.start('video', other.uid)}><Video /></Button></div>
      </header>
      {!room.guest && <div className="invite-banner"><div><strong>A space for the two of you.</strong><p>Share a one-person invitation. Valid for 24 hours after creation.</p></div><Button variant="outline" size="sm" onClick={copyInvite} disabled={room.inviteExpiresAt < Date.now()}>{copied ? <Check /> : <Copy />}{room.inviteExpiresAt < Date.now() ? 'Invite expired' : copied ? 'Copied' : 'Copy invite'}</Button>{manualInvite && <Input aria-label="Invitation link — select and copy" readOnly value={manualInvite} onFocus={(event) => event.target.select()} />}</div>}
      <CallPanel call={call} friendName={other?.name ?? 'Your friend'} />
      {(error || messagesError) && <Alert variant="destructive" className="chat-error"><AlertTitle>Message not sent or loaded</AlertTitle><AlertDescription>{error || friendlyError(messagesError)}</AlertDescription></Alert>}
      <MessageScroller className="transcript"><MessageScrollerViewport><MessageScrollerContent className="p-5 sm:p-8">
        <Marker variant="separator"><MarkerContent>Just your little corner</MarkerContent></Marker>
        {messages === undefined && !messagesError && <p className="loading-line" role="status">Loading messages…</p>}
        {entries.length >= messageLimit && <Button variant="ghost" size="sm" onClick={() => setMessageLimit((limit) => limit + 100)}>Load earlier messages</Button>}
        {messages === null && <Empty><EmptyHeader><EmptyMedia variant="icon"><MessageCircle /></EmptyMedia><EmptyTitle>A simple hello is a lovely start.</EmptyTitle><EmptyDescription>No messages yet. Be the first to say something.</EmptyDescription></EmptyHeader></Empty>}
        {entries.map(([id, message]) => {
          const own = message.senderId === user.uid
          return <MessageScrollerItem key={id}><Message align={own ? 'end' : 'start'}><MessageContent><Bubble variant={own ? 'default' : 'secondary'} align={own ? 'end' : 'start'}><BubbleContent><p className="whitespace-pre-wrap wrap-anywhere">{message.text}</p></BubbleContent></Bubble><MessageFooter>{own ? 'You' : other?.name ?? 'Friend'} · {typeof message.createdAt === 'number' ? new Date(message.createdAt).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Sending…'}</MessageFooter></MessageContent></Message></MessageScrollerItem>
        })}
      </MessageScrollerContent></MessageScrollerViewport><MessageScrollerButton /></MessageScroller>
      <form onSubmit={submit} className="message-composer"><label htmlFor="message" className="sr-only">Your message</label><textarea id="message" placeholder="A little hello…" value={text} onChange={(event) => setText(event.target.value)} maxLength={4000} rows={2} disabled={sending} onKeyDown={(event) => {
        if (event.nativeEvent.isComposing || event.keyCode === 229) return
        if (event.key === 'Enter' && !event.shiftKey) { event.preventDefault(); event.currentTarget.form?.requestSubmit() }
      }} /><Button type="submit" size="icon" disabled={sending || !text.trim() || !connected} aria-label="Send message">{sending ? <LoaderCircle className="animate-spin" /> : <Send />}</Button><p>{connected ? 'Enter to send · Shift + Enter for a new line' : 'You’re offline. Your draft stays here until you reconnect.'}<span>{text.length}/4,000</span></p></form>
    </div>
  )
}
