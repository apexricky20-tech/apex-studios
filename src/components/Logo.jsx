import { useEffect, useRef } from 'react'

// With `alive`, the logo keeps signing itself: every ten seconds or so the strokes are wiped away and
// written out again, letter by letter, the way a founder signs his name. It says there is a person
// behind the studio. Each rewrite is about 2.5 seconds of motion, then nothing runs until the next one.
// Off for reduced motion, and paused while the tab is hidden.
const FIRST = 6000
const EVERY = 10000
const DRAW = [{ strokeDasharray: '1 2', strokeDashoffset: 0 }, { strokeDasharray: '1 2', strokeDashoffset: 1, offset: 0.18, easing: 'cubic-bezier(0.55, 0.1, 0.25, 1)' }, { strokeDasharray: '1 2', strokeDashoffset: 0 }]

export default function Logo({ className = "w-auto h-10 text-white", alive = false, ...props }) {
  const ref = useRef(null)
  useEffect(() => {
    if (!alive || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return undefined
    const paths = [...ref.current.querySelectorAll('path')]
    const run = () => {
      if (document.hidden) return
      paths.forEach((p, i) => p.animate(DRAW, { duration: 2600, delay: i * 55, easing: 'linear' }))
    }
    let loop = 0
    const first = setTimeout(() => {
      run()
      loop = setInterval(run, EVERY)
    }, FIRST)
    return () => {
      clearTimeout(first)
      clearInterval(loop)
      paths.forEach((p) => p.getAnimations().forEach((a) => a.cancel()))
    }
  }, [alive])
  return (
    <svg
      ref={ref}
      viewBox="0 0 520 120"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      {...props}
    >
      {/* apex */}
      {/* a */}
      <path pathLength={alive ? 1 : undefined} d="M 40,75 C 25,75 15,60 25,48 C 35,36 52,48 50,75 M 50,48 L 50,75 C 50,83 60,83 75,70" />
      {/* p */}
      <path pathLength={alive ? 1 : undefined} d="M 75,70 C 85,58 92,48 98,42 L 82,105 M 88,68 C 100,50 120,55 115,75 C 110,90 92,85 88,70 C 88,65 100,60 120,60" />
      {/* e */}
      <path pathLength={alive ? 1 : undefined} d="M 120,60 C 135,60 142,48 132,45 C 120,42 118,72 135,72 C 145,72 155,65 165,55" />
      {/* x */}
      <path pathLength={alive ? 1 : undefined} d="M 165,55 C 175,45 190,45 195,75 M 190,48 C 175,60 165,72 160,75" />
      
      {/* Connection loop */}
      <path pathLength={alive ? 1 : undefined} d="M 195,75 C 205,80 220,78 230,68" />
      
      {/* studios */}
      {/* s */}
      <path pathLength={alive ? 1 : undefined} d="M 230,68 C 240,50 250,45 242,42 C 232,40 225,58 245,65 C 255,70 255,80 240,76 C 230,73 245,70 260,65" />
      {/* t */}
      <path pathLength={alive ? 1 : undefined} d="M 265,30 L 260,75 C 260,82 270,80 280,68 M 250,50 L 275,48" />
      {/* u */}
      <path pathLength={alive ? 1 : undefined} d="M 280,68 C 285,52 295,48 295,68 C 295,78 310,78 315,50 L 315,75 C 315,82 322,80 330,65" />
      {/* d */}
      <path pathLength={alive ? 1 : undefined} d="M 345,55 C 332,55 328,68 335,75 C 345,80 355,70 355,30 L 355,75 C 355,82 362,80 370,65" />
      {/* i */}
      <path pathLength={alive ? 1 : undefined} d="M 370,65 C 375,52 382,48 382,75 C 382,82 390,80 398,65 M 383,36 A 1.5,1.5 0 1,1 383,33" />
      {/* o */}
      <path pathLength={alive ? 1 : undefined} d="M 398,65 C 392,52 410,45 418,58 C 424,68 410,78 398,68 C 402,60 415,55 425,58" />
      {/* s */}
      <path pathLength={alive ? 1 : undefined} d="M 425,58 C 435,45 448,45 440,42 C 430,40 422,58 442,65 C 455,70 452,80 438,76 C 428,73 445,70 480,68" />
    </svg>
  );
}
