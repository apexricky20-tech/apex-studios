import ArticleCard from '../components/ArticleCard'
import { visibleArticles } from '../data/articles'

export default function ArticlesPage() {
  const list = visibleArticles()
  return (
    <div className="px-gutter pb-24 pt-40">
      <title>Articles | Apex Studios</title>
      <h1 className="text-5xl font-bold md:text-8xl">Articles</h1>
      {list.length ? (
        <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {list.map((a) => (
            <ArticleCard key={a.slug} article={a} />
          ))}
        </div>
      ) : (
        <p className="mt-6 text-paper/70">Articles are coming soon.</p>
      )}
    </div>
  )
}
