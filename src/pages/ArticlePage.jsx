import { Link, useParams } from 'react-router-dom'
import Breadcrumbs from '../components/Breadcrumbs'
import { formatDate, visibleArticles } from '../data/articles'
import NotFound from './NotFound'

export default function ArticlePage() {
  const { slug } = useParams()
  const article = visibleArticles().find((a) => a.slug === slug)
  if (!article) return <NotFound />
  return (
    <article className="mx-auto max-w-3xl px-gutter pb-24 pt-40">
      <title>{`${article.title} | Apex Studios`}</title>
      <Breadcrumbs
        items={[
          { name: 'Articles', to: '/articles' },
          { name: article.title.length > 46 ? `${article.title.slice(0, 44).trim()}…` : article.title },
        ]}
      />
      <p className="mt-8 text-sm text-muted">
        <time dateTime={article.date}>{formatDate(article.date)}</time>
        {article.updated && article.updated !== article.date && (
          <>
            {' '}
            · Updated <time dateTime={article.updated}>{formatDate(article.updated)}</time>
          </>
        )}
      </p>
      <h1 className="mt-4 text-4xl font-bold md:text-6xl">{article.title}</h1>
      <div className="mt-10 space-y-6 text-lg text-paper/80">
        {article.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>
      <aside className="mt-14 rounded-2xl border border-paper/10 p-6 md:p-8">
        <p className="text-xl font-semibold">Want this for your property?</p>
        <p className="mt-2 text-paper/70">
          See how we build <Link to="/website-design" className="text-amber hover:underline">websites for hotels, lodges and restaurants</Link>,
          or <Link to="/contact" className="text-amber hover:underline">tell us about your project</Link>.
        </p>
      </aside>
      <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-3 font-semibold">
        <Link to="/articles" className="text-amber hover:underline">
          ← All articles
        </Link>
        <Link to="/" className="text-paper/80 hover:text-amber">
          Back to home
        </Link>
      </div>
    </article>
  )
}
