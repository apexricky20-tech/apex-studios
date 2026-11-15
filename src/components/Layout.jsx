import Motion from './Motion'
import Fx from './Fx'
import { FX } from '../lib/fx'
import { useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Nav from './Nav'
import Footer from './Footer'
import BackToTop from './BackToTop'
import ChatLauncher from './ChatLauncher'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])
  return null
}

export default function Layout() {
  const { pathname, key } = useLocation()
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
      <Nav />
      <main
        key={pathname}
        id="main-content"
        tabIndex={-1}
        className={`outline-none${FX.pageFade && key !== 'default' ? ' page-in' : ''}`}
      >
        <Outlet />
      </main>
      <Footer />
      <BackToTop />
      <ChatLauncher />
    </>
  )
}
