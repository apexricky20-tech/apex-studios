const links = [
  ['Work', '#work'],
  ['Services', '#services'],
  ['Process', '#process'],
  ['Contact', '#contact'],
]

export default function Nav() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 flex items-center justify-between bg-ink/70 px-6 py-5 backdrop-blur md:px-12">
      <a href="#top" className="font-display text-xl font-extrabold tracking-tight">
        APEX<span className="text-amber">.</span>STUDIOS
      </a>
      <nav className="hidden gap-8 text-sm md:flex">
        {links.map(([label, href]) => (
          <a key={href} href={href} className="transition-colors hover:text-amber">
            {label}
          </a>
        ))}
      </nav>
      <a href="#contact" className="rounded-full bg-amber px-5 py-2 text-sm font-semibold text-ink">
        Start a project
      </a>
    </header>
  )
}
