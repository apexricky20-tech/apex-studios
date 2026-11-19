import { Link } from 'react-router-dom'
import { useVisibleProjects } from '../lib/content'
import { forProject } from '../data/testimonials'
import ClientQuote from './ClientQuote'
import ScoreRings from './ScoreRings'
import LiveNumber from './LiveNumber'
import { isPageSpeed, parseScores } from '../lib/scores'

// Real, measured results from your own projects, shown right under the hero.
// It reads the first project that has `results` filled in (src/data/projects.js or the dashboard).
export default function ProofStrip() {
  const projects = useVisibleProjects()
  const lead = projects.find((p) => p.results?.length)
  if (!lead) return null
  const voice = forProject(lead.slug)[0]
  const others = projects.filter((p) => p.slug !== lead.slug).map((p) => p.title)
  return (
    <section aria-labelledby="proof-title" className="mx-auto max-w-[1220px] px-gutter pt-20 md:pt-28">
      <p className="text-sm uppercase tracking-widest text-amber">Recent result</p>
      <h2 id="proof-title" className="mt-4 max-w-3xl text-3xl md:text-5xl">
        {lead.title}
      </h2>
      <div className="mt-10 grid gap-4 md:grid-cols-2">
        {lead.results.map((r) => {
          const scores = isPageSpeed(r.label) ? parseScores(r.value) : []
          return (
          <div key={r.label} data-tilt className="relative rounded-2xl border border-paper/15 bg-surface p-6">
            <p className="text-xs uppercase tracking-widest text-muted">{r.label}</p>
            <p className="mt-3 text-xl md:text-2xl">{scores.length > 0 ? r.value : <LiveNumber text={r.value} />}</p>
            {scores.length > 0 && <ScoreRings scores={scores} />}
            {r.note && <p className="mt-3 text-sm text-muted">{r.note}</p>}
          </div>
          )
        })}
      </div>
      {voice && <ClientQuote t={voice} className="mt-10 max-w-3xl" />}
      <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-3">
        <Link
          to={`/work/${lead.slug}`}
          className="border-b border-paper pb-0.5 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
        >
          Read the case study &rsaquo;
        </Link>
        {others.length > 0 && <p className="text-sm text-muted">Also built: {others.join(' · ')}</p>}
      </div>
    </section>
  )
}
