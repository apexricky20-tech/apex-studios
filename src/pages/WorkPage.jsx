import { useState } from 'react'
import { Link } from 'react-router-dom'
import { visibleProjects } from '../data/projects'

function Card({ project }) {
  return (
    <Link
      to={`/work/${project.slug}`}
      className="group block"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl border border-paper/10 bg-surface">
        <img
          src={project.image}
          alt={`${project.title} website`}
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <h3 className="mt-6 text-3xl transition-colors group-hover:text-amber md:text-4xl">
        {project.title}
      </h3>
      <p className="mt-2 text-sm text-muted">{project.category}</p>
    </Link>
  )
}

export default function WorkPage() {
  const all = visibleProjects()
  const groups = [...new Set(all.map((p) => p.group))]
  const [filter, setFilter] = useState('All')
  const shown = filter === 'All' ? all : all.filter((p) => p.group === filter)
  const tabs = ['All', ...groups]
  const count = (t) => (t === 'All' ? all.length : all.filter((p) => p.group === t).length)

  return (
    <main className="px-gutter pb-32 pt-40 md:pt-48">
      <title>Our Work | Apex Studios</title>
      <meta
        name="description"
        content="Selected website projects by Apex Studios, a web design and development studio in Nairobi, Kenya."
      />
      <div className="mx-auto max-w-[1240px]">
        <div className="text-center">
          <p className="text-sm uppercase tracking-widest text-amber">Portfolio</p>
          <h1 className="mt-8 text-[clamp(3rem,9vw,8rem)] font-bold">Our Work</h1>
          <p className="mx-auto mt-8 max-w-xl text-xl text-muted md:text-2xl">
            Selected websites for businesses in Kenya, each built to be found, trusted and used.
          </p>
        </div>

        {groups.length > 1 && (
          <div className="mt-16 flex flex-wrap justify-center gap-3">
            {tabs.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setFilter(t)}
                className={`rounded-full border px-5 py-3 text-sm transition-colors ${
                  filter === t
                    ? 'border-paper bg-paper text-ink'
                    : 'border-paper/25 text-paper hover:border-amber hover:text-amber'
                }`}
              >
                {t} <sup className="ml-1 text-[10px] opacity-70">{count(t)}</sup>
              </button>
            ))}
          </div>
        )}

        <div className="mt-20 grid gap-x-10 gap-y-20 md:grid-cols-2">
          {shown.map((p) => (
            <Card key={p.slug} project={p} />
          ))}
        </div>
      </div>
    </main>
  )
}
