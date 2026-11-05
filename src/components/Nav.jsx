import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'

const links = [
  ['Work', '/work'],
  ['Services', '/services'],
  ['Process', '/process'],
  ['About', '/about'],
  ['Contact', '/contact'],
]

const linkClass = ({ isActive }) =>
  `transition-colors hover:text-amber ${isActive ? 'text-amber' : ''}`

export default function Nav() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-ink/70 backdrop-blur">
      <div className="flex items-center justify-between px-6 py-5 md:px-12">
        <Link to="/" onClick={close} className="font-display text-xl font-extrabold tracking-tight">
          APEX<span className="text-amber">.</span>STUDIOS
        </Link>
        <nav className="hidden gap-8 text-sm md:flex">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} className={linkClass}>
              {label}
            </NavLink>
          ))}
        </nav>
        <Link
          to="/contact"
          className="hidden rounded-full bg-amber px-5 py-2 text-sm font-semibold text-ink md:inline-block"
        >
          Start a project
        </Link>
        <button
          className="text-sm font-semibold md:hidden"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Toggle menu"
        >
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      {open && (
        <nav className="flex flex-col gap-4 px-6 pb-6 text-lg md:hidden">
          {links.map(([label, to]) => (
            <NavLink key={to} to={to} onClick={close} className={linkClass}>
              {label}
            </NavLink>
          ))}
          <Link
            to="/contact"
            onClick={close}
            className="mt-2 inline-block rounded-full bg-amber px-6 py-3 text-center font-semibold text-ink"
          >
            Start a project
          </Link>
        </nav>
      )}
    </header>
  )
}
