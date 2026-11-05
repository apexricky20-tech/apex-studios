import { Link } from 'react-router-dom'
import Logo from './Logo'
import { useSite, useContact } from '../lib/content'
import { visibleArticles } from '../data/articles'

const makeColumns = (contact) => [
  {
    title: 'Explore',
    links: [
      ['Work', '/work'],
      ['Process', '/process'],
      ...(visibleArticles().length ? [['Articles', '/articles']] : []),
    ],
  },
  {
    title: 'Services',
    links: [
      ['Website Design', '/website-design'],
      ['Development', '/development'],
      ['Automation', '/automation'],
      ['Branding', '/branding'],
      ['Google Business Profile', '/google-business-profile'],
    ],
  },
  {
    title: 'Solutions',
    links: [
      ['Hotel Websites', '/services'],
      ['Restaurant Websites', '/services'],
      ['Lodge Websites', '/services'],
      ['Online Ordering', '/services'],
    ],
  },
  {
    title: 'Studio',
    links: [
      ['About', '/about'],
      ["Let's Talk", '/contact'],
    ],
  },
  {
    title: 'Contact',
    links: [
      contact.email && ['Email', `mailto:${contact.email}`],
      ['Contact form', '/contact'],
      contact.whatsapp && ['WhatsApp', `https://wa.me/${contact.whatsapp}`],
      contact.instagram && ['Instagram', contact.instagram],
      contact.tiktok && ['TikTok', contact.tiktok],
    ].filter(Boolean),
  },
]

const linkClass = 'text-sm text-muted transition-colors hover:text-amber'

function FooterLink({ label, href }) {
  const external = /^(https?:|mailto:)/.test(href)
  return external ? (
    <a href={href} className={linkClass} target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
      {label}
    </a>
  ) : (
    <Link to={href} className={linkClass}>
      {label}
    </Link>
  )
}

export default function Footer() {
  const site = useSite()
  const contact = useContact()
  const columns = makeColumns(contact)
  return (
    <footer className="border-t border-paper/10 px-gutter pb-8 pt-20 md:pt-28">
      <div className="mx-auto grid max-w-[2000px] grid-cols-2 gap-x-6 gap-y-12 md:grid-cols-3 lg:grid-cols-[minmax(0,1.7fr)_repeat(5,minmax(0,1fr))]">
        <div className="col-span-2 md:col-span-3 lg:col-span-1">
          <Link to="/" aria-label="Apex Studios home">
            <Logo />
          </Link>
          <p className="mt-6 max-w-xs text-paper/70">
            Websites for hotels, lodges and restaurants, designed and built to get you found
            and booked.
          </p>
          <div className="mt-8 flex max-w-sm items-center justify-between gap-3 rounded-full border border-paper/20 p-2 pl-6">
            {contact.email ? (
              <a href={`mailto:${contact.email}`} className="truncate text-sm text-paper/70 hover:text-amber">
                {contact.email}
              </a>
            ) : (
              <span className="truncate text-sm text-muted">Tell us about your project</span>
            )}
            <Link
              to="/contact"
              className="shrink-0 rounded-full bg-paper px-5 py-3 text-sm font-semibold text-ink transition-colors hover:bg-amber"
            >
              Let&apos;s Talk
            </Link>
          </div>
        </div>

        {columns.map((col) => (
          <nav key={col.title} aria-label={col.title}>
            <h3 className="text-sm font-semibold tracking-normal">{col.title}</h3>
            <ul className="mt-5 space-y-3">
              {col.links.map(([label, href]) => (
                <li key={label}>
                  <FooterLink label={label} href={href} />
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="mx-auto mt-16 flex max-w-[2000px] flex-wrap items-center justify-between gap-2 border-t border-paper/10 pt-6 text-xs text-muted">
        <p>© {new Date().getFullYear()} APEX STUDIOS. All rights reserved.</p>
        <p>{site.location}</p>
      </div>
    </footer>
  )
}
