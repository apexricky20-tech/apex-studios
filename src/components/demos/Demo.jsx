import { Link } from 'react-router-dom'
import useSteps from './useSteps'

// Two short, self-playing demos that show what a service does instead of describing it.
// Pure HTML and CSS (no canvas, no images, no libraries). The phone art is decoration (aria-hidden);
// the numbered steps beside it are real text, so the explanation survives without the animation.

const on = (active) => (active ? 'opacity-100 translate-y-0' : 'pointer-events-none opacity-0 translate-y-3')
const fade = 'transition duration-500 ease-out motion-reduce:transition-none'

function Phone({ children, label }) {
  return (
    <div
      aria-hidden="true"
      className="relative mx-auto h-[520px] w-[262px] shrink-0 overflow-hidden rounded-[2.4rem] border border-paper/20 bg-[#0b0b0b] p-2 shadow-[0_30px_80px_-30px_rgba(255,130,0,0.35)]"
    >
      <div className="relative h-full w-full overflow-hidden rounded-[1.9rem] bg-black">
        <div className="absolute left-1/2 top-2 z-30 h-4 w-16 -translate-x-1/2 rounded-full bg-[#0b0b0b]" />
        <p className="absolute inset-x-0 top-8 z-20 text-center text-[10px] uppercase tracking-widest text-paper/40">{label}</p>
        {children}
      </div>
    </div>
  )
}

// ---------- M-Pesa: the guest never types a Paybill number or an account reference ----------
const PAY_STEPS = [
  ['Guest enters their number', 'On your own booking page, in your own branding. No Paybill or account number to type.'],
  ['A prompt appears on their phone', 'M-Pesa asks them to approve the exact amount, straight away.'],
  ['They enter their PIN', 'The PIN goes to M-Pesa only. It never touches your website.'],
  ['The booking marks itself paid', 'You are notified, and nobody has to match M-Pesa messages against bookings.'],
]

function PayScreen({ step }) {
  const pin = step >= 2 ? 4 : 0
  return (
    <>
      {/* 1. the booking page */}
      <div className={`absolute inset-x-4 top-16 ${fade} ${step >= 3 ? 'opacity-0' : 'opacity-100'}`}>
        <p className="text-[10px] uppercase tracking-widest text-amber">Your Lodge</p>
        <p className="mt-2 font-display text-xl leading-tight">Deposit to hold your room</p>
        <div className="mt-4 flex justify-between rounded-xl border border-paper/15 p-3 text-xs">
          <span className="text-paper/60">Deposit</span>
          <span className="font-semibold">KES 5,000</span>
        </div>
        <div className="mt-3 rounded-xl border border-paper/15 p-3 text-xs text-paper/60">
          M-Pesa number
          <p className="mt-1 text-sm text-paper">0712 345 678<span className={`ml-0.5 inline-block h-3.5 w-px translate-y-0.5 bg-amber ${step === 0 ? 'motion-safe:animate-pulse' : 'opacity-0'}`} /></p>
        </div>
        <div className="mt-3 rounded-full bg-[#12b76a] py-3 text-center text-xs font-bold text-black">Pay with M-Pesa</div>
      </div>

      {/* 2 + 3. the prompt on the guest's phone */}
      <div className={`absolute inset-x-3 bottom-4 z-10 rounded-2xl border border-paper/15 bg-[#1a1a1a] p-4 shadow-2xl ${fade} ${on(step === 1 || step === 2)}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-[#12b76a]">M-PESA</p>
        <p className="mt-2 text-xs leading-snug">Pay <b>KES 5,000</b> to <b>Your Lodge</b>?</p>
        <p className="mt-3 text-[10px] text-paper/50">Enter your M-PESA PIN</p>
        <div className="mt-2 flex gap-2">
          {[0, 1, 2, 3].map((i) => (
            <span key={i} className={`flex h-9 flex-1 items-center justify-center rounded-lg border text-lg ${i < pin ? 'border-amber text-paper' : 'border-paper/20 text-transparent'} ${fade}`} style={{ transitionDelay: pin ? `${i * 160}ms` : '0ms' }}>
              &bull;
            </span>
          ))}
        </div>
      </div>

      {/* 4. paid */}
      <div className={`absolute inset-x-4 top-20 z-10 text-center ${fade} ${on(step >= 3)}`}>
        <svg viewBox="0 0 52 52" className="mx-auto h-16 w-16" fill="none" stroke="#12b76a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="26" cy="26" r="23" className="opacity-40" />
          <path d="M15 27l8 8 14-16" strokeDasharray="40" strokeDashoffset={step >= 3 ? 0 : 40} style={{ transition: 'stroke-dashoffset 0.6s ease-out 0.25s' }} />
        </svg>
        <p className="mt-4 font-display text-xl">Deposit received</p>
        <p className="mt-1 text-xs text-paper/60">Your room is held.</p>
        <div className="mt-6 rounded-xl border border-paper/15 p-3 text-left text-xs">
          <p className="text-[10px] uppercase tracking-widest text-paper/40">What you see</p>
          <p className="mt-2 flex justify-between"><span>Booking #1042</span><span className="font-semibold text-[#12b76a]">Paid</span></p>
        </div>
      </div>
    </>
  )
}

// ---------- WhatsApp: a question at 11 pm, answered, captured, handed over ----------
const CHAT_STEPS = [
  ['A guest asks a question', 'At any hour, on the app they already use.'],
  ['They get an instant reply with options', 'Prices, availability and simple buttons, written by you in advance.'],
  ['Details are collected step by step', 'Name, dates and room type, without anyone typing the same questions again.'],
  ['The request lands with your team', 'It appears in your dashboard and the right person is alerted.'],
]

function Bubble({ show, mine, children }) {
  return (
    <div className={`flex ${mine ? 'justify-end' : 'justify-start'} ${fade} ${on(show)} ${show ? '' : 'absolute'}`}>
      <p className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-snug ${mine ? 'rounded-br-sm bg-[#12b76a] text-black' : 'rounded-bl-sm bg-[#1f1f1f] text-paper'}`}>{children}</p>
    </div>
  )
}

