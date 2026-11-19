import Motion, { Reveal } from './Motion'
import Prefetch from './Prefetch'
import Fx from './Fx'
import { FX } from '../lib/fx'
import { morph } from '../lib/morph'
import { lazy, Suspense, useEffect, useMemo, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'
import BackToTop from './BackToTop'
import PageScene from './PageScene'
import PageField from './PageField'

// The chat assistant is a big file (about 800 lines) that nobody needs in the first second. It is
// fetched once the browser is idle, or at the visitor's first touch, click, key or scroll, whichever
// comes first. Its button is position: fixed, so it appearing a moment later moves nothing.
const ChatLauncher = lazy(() => import('./ChatLauncher'))

function DeferredChat() {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const go = () => setReady(true)
    const events = ['pointerdown', 'keydown', 'scroll', 'apex:ask']
    events.forEach((e) => window.addEventListener(e, go, { once: true, passive: true }))
    const idle = 'requestIdleCallback' in window ? requestIdleCallback(go, { timeout: 4000 }) : setTimeout(go, 2500)
    return () => {
      events.forEach((e) => window.removeEventListener(e, go))
      if ('requestIdleCallback' in window) cancelIdleCallback(idle)
      else clearTimeout(idle)
    }
  }, [])
  return ready ? (
    <Suspense fallback={null}>
      <ChatLauncher />
    </Suspense>
  ) : null
}

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    // 'instant' on purpose: the page has scroll-behavior: smooth for anchors, and a route change must never glide.
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [pathname])
  return null
}

export default function Layout() {
  const { pathname, key } = useLocation()
  // Decided once per page change (not on later re-renders), and skipped when a card is morphing into its page.
  const fadeIn = useMemo(() => FX.pageFade && key !== 'default' && !morph.active, [pathname, key]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <>
      <a
        href="#main-content"
        className="skip-link"
      >
        Skip to content
      </a>
      <ScrollToTop />
      <Motion />
      <Fx />
      <Prefetch />
      <PageField />
      <PageScene />
      <Nav />
      <main
        key={pathname}
        id="main-content"
        tabIndex={-1}
        className={`outline-none${fadeIn ? ' page-in' : ''}`}
      >
        {/* Full screen height, so the footer stays below the fold until the page's code arrives. At 60vh the
            footer was visible, then pushed off screen: a layout shift of 0.4 on every direct visit to an inner page. */}
        <Suspense fallback={<div style={{ minHeight: '100svh' }} aria-hidden="true" />}>
          <Outlet />
          <Reveal />
        </Suspense>
      </main>
      <Footer />
      <BackToTop />
      <DeferredChat />
    </>
  )
}
