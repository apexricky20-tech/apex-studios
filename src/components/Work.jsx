import { Link } from 'react-router-dom'
import { useVisibleProjects } from '../lib/content'

function Card({ project, index }) {
  const external = false
  const cls = `group relative block aspect-[4/3] w-full overflow-hidden rounded-2xl border border-paper/10 bg-gradient-to-br from-neutral-800 to-neutral-950 md:w-[46%] ${
    index % 2 ? 'md:ml-auto' : ''
  }`
  const inner = (
    <>
      <img
        src={project.image}
        alt={`${project.title} website`}
        loading="lazy"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        onError={(e) => {
          e.currentTarget.style.display = 'none'
        }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <h3 className="text-3xl transition-colors group-hover:text-amber md:text-4xl">
          {project.title}
        </h3>
        <p className="mt-2 text-sm text-paper/70">{project.category}</p>
      </div>
    </>
  )
  return external ? (
    <a href={project.href} target="_blank" rel="noreferrer" className={cls}>
      {inner}
    </a>
  ) : (
    <Link to={`/work/${project.slug}`} className={cls}>
      {inner}
    </Link>
  )
}

export default function Work() {
  const projects = useVisibleProjects()
  return (
    <section id="work" className="relative">
      <div className="sticky top-0 flex h-svh items-center justify-center overflow-hidden px-gutter">
        <h2 className="whitespace-nowrap text-[15vw] font-bold leading-none tracking-[-0.05em]">
          <span className="sr-only">Latest work</span>
          <span aria-hidden="true">
            Latest<span className="text-outline">work</span>
          </span>
        </h2>
      </div>
      <div className="relative z-10 flex flex-col gap-[18svh] px-gutter pb-[30svh] pt-[30svh]">
        {projects.map((p, i) => (
          <Card key={p.slug} project={p} index={i} />
        ))}
        <div className="text-center">
          <Link
            to="/work"
            className="inline-block rounded-full border border-paper/25 px-8 py-4 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
          >
            View all work
          </Link>
        </div>
      </div>
    </section>
  )
}
