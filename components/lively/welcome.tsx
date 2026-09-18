"use client"

import Image from 'next/image'
import { useState } from 'react'
import { ArrowUpRight, MessageCircle, Phone, Video, Heart, ArrowRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AuthForm, type AuthMode } from '@/components/lively/auth-form'

import type { FirebaseConfig } from '@/lib/firebase'

export function Welcome({ config, configurationError }: { config: FirebaseConfig; configurationError?: string }) {
  const [mode, setMode] = useState<AuthMode>('login')
  const openSignup = () => {
    setMode('signup')
    document.getElementById('join-lively')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  return (
    <div className="site-shell">
      <header className="site-header">
        <a href="/" className="wordmark" aria-label="lively home"><span className="brand-symbol"><MessageCircle aria-hidden="true" /></span>lively<span className="brand-dot">.</span></a>
        <p className="header-note">Good conversations. Closer connections.</p>
        <Button variant="outline" className="header-join" onClick={openSignup}>Join your people <ArrowUpRight data-icon="inline-end" /></Button>
      </header>
      <main className="welcome-layout">
        <section className="welcome-story" aria-labelledby="welcome-title">
          <div className="story-copy">
            <p className="eyebrow"><span /> YOUR PEOPLE. YOUR LITTLE CORNER.</p>
            <h1 id="welcome-title">A little closer,<br />wherever you <span className="serif-word">are.</span></h1>
            <p className="intro">The big news. The tiny updates. The just-because calls.<br className="desktop-break" /> A cozy place to keep your favorite people close.</p>
          </div>
          <div className="illustration-wrap">
            <Image src="/images/lively-friends.png" alt="Two friendly green and yellow characters sitting together, sharing a conversation" width={1024} height={768} priority className="friends-illustration" />
            <div className="illustration-label label-chat"><MessageCircle aria-hidden="true" /><span>A little hello goes a long way.</span></div>
            <div className="illustration-label label-call"><span className="call-icon"><Phone aria-hidden="true" /></span><div><strong>Less scrolling.</strong><span>More catching up.</span></div></div>
          </div>
          <div className="feature-list" aria-label="Chat and calling features">
            <span><MessageCircle aria-hidden="true" />Real-time chats</span><span><Phone aria-hidden="true" />Voice calls</span><span><Video aria-hidden="true" />Face-to-face moments</span>
          </div>
        </section>
        <section className="auth-section" id="join-lively" aria-label="Account access">
          <div className="auth-card">
            <div className="hello-symbol"><MessageCircle aria-hidden="true" /><span /></div>
            <AuthForm config={config} mode={mode} setMode={setMode} configurationError={configurationError} />
          </div>
          <div className="below-card"><Heart aria-hidden="true" /><p>Made for friends. Not followers.</p></div>
          <p className="connection-note">Email login powered by Firebase · Your own little corner</p>
        </section>
      </main>
      <footer className="site-footer"><span>© {new Date().getFullYear()} lively. A little more together.</span><a href="https://firebase.google.com/docs/web/setup" target="_blank" rel="noreferrer">Firebase setup guide <ArrowRight aria-hidden="true" /></a><span className="footer-note"><span />Built for real connection</span></footer>
    </div>
  )
}
