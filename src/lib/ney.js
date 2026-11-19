// Lets any part of the page open Ney with a question already typed in (see Faq.jsx).
// Nothing is sent: the visitor reads it and presses send. The chat code is fetched on demand, so the
// question waits on window until the chat has loaded and picks it up (see ChatLauncher.jsx).
const KEY = '__apexAsk'

export function askNey(text) {
  window[KEY] = String(text || '')
  window.dispatchEvent(new Event('apex:ask'))
}

export function takeAsk() {
  const q = window[KEY]
  window[KEY] = undefined
  return typeof q === 'string' && q ? q : null
}
