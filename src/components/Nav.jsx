import { useEffect, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import Logo from './Logo'

const links = [
  ['Home', '/'],
  ['Work', '/work'],
  ['Services', '/services'],
  ['Process', '/process'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

export default function Nav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    const onKey = (e) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [open])

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-ink/90 to-transparent">
        <div className="flex items-center justify-between px-gutter py-5 ">
          <Link to="/" onClick={close} aria-label="Apex Studios home">
            <Logo />
          </Link>
          <div className="flex items-center gap-3 md:gap-4">
            <Link
              to="/contact"
              onClick={close}
              className="rounded-full border border-paper/25 px-5 py-2.5 text-sm font-medium transition-colors hover:border-amber hover:text-amber"
            >
              Let&apos;s Talk
            </Link>
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="site-menu"
              aria-label={open ? 'Close menu' : 'Open menu'}
              className="group flex items-center gap-3 text-xs font-semibold uppercase tracking-widest"
            >
              <span className="hidden sm:inline">{open ? 'Close' : 'Menu'}</span>
              <span className="grid h-11 w-11 place-items-center rounded-full border border-paper/25 bg-paper/5 transition-colors group-hover:border-amber">
                <span className="flex flex-col gap-1.5">
                  <span
                    className={`block h-0.5 w-5 bg-paper transition-transform ${open ? 'translate-y-1 rotate-45' : ''}`}
                  />
                  <span
                    className={`block h-0.5 w-5 bg-paper transition-transform ${open ? '-translate-y-1 -rotate-45' : ''}`}
                  />
                </span>
              </span>
            </button>
          </div>
        </div>
      </header>

      {open && (
        <div
          id="site-menu"
          className="fixed inset-0 z-40 flex flex-col justify-center bg-ink px-gutter "
        >
          <nav className="flex flex-col gap-2">
            {links.map(([label, to], i) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={close}
                className={({ isActive }) =>
                  `font-display text-5xl font-extrabold tracking-tight transition-colors hover:text-amber md:text-7xl ${isActive ? 'text-amber' : ''}`
                }
              >
                <span className="mr-4 align-top text-sm font-medium text-paper/40">
                  0{i + 1}
                </span>
                {label}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </>
  )
}
