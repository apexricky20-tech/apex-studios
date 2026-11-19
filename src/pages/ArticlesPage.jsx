import { Link } from 'react-router-dom'
import ArticleCard from '../components/ArticleCard'
import Breadcrumbs from '../components/Breadcrumbs'
import { formatDate, readMinutes, visibleArticles } from '../data/articles'

export default function ArticlesPage() {
  const list = visibleArticles()
  const [featured, ...rest] = list
  return (
    <div className="px-gutter pb-24 pt-40">
      <title>Articles: Websites for Hotels, Lodges and Restaurants | Apex Studios</title>
      <meta name="description" content="Practical articles on websites, Google Business Profile, M-Pesa and WhatsApp for hotels, lodges and restaurants in Kenya." />
      <div className="mx-auto max-w-[1400px]">
        <Breadcrumbs items={[{ name: 'Articles' }]} />

        <header className="mx-auto mt-12 max-w-4xl text-center">
          <p className="text-sm font-medium uppercase tracking-widest text-amber">Journal</p>
          <h1 className="mt-6 text-5xl font-bold leading-[1.04] md:text-8xl">
            Straight talk on getting <span className="text-amber">booked</span>
          </h1>
          <p className="mx-auto mt-8 max-w-2xl text-lg text-muted md:text-xl">
            Practical notes for hotels, lodges and restaurants in Kenya on websites, Google, M-Pesa and WhatsApp, and the
            small decisions that turn visitors into guests and orders.
          </p>
        </header>

        {featured ? (
          <>
            <Link
              to={`/articles/${featured.slug}`}
              className="group mt-20 grid items-center gap-8 rounded-3xl border border-paper/10 bg-surface p-5 transition-colors hover:border-amber/60 md:grid-cols-2 md:gap-12 md:p-8"
            >
              <div className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-gradient-to-br from-neutral-800 to-neutral-950">
                <img
                  src={featured.image}
                  alt=""
                  className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
              <div>
                <p className="text-xs text-muted">
                  <span className="font-medium uppercase tracking-widest text-amber">Featured</span>
                  <span aria-hidden="true"> · </span>
                  <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                  <span aria-hidden="true"> · </span>
                  {readMinutes(featured)} min read
                </p>
                <h2 className="mt-4 text-3xl leading-tight transition-colors group-hover:text-amber md:text-5xl">
                  {featured.title}
                </h2>
                {featured.description && <p className="mt-5 text-lg text-muted">{featured.description}</p>}
                <span className="mt-6 inline-block text-sm font-medium">Read Article →</span>
              </div>
            </Link>

            {rest.length > 0 && (
              <div className="mt-6 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((a) => (
                  <ArticleCard key={a.slug} article={a} />
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="mt-16 text-center text-paper/70">Articles are coming soon.</p>
        )}

        <div className="mt-16 text-center">
          <Link
            to="/"
            className="inline-block rounded-full border border-paper/25 px-8 py-4 text-sm font-semibold transition-colors hover:border-amber hover:text-amber"
          >
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  )
}
