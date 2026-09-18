import { get, push, ref, serverTimestamp, set } from 'firebase/database'
import type { User } from 'firebase/auth'
import { firebaseClient, type FirebaseConfig } from '@/lib/firebase'

export type Member = { uid: string; name: string }
export type Room = { title: string; host: Member; guest?: Member; createdAt: number; inviteExpiresAt: number }
export type RoomIndex = Record<string, { title: string; joinedAt: number }>
export type ChatMessage = { senderId: string; text: string; createdAt: number }
export type CallData = { id: string; callerUid: string; calleeUid: string; kind: 'audio' | 'video'; status: 'ringing' | 'accepted' | 'ended'; createdAt: number; offer: { type: 'offer'; sdp: string }; answer?: { type: 'answer'; sdp: string } }

export function memberFor(user: User): Member {
  return { uid: user.uid, name: (user.displayName || user.email?.split('@')[0] || 'Friend').slice(0, 80) }
}

export function parseRoomCode(value: string) {
  let code = value.trim()
  try { code = new URL(code).hash.replace(/^#join=/, '') } catch { /* Plain invitation codes are accepted too. */ }
  if (!/^[a-f0-9]{32}$/.test(code)) throw new Error('Paste the complete invitation link or its 32-character code.')
  return code
}

export async function rememberRoom(config: FirebaseConfig, user: User, id: string, title: string) {
  await set(ref(firebaseClient(config).database, `lively/userRooms/${user.uid}/${id}`), { title, joinedAt: serverTimestamp() })
}

export async function createRoom(config: FirebaseConfig, user: User, title: string) {
  const cleanTitle = title.trim()
  if (!cleanTitle || cleanTitle.length > 60) throw new Error('Give your conversation a name of 1–60 characters.')
  const database = firebaseClient(config).database
  const id = crypto.randomUUID().replaceAll('-', '')
  const offsetSnapshot = await get(ref(database, '.info/serverTimeOffset'))
  const now = Date.now() + Number(offsetSnapshot.val() || 0)
  await set(ref(database, `lively/rooms/${id}`), { title: cleanTitle, host: memberFor(user), createdAt: serverTimestamp(), inviteExpiresAt: now + 86400000 })
  await rememberRoom(config, user, id, cleanTitle)
  return id
}

export async function joinRoom(config: FirebaseConfig, user: User, value: string) {
  const id = parseRoomCode(value)
  const database = firebaseClient(config).database
  let room: Room | null = null
  try { room = (await get(ref(database, `lively/rooms/${id}`))).val() } catch { /* New invitees cannot read a private room before joining. */ }
  if (!room) {
    try { await set(ref(database, `lively/rooms/${id}/guest`), memberFor(user)) }
    catch { throw new Error('This invitation may be full, expired, or unavailable. Ask your friend for a new conversation. If no invitations work, check the Realtime Database rules.') }
    room = (await get(ref(database, `lively/rooms/${id}`))).val() as Room
  }
  if (!room || (room.host.uid !== user.uid && room.guest?.uid !== user.uid)) throw new Error('This invitation is not available.')
  await rememberRoom(config, user, id, room.title)
  return id
}

export async function sendMessage(config: FirebaseConfig, user: User, roomId: string, text: string) {
  const clean = text.trim()
  if (!clean || clean.length > 4000) throw new Error('Messages must contain 1–4,000 characters.')
  await set(push(ref(firebaseClient(config).database, `lively/messages/${roomId}`)), { senderId: user.uid, text: clean, createdAt: serverTimestamp() })
}
