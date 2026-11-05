import { Link } from 'react-router-dom'
import { useSite } from '../lib/content'

const fade = 'linear-gradient(to bottom, black 70%, transparent 100%)'

export default function Hero() {
  const site = useSite()
  return (
    <>
      {/* Layer 1: the portrait stays pinned while the page scrolls over it */}
      <div className="sticky top-0 z-0 h-svh overflow-hidden bg-ink">
        <div className="absolute inset-x-0 bottom-[46svh] top-20 flex justify-center md:bottom-[36svh]">
          <img
            src={site.portrait}
            alt={`Portrait of ${site.name}, founder of Apex Studios`}
            fetchPriority="high"
            className="hero-portrait h-full w-auto max-w-full object-contain"
            style={{ maskImage: fade, WebkitMaskImage: fade }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
      </div>

      {/* Layer 2: the text sits over the portrait, then scrolls away */}
      <div data-hero className="relative z-10 -mt-[100svh] flex h-svh flex-col items-center justify-end px-gutter pb-8 text-center">
        <h1 className="sr-only">Websites for hotels, lodges and restaurants</h1>
        <p className="hero-rise max-w-2xl text-base text-paper md:text-lg" style={{ animationDelay: '250ms' }}>
          I&apos;m {site.name}, founder of Apex Studios. I design and build fast, immersive
          websites for hotels, lodges and restaurants.
        </p>

        <div className="hero-rise mt-6 flex flex-wrap justify-center gap-3" style={{ animationDelay: '400ms' }}>
          <Link
            to="/contact"
            className="rounded-full bg-paper px-9 py-4 text-sm font-semibold uppercase tracking-wider text-ink transition-colors hover:bg-amber"
          >
            Contact
          </Link>
          <Link
            to="/work"
            className="rounded-full border border-paper/25 px-9 py-4 text-sm font-semibold uppercase tracking-wider transition-colors hover:border-amber hover:text-amber"
          >
            Portfolio
          </Link>
        </div>

        <ul className="hero-rise mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper/70" style={{ animationDelay: '550ms' }}>
          {site.available !== false && (
          <li className="flex items-center gap-2 text-paper">
            <span className="relative flex h-2 w-2" aria-hidden="true">
              <span className="absolute inline-flex h-full w-full rounded-full bg-[#12b76a] opacity-75 motion-safe:animate-ping" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#12b76a]" />
            </span>
            {site.availability}
          </li>
          )}
          <li>{site.role}</li>
          <li>{site.location}</li>
        </ul>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="hero-rise mt-6 flex items-center gap-2 text-xs font-medium text-paper transition-colors hover:text-amber" style={{ animationDelay: '700ms' }}
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4 motion-safe:animate-bounce"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            aria-hidden="true"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
          Scroll to explore
        </button>
      </div>
    </>
  )
}
