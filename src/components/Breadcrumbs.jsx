import { Fragment } from 'react'
import { Link } from 'react-router-dom'

// items: [{ name, to }, ..., { name }]  (the last one is the current page and has no link)
export default function Breadcrumbs({ items }) {
  const all = [{ name: 'Home', to: '/' }, ...items]
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-muted">
      <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
        {all.map((item, i) => {
          const last = i === all.length - 1
          return (
            <Fragment key={item.name}>
              <li>
                {last ? (
                  <span aria-current="page" className="text-paper/80">
                    {item.name}
                  </span>
                ) : (
                  <Link to={item.to} className="transition-colors hover:text-amber">
                    {item.name}
                  </Link>
                )}
              </li>
              {!last && (
                <li aria-hidden="true" className="text-paper/30">
                  /
                </li>
              )}
            </Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
