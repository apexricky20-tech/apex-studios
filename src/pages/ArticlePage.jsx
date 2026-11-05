import { Link, useParams } from 'react-router-dom'
import { formatDate, visibleArticles } from '../data/articles'
import NotFound from './NotFound'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = visibleArticles().find((a) => a.slug === slug)
  if (!article) return <NotFound />
  return (
    <article className="mx-auto max-w-3xl px-gutter pb-24 pt-40">
      <title>{`${article.title} | Apex Studios`}</title>
      <time dateTime={article.date} className="text-sm text-muted">
        {formatDate(article.date)}
      </time>
      <h1 className="mt-4 text-4xl font-bold md:text-6xl">{article.title}</h1>
      <div className="mt-10 space-y-6 text-lg text-paper/80">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <Link to="/articles" className="mt-12 inline-block font-semibold text-amber">
        ← All articles
      </Link>
    </article>
  )
}
