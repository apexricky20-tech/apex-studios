import { Link } from 'react-router-dom'
import ArticleCard from './ArticleCard'
import { visibleArticles } from '../data/articles'

export default function ArticlesSection() {
  const list = visibleArticles().slice(0, 3)
  if (!list.length) return null
  return (
    <section className="px-gutter py-24 md:py-32">
      <h2 className="text-center text-5xl font-bold md:text-8xl">Latest Articles</h2>
      <div className="mx-auto mt-16 grid max-w-[1400px] gap-6 md:grid-cols-2 lg:grid-cols-3">
        {list.map((a) => (
          <ArticleCard key={a.slug} article={a} />
        ))}
      </div>
      <div className="mt-14 text-center">
        <Link
          to="/articles"
          className="inline-block rounded-full border border-paper/25 px-8 py-4 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
        >
          All articles →
        </Link>
      </div>
    </section>
  )
}
