import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-4xl px-6 pb-24 pt-40 md:px-12">
      <title>Page not found | Apex Studios</title>
      <h1 className="text-5xl md:text-7xl">Page not found.</h1>
      <Link to="/" className="mt-8 inline-block font-semibold text-amber">
        Back to the homepage →
      </Link>
    </div>
  )
}
