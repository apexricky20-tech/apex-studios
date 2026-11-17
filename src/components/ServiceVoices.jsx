import { useLocation } from 'react-router-dom'
import { forService } from '../data/testimonials'
import ClientQuote from './ClientQuote'

// Reviews that prove this exact service, placed just before the page's closing call to action.
export default function ServiceVoices() {
  const { pathname } = useLocation()
  const voices = forService(pathname)
  if (!voices.length) return null
  return (
    <section aria-labelledby="svc-voices" className="mt-32 border-t border-paper/15 pt-20 md:mt-40">
      <p className="text-sm font-medium uppercase tracking-widest text-amber">From clients</p>
      <h2 id="svc-voices" className="mt-4 text-4xl md:text-6xl">
        Proof, in their words
      </h2>
      <div className="mt-12 grid gap-10 md:grid-cols-2">
        {voices.map((t) => (
          <ClientQuote key={t.id} t={t} text="full" />
        ))}
      </div>
    </section>
  )
}
