"use client"

import { useState, type FormEvent } from 'react'
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, sendPasswordResetEmail, updateProfile } from 'firebase/auth'
import { firebaseClient, friendlyError, type FirebaseConfig } from '@/lib/firebase'
import { ArrowRight, ArrowLeft, Eye, EyeOff, Info, LockKeyhole } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Field, FieldGroup, FieldLabel } from '@/components/ui/field'
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert'

export type AuthMode = 'login' | 'signup' | 'reset'

export function AuthForm({ config, mode, setMode, configurationError }: { config: FirebaseConfig; mode: AuthMode; setMode: (mode: AuthMode) => void; configurationError?: string }) {
  const [showPassword, setShowPassword] = useState(false)
  const [notice, setNotice] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const changeMode = (next: AuthMode) => { if (busy) return; setNotice(''); setError(''); setMode(next) }
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const fields = new FormData(event.currentTarget)
    const email = String(fields.get('email') ?? '').trim()
    const password = String(fields.get('password') ?? '')
    setBusy(true); setError(''); setNotice('')
    try {
      const { auth } = firebaseClient(config)
      if (mode === 'reset') {
        await sendPasswordResetEmail(auth, email)
        setNotice('If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.')
      } else if (mode === 'signup') {
        const name = String(fields.get('name') ?? '').trim()
        if (!name) throw new Error('Please enter your name.')
        const { user } = await createUserWithEmailAndPassword(auth, email, password)
        await updateProfile(user, { displayName: name })
      } else {
        await signInWithEmailAndPassword(auth, email, password)
      }
    } catch (error) {
      if (mode === 'reset' && typeof error === 'object' && error !== null && 'code' in error && error.code === 'auth/user-not-found') {
        setNotice('If an account exists for that email, a password reset link has been sent. Check your inbox and spam folder.')
      } else setError(friendlyError(error))
    } finally { setBusy(false) }
  }
  return (
    <>
      <div className="auth-heading"><p className="small-eyebrow">YOUR NEXT CONVERSATION STARTS HERE</p><h2>{mode === 'login' ? 'Hey, welcome back.' : mode === 'signup' ? 'Find your people.' : 'Let’s get you back in.'}</h2><p>{mode === 'login' ? 'Your people are just a hello away.' : mode === 'signup' ? 'A little space for your favorite connections.' : 'Enter your email to reset your password.'}</p></div>
      <form onSubmit={submit} className="auth-form">
        <FieldGroup>
          {mode === 'signup' && <Field><FieldLabel htmlFor="name">Your name</FieldLabel><Input id="name" name="name" autoComplete="name" placeholder="What should we call you?" required maxLength={80} /></Field>}
          <Field><FieldLabel htmlFor="email">Email address</FieldLabel><Input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" required maxLength={254} /></Field>
          {mode !== 'reset' && <Field><div className="password-label"><FieldLabel htmlFor="password">Password</FieldLabel>{mode === 'login' && <button type="button" onClick={() => changeMode('reset')} className="text-action">Forgot password?</button>}</div><Input id="password" name="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'signup' ? 'Create a password (8+ characters)' : 'Enter your password'} minLength={mode === 'signup' ? 8 : undefined} required /><button className="password-toggle" type="button" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>{showPassword ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}{showPassword ? 'Hide password' : 'Show password'}</button></Field>}
        </FieldGroup>
        {(error || configurationError) && <Alert variant="destructive" className="setup-alert"><Info /><AlertTitle>Couldn&apos;t continue</AlertTitle><AlertDescription>{error || configurationError}</AlertDescription></Alert>}
        {notice && <Alert className="setup-alert"><Info /><AlertTitle>Check your inbox</AlertTitle><AlertDescription>{notice}</AlertDescription></Alert>}
        <Button type="submit" size="lg" className="submit-button" disabled={busy || !!configurationError} aria-busy={busy}>{busy ? 'Connecting…' : mode === 'login' ? 'Let’s catch up' : mode === 'signup' ? 'Create your account' : 'Send reset link'}<ArrowRight data-icon="inline-end" /></Button>
        <p className="email-only"><LockKeyhole aria-hidden="true" />Just your email. No social account needed.</p>
      </form>
      <div className="auth-switch">{mode === 'login' ? <><span>New around here?</span><button type="button" onClick={() => changeMode('signup')}>Make yourself at home <ArrowUpRightSmall /></button></> : <button type="button" onClick={() => changeMode('login')}><ArrowLeft aria-hidden="true" /> Back to sign in</button>}</div>
    </>
  )
}

function ArrowUpRightSmall() {
  return <ArrowRight aria-hidden="true" className="tilted-arrow" />
}
