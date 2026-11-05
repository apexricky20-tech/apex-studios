import { Link } from 'react-router-dom'
import { site } from '../data/site'

const fade = 'linear-gradient(to bottom, black 70%, transparent 100%)'

export default function Hero() {
  return (
    <>
      {/* Layer 1: the portrait stays pinned while the page scrolls over it */}
      <div className="sticky top-0 z-0 h-svh overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_35%,rgba(245,165,36,0.12),transparent_60%)]" />
        <div className="absolute inset-x-0 bottom-[46svh] top-20 flex justify-center md:bottom-[36svh]">
          <img
            src={site.portrait}
            alt={`Portrait of ${site.name}, founder of Apex Studios`}
            fetchPriority="high"
            className="h-full w-auto max-w-full object-contain"
            style={{ maskImage: fade, WebkitMaskImage: fade }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-ink via-ink/80 to-transparent" />
      </div>

      {/* Layer 2: the text sits over the portrait, then scrolls away */}
      <div className="relative z-10 -mt-[100svh] flex h-svh flex-col items-center justify-end px-6 pb-8 text-center">
        <h1 className="sr-only">Websites for hotels, lodges and restaurants</h1>
        <p className="max-w-2xl text-base text-paper/80 md:text-lg">
          I&apos;m {site.name}, founder of Apex Studios. I design and build fast, immersive
          websites for hotels, lodges and restaurants.
        </p>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
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

        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-paper/50">
          <li className="flex items-center gap-2 text-paper">
            <span className="h-2 w-2 rounded-full bg-emerald-500" aria-hidden="true" />
            {site.availability}
          </li>
          <li>{site.role}</li>
          <li>{site.location}</li>
        </ul>

        <button
          type="button"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
          className="mt-6 flex items-center gap-2 text-xs font-medium text-paper/80 transition-colors hover:text-amber"
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
