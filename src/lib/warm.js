// Fetches the case-study page's code the moment a visitor shows interest in a project card
// (hover, keyboard focus or the start of a tap). By the time the click lands the page is ready,
// so the card-to-case-study transition never has to wait on a download.
let started = false
const warm = () => {
  if (started) return
  started = true
  import('../pages/ProjectPage')
}
export const warmProject = { onPointerEnter: warm, onFocus: warm, onTouchStart: warm }
