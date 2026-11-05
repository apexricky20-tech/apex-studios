import { useEffect, useLayoutEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import Lenis from 'lenis'

const SELECTOR = 'h2, h3, p, li, a[class*="rounded-full"]'
const SKIP = 'header, footer, #site-menu, .animate-marquee, .sr-only, [data-hero]'
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Motion() {
  const { pathname } = useLocation()
  const lenisRef = useRef(null)

  // Smooth scroll
  useEffect(() => {
    if (reduced()) return
    const lenis = new Lenis({ lerp: 0.1, anchors: true })
    lenisRef.current = lenis
    let id = requestAnimationFrame(function raf(t) {
      lenis.raf(t)
      id = requestAnimationFrame(raf)
    })
    const mo = new MutationObserver(() => {
      if (document.body.style.overflow === 'hidden') lenis.stop()
      else lenis.start()
    })
    mo.observe(document.body, { attributes: true, attributeFilter: ['style'] })
    return () => {
      mo.disconnect()
      cancelAnimationFrame(id)
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  // Header turns solid once you scroll
  useEffect(() => {
    const root = document.documentElement
    const onScroll = () => root.toggleAttribute('data-scrolled', window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Reset scroll on route change
  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
  }, [pathname])

  // Reveal on scroll
  useLayoutEffect(() => {
    if (reduced()) return
    let els = [...document.querySelectorAll(SELECTOR)].filter((el) => !el.closest(SKIP))
    els = els.filter((el) => !els.some((o) => o !== el && o.contains(el)))
    els.forEach((el) => el.classList.add('reveal'))

    const io = new IntersectionObserver(
      (entries) => {
        let i = 0
        entries.forEach((e) => {
          if (!e.isIntersecting) return
          e.target.style.animationDelay = `${Math.min(i++, 6) * 70}ms`
          e.target.classList.add('reveal-in')
          io.unobserve(e.target)
        })
      },
      { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
    )
    els.forEach((el) => io.observe(el))

    return () => {
      io.disconnect()
      els.forEach((el) => {
        el.classList.remove('reveal', 'reveal-in')
        el.style.animationDelay = ''
      })
    }
  }, [pathname])

  return null
}