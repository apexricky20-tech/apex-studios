import { useCallback, useEffect, useRef, useState } from 'react'

const reduced = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Drives a short, self-explaining demo: plays once when it is half on screen, then rests on the
// last step. The visitor can jump to any step or replay. With reduced motion it simply rests on the
// finished state and never plays by itself.
export default function useSteps(count, ms = 2300) {
  const root = useRef(null)
  const [calm] = useState(reduced)
  const [step, setStep] = useState(calm ? count - 1 : 0)
  const [auto, setAuto] = useState(false)
  const armed = useRef(!calm)

  useEffect(() => {
    const el = root.current
    if (!el || calm) return undefined
    const io = new IntersectionObserver(
      ([e]) => {
        if (!e.isIntersecting || !armed.current) return
        armed.current = false // play on the first look only
        setAuto(true)
        io.disconnect()
      },
      { threshold: 0.5 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [calm])

  useEffect(() => {
    if (!auto) return undefined
    const t = setTimeout(() => (step < count - 1 ? setStep(step + 1) : setAuto(false)), ms)
    return () => clearTimeout(t)
  }, [auto, step, count, ms])

  const jump = useCallback((i) => {
    armed.current = false
    setAuto(false)
    setStep(i)
  }, [])
  const replay = useCallback(() => {
    armed.current = false
    setStep(0)
    setAuto(!calm)
    if (calm) setStep(0)
  }, [calm])

  return { root, step, jump, replay, playing: auto, calm }
}
