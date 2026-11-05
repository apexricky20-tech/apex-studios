import { useEffect, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import Logo from './Logo'
import { contact } from '../data/contact'

const links = [
  ['Home', '/'],
  ['Work', '/work'],
  ['Services', '/services'],
  ['Process', '/process'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

// Point the unbuilt ones at their own page as each one is created
const serviceLinks = [
  ['All services', '/services'],
  ['Website Design', '/website-design'],
  ['Development', '/development'],
  ['Automation', '/automation'],
  ['Branding', '/branding'],
  ['Google Business Profile', '/google-business-profile'],
]

const linkClass = (isActive) =>
  `w-fit font-display text-5xl font-bold leading-[1.3] tracking-tight transition-colors hover:text-paper md:text-7xl ${
    isActive ? 'text-paper' : 'text-muted'
  }`

export default function Nav() {
  const { pathname } = useLocation()
  const onServices = ['/services', '/website-design', '/google-business-profile', '/development', '/automation', '/branding'].some((p) => pathname.startsWith(p))
  const [open, setOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(false)
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

  const toggleMenu = () => {
    if (!open) setServicesOpen(onServices)
    setOpen(!open)
  }

  return (
    <>
      <header
        className={`fixed inset-x-0 top-0 z-50 transition-colors ${
          open
            ? 'border-b border-paper/10 bg-ink'
            : 'bg-gradient-to-b from-ink/90 to-transparent'
        }`}
      >
        <div className="flex items-center justify-between px-gutter py-5">
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
              onClick={toggleMenu}
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
          className="fixed inset-0 z-40 flex flex-col overflow-y-auto bg-surface px-gutter pb-10 pt-32"
        >
          <nav className="my-auto flex flex-col">
            {links.map(([label, to]) =>
              label === 'Services' ? (
                <div key={to}>
                  <button
                    type="button"
                    onClick={() => setServicesOpen(!servicesOpen)}
                    aria-expanded={servicesOpen}
                    aria-controls="services-submenu"
                    className={`flex items-center gap-4 ${linkClass(servicesOpen || onServices)}`}
                  >
                    Services
                    <svg
                      viewBox="0 0 24 24"
                      className={`mt-2 h-7 w-7 transition-transform duration-300 md:h-10 md:w-10 ${servicesOpen ? 'rotate-180' : ''}`}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      aria-hidden="true"
                    >
                      <path d="M4 8l8 8 8-8" />
                    </svg>
                  </button>
                  {servicesOpen && (
                    <ul id="services-submenu" className="mb-4 mt-2 flex flex-col gap-2 pl-1 md:pl-6">
                      {serviceLinks.map(([name, href], i) => (
                        <li key={`${name}-${i}`}>
                          <NavLink
                            to={href}
                            end
                            onClick={close}
                            className={({ isActive }) =>
                              `text-xl transition-colors hover:text-paper md:text-2xl ${
                                isActive && href !== '/services' ? 'text-paper' : 'text-muted'
                              }`
                            }
                          >
                            {name}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={close}
                  className={({ isActive }) => linkClass(isActive)}
                >
                  {label}
                </NavLink>
              ),
            )}
          </nav>

          <div className="mt-10 flex flex-col gap-2 md:ml-auto md:mt-0 md:text-right">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="text-lg font-medium text-paper transition-colors hover:text-amber"
              >
                {contact.email}
              </a>
            )}
            <p className="text-xs text-muted">Nairobi, Kenya</p>
            <div className="mt-3 flex gap-5 text-sm text-muted md:justify-end">
              {contact.instagram && (
                <a href={contact.instagram} target="_blank" rel="noreferrer" className="transition-colors hover:text-amber">
                  Instagram
                </a>
              )}
              {contact.tiktok && (
                <a href={contact.tiktok} target="_blank" rel="noreferrer" className="transition-colors hover:text-amber">
                  TikTok
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}