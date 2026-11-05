import { Link } from 'react-router-dom'
import { formatDate } from '../data/articles'

export default function ArticleCard({ article }) {
  return (
    <Link
      to={`/articles/${article.slug}`}
      className="group flex flex-col rounded-2xl border border-paper/10 bg-surface p-5 transition-colors hover:border-amber/60"
    >
      <div className="relative aspect-[16/10] overflow-hidden rounded-xl bg-gradient-to-br from-neutral-800 to-neutral-950">
        <img
          src={article.image}
          alt=""
          loading="lazy"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>
      <time dateTime={article.date} className="mt-5 text-xs text-muted">
        {formatDate(article.date)}
      </time>
      <h3 className="mt-2 text-2xl leading-tight transition-colors group-hover:text-amber md:text-3xl">
        {article.title}
      </h3>
      <span className="mt-4 text-sm font-medium">Read Article →</span>
    </Link>
  )
}
