import { Link } from 'react-router-dom'
import { useContact } from '../lib/content'

const links = [
  ['Home', '/'],
  ['Our work', '/work'],
  ['Services', '/services'],
  ['Contact', '/contact'],
]

export default function NotFound() {
  const { whatsapp } = useContact()
  return (
    <div className="mx-auto max-w-4xl px-gutter pb-24 pt-40">
      <title>Page not found | Apex Studios</title>
      <meta name="robots" content="noindex" />
      <p className="text-sm uppercase tracking-widest text-muted">Error 404</p>
      <h1 className="mt-6 text-5xl md:text-7xl">Page not found.</h1>
      <p className="mt-6 max-w-xl text-lg text-muted">
        The page you were looking for has moved or does not exist. Try one of these instead.
      </p>
      <ul className="mt-10 flex flex-wrap gap-3">
        {links.map(([label, to]) => (
          <li key={to}>
            <Link
              to={to}
              className="inline-block rounded-full border border-paper/25 px-6 py-3 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
      {whatsapp && (
        <p className="mt-10 text-muted">
          Looking for something specific?{' '}
          <a
            href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
            target="_blank"
            rel="noreferrer"
            className="text-amber hover:underline"
          >
            Message us on WhatsApp
          </a>
          .
        </p>
      )}
    </div>
  )
}
