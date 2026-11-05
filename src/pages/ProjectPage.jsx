import { Link, useParams } from 'react-router-dom'
import { visibleProjects } from '../data/projects'
import NotFound from './NotFound'

function Row({ label, children }) {
  return (
    <div className="grid gap-4 border-t border-paper/15 py-10 md:grid-cols-[1fr_2fr] md:gap-16 md:py-14">
      <p className="text-xs uppercase tracking-widest text-muted">{label}</p>
      <div className="text-xl leading-relaxed md:text-2xl">{children}</div>
    </div>
  )
}

export default function ProjectPage() {
  const { slug } = useParams()
  const project = visibleProjects().find((p) => p.slug === slug)
  if (!project) return <NotFound />

  const isGbp = project.group === 'Google Business Profile'
  const cta = isGbp
    ? {
        title: 'Want a profile like this?',
        text: 'Tell us about your business and where customers find you today. We reply with the next step after a first call.',
      }
    : {
        title: 'Want a website like this?',
        text: 'Tell us about your business and what the website should do. We reply with the next step after a first call.',
      }

  return (
    <main className="px-gutter pb-32 pt-40 md:pt-48">
      <title>{`${project.title} | Apex Studios`}</title>
      <meta name="description" content={project.summary} />

      <div className="mx-auto max-w-[1220px]">
        <p className="text-sm uppercase tracking-widest text-muted">{project.group}</p>
        <h1 className="mt-8 text-[clamp(3rem,7vw,6.5rem)] font-medium">{project.title}</h1>
        <p className="mt-10 max-w-3xl text-xl leading-relaxed text-muted md:text-2xl">
          {project.summary}
        </p>

        <div className="mt-20 aspect-[16/10] overflow-hidden rounded-2xl border border-paper/10 bg-surface">
          <img
            src={project.image}
            alt={`${project.title} website`}
            className="h-full w-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>

        <h2 className="mt-32 text-5xl md:text-7xl">The work</h2>
        <div className="mt-16">
          {project.solution && <Row label="Solution">{project.solution}</Row>}
          {project.results?.length > 0 && (
            <Row label="Results">
              {project.results.map((r) => (
                <div key={r.label} className="mb-4 last:mb-0">
                  <p className="text-sm uppercase tracking-widest text-muted">{r.label}</p>
                  <p className="mt-2">{r.value}</p>
                  {r.note && <p className="mt-1 text-sm text-muted">{r.note}</p>}
                </div>
              ))}
            </Row>
          )}
          {project.location && <Row label="Location">{project.location}</Row>}
          {project.year && <Row label="Year">{project.year}</Row>}
          {project.live && (
            <Row label={project.liveLabel || 'Live site'}>
              <a
                href={project.href}
                target="_blank"
                rel="noreferrer"
                className="inline-block rounded-full border border-paper/25 px-6 py-3 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
              >
                {project.live}
              </a>
            </Row>
          )}
          <div className="border-t border-paper/15" />
        </div>

        <div className="mt-32">
          <h2 className="text-5xl md:text-7xl">{cta.title}</h2>
          <p className="mt-6 max-w-xl text-xl leading-relaxed text-muted">
            {cta.text}
          </p>
          <Link
            to="/contact"
            className="mt-10 inline-block rounded-full border border-paper/25 px-8 py-4 text-lg font-medium transition-colors hover:border-amber hover:text-amber"
          >
            Start a project
          </Link>
        </div>
      </div>
    </main>
  )
}