function ChatScreen({ step }) {
  return (
    <div className="absolute inset-x-0 bottom-0 top-16 flex flex-col gap-2 overflow-hidden px-3 pb-3">
      <div className="mb-1 flex items-center gap-2 border-b border-paper/10 pb-2">
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-amber text-[10px] font-bold text-black">YL</span>
        <p className="text-xs font-medium">Your Lodge<span className="block text-[10px] font-normal text-[#12b76a]">online</span></p>
      </div>
      <Bubble show={step >= 0} mine>Hi, do you have a room this Friday?</Bubble>
      <Bubble show={step >= 1}>Yes, we do. Bed and breakfast from KES 6,500 a night. Would you like to book?</Bubble>
      <div className={`flex flex-wrap gap-2 ${fade} ${on(step >= 1)} ${step >= 1 ? '' : 'absolute'}`}>
        {['Book a room', 'See the menu'].map((c, i) => (
          <span key={c} className={`rounded-full border px-3 py-1.5 text-[11px] ${i === 0 && step >= 2 ? 'border-[#12b76a] text-[#12b76a]' : 'border-paper/25 text-paper/80'}`}>{c}</span>
        ))}
      </div>
      <Bubble show={step >= 2} mine>Book a room</Bubble>
      <Bubble show={step >= 2}>Lovely. What name is the booking under, and which nights?</Bubble>
      <div className={`mt-auto rounded-xl border border-amber/60 bg-amber/10 p-3 text-xs ${fade} ${on(step >= 3)}`}>
        <p className="text-[10px] font-bold uppercase tracking-widest text-amber">New booking request</p>
        <p className="mt-1.5">Fri to Sun · 2 guests · B&amp;B</p>
        <p className="mt-1 text-paper/60">Front desk alerted</p>
      </div>
    </div>
  )
}

const KINDS = {
  mpesa: {
    label: 'M-Pesa checkout',
    title: 'How a guest pays',
    steps: PAY_STEPS,
    Screen: PayScreen,
    cta: 'Want this on your booking page?',
    group: 'How a guest pays with M-Pesa, step by step',
  },
  whatsapp: {
    label: 'WhatsApp chat',
    title: 'What happens at 11 pm',
    steps: CHAT_STEPS,
    Screen: ChatScreen,
    cta: 'Want this on your WhatsApp?',
    group: 'How a WhatsApp enquiry is handled, step by step',
  },
}

export default function Demo({ kind }) {
  const k = KINDS[kind]
  const { root, step, jump, replay, playing, calm } = useSteps(k?.steps.length ?? 4)
  if (!k) return null
  const { Screen } = k
  return (
    <section
      ref={root}
      role="group"
      aria-label={k.group}
      className="mt-20 grid items-center gap-10 rounded-3xl border border-paper/10 bg-surface p-6 md:grid-cols-[auto_1fr] md:gap-16 md:p-12"
    >
      <Phone label={k.label}>
        <Screen step={step} />
      </Phone>
      <div>
        <p className="text-sm uppercase tracking-widest text-amber">{k.title}</p>
        <ol className="mt-6 space-y-2">
          {k.steps.map(([h, p], i) => (
            <li key={h}>
              <button
                type="button"
                onClick={() => jump(i)}
                aria-current={step === i ? 'step' : undefined}
                className={`group flex w-full gap-4 rounded-2xl border p-4 text-left transition-colors motion-reduce:transition-none ${
                  step === i ? 'border-amber/70 bg-paper/5' : 'border-transparent hover:border-paper/15'
                }`}
              >
                <span className={`font-display text-2xl font-extrabold ${step >= i ? 'text-amber' : 'text-paper/25'} transition-colors`}>{String(i + 1).padStart(2, '0')}</span>
                <span>
                  <span className="block text-lg font-medium">{h}</span>
                  <span className={`mt-1 block text-sm ${step === i ? 'text-paper/80' : 'text-muted'}`}>{p}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
        <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3 text-sm">
          {!calm && (
            <button type="button" onClick={replay} disabled={playing} className="font-semibold transition-colors hover:text-amber disabled:opacity-40">
              &#8635; Replay
            </button>
          )}
          <Link to="/contact?offer=free-check" className="border-b border-paper pb-0.5 font-semibold transition-colors hover:border-amber hover:text-amber">
            {k.cta} Get my 3 free fixes &rsaquo;
          </Link>
        </div>
        <p className="mt-5 text-xs text-muted">An illustration of the flow. Amounts, names and numbers are examples, and the real thing carries your own branding.</p>
      </div>
    </section>
  )
}
