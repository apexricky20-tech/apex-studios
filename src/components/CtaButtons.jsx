import { Link, useLocation } from 'react-router-dom'
import { useContact } from '../lib/content'
import { waHref, waMessage } from '../lib/whatsapp'

// The two ways to start: a free check (form) or a WhatsApp chat. Used in the hero and at the end of service pages.
export default function CtaButtons({ topic, className = '', style }) {
  const { whatsapp } = useContact()
  const { pathname } = useLocation()
  const wa = waHref(whatsapp, waMessage(pathname, topic))
  return (
    <div className={`flex flex-wrap gap-3 ${className}`} style={style}>
      <Link
        to="/contact?offer=free-check"
        className="rounded-full bg-paper px-8 py-4 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber"
      >
        Get a free digital check
      </Link>
      {wa && (
        <a
          href={wa}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-paper/25 px-8 py-4 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-amber hover:text-amber"
        >
          Chat on WhatsApp
        </a>
      )}
    </div>
  )
}
