import { useContact } from '../lib/content'

const MESSAGE = "Hi Apex Studios, I'd like to talk about a website for my business."

// Floating "chat on WhatsApp" button. Shows only when a WhatsApp number is set.
// rounded-[50%] (not rounded-full) on purpose: Motion.jsx fades in every rounded-full link on each page change.
export default function WhatsAppButton() {
  const { whatsapp } = useContact()
  const digits = (whatsapp || '').replace(/\D/g, '')
  if (!digits) return null
  return (
    <a
      href={`https://wa.me/${digits}?text=${encodeURIComponent(MESSAGE)}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with Apex Studios on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-[50%] bg-[#25D366] text-white shadow-lg shadow-black/50 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bottom-8 md:right-8 md:h-16 md:w-16"
    >
      <svg viewBox="0 0 32 32" className="h-8 w-8 md:h-9 md:w-9" fill="currentColor" aria-hidden="true">
        <path d="M16.003 3C8.83 3 3.003 8.826 3.003 16c0 2.29.6 4.53 1.74 6.5L3 29l6.65-1.7a12.95 12.95 0 0 0 6.35 1.65h.003C23.176 28.95 29 23.124 29 15.95 29 12.5 27.66 9.26 25.22 6.82A12.9 12.9 0 0 0 16.003 3Zm0 23.7h-.002a10.7 10.7 0 0 1-5.46-1.5l-.39-.23-3.95 1.01 1.05-3.85-.25-.4A10.69 10.69 0 0 1 5.3 16c0-5.9 4.8-10.7 10.705-10.7 2.86 0 5.55 1.12 7.57 3.14a10.64 10.64 0 0 1 3.13 7.57c0 5.9-4.8 10.69-10.7 10.69Zm5.87-8c-.32-.16-1.9-.94-2.2-1.05-.3-.11-.51-.16-.73.16-.21.32-.83 1.05-1.02 1.26-.19.21-.37.24-.7.08-.32-.16-1.36-.5-2.59-1.6-.96-.85-1.6-1.9-1.79-2.22-.19-.32-.02-.5.14-.66.14-.14.32-.37.48-.56.16-.19.21-.32.32-.54.11-.21.05-.4-.03-.56-.08-.16-.73-1.76-1-2.4-.26-.63-.53-.54-.73-.55h-.62c-.21 0-.56.08-.85.4-.29.32-1.12 1.09-1.12 2.66 0 1.57 1.15 3.08 1.3 3.29.16.21 2.25 3.43 5.45 4.81.76.33 1.36.52 1.82.67.76.24 1.46.21 2.01.13.61-.09 1.9-.78 2.16-1.53.27-.75.27-1.39.19-1.53-.08-.13-.29-.21-.61-.37Z" />
      </svg>
    </a>
  )
}
