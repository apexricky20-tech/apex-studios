const words = [
  'Latest work',
  'Website Design',
  'Development',
  'Automation',
  'Branding',
  'Selected Work',
  'Hotels',
  'Lodges',
  'Restaurants',
]

function Star() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 shrink-0 text-amber md:h-6 md:w-6" fill="currentColor">
      <path d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z" />
    </svg>
  )
}

function Group() {
  return (
    <ul className="flex shrink-0 items-center gap-8 pr-8 md:gap-12 md:pr-12">
      {words.map((word) => (
        <li key={word} className="flex items-center gap-8 whitespace-nowrap md:gap-12">
          <span>{word}</span>
          <Star />
        </li>
      ))}
    </ul>
  )
}

export default function Marquee() {
  return (
    <div aria-hidden="true" className="overflow-hidden border-y border-paper/15 py-8 md:py-10">
      <div className="flex w-max animate-marquee text-3xl font-medium tracking-tight hover:[animation-play-state:paused] motion-reduce:animate-none md:text-4xl lg:text-5xl">
        <Group />
        <Group />
      </div>
    </div>
  )
}
