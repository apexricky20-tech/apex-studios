import { useEffect, useState } from 'react'
import { projects as seedProjects } from '../data/projects'
import { site as siteDefault } from '../data/site'
import { contact as contactDefault } from '../data/contact'

const SERVICES = [
  ['', 'None'],
  ['Website Design', '/website-design'],
  ['Development', '/development'],
  ['Automation', '/automation'],
  ['Branding', '/branding'],
  ['Google Business Profile', '/google-business-profile'],
]

async function api(path, opts = {}) {
  const headers = { ...(typeof opts.body === 'string' ? { 'Content-Type': 'application/json' } : {}), ...opts.headers }
  const res = await fetch(`/api/admin/${path}`, { credentials: 'same-origin', ...opts, headers })
  let data = null
  try {
    data = await res.json()
  } catch {
    // not JSON
  }
  if (!res.ok) {
    if (res.status === 401 && path !== 'login') window.dispatchEvent(new Event('admin-401'))
    throw new Error(data?.error || `Request failed (${res.status})`)
  }
  return data
}

const send = (path, method, body) => api(path, { method, body: JSON.stringify(body) })

async function uploadImage(file) {
  const bmp = await createImageBitmap(file)
  const scale = Math.min(1, 1600 / Math.max(bmp.width, bmp.height))
  const c = document.createElement('canvas')
  c.width = Math.round(bmp.width * scale)
  c.height = Math.round(bmp.height * scale)
  c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
  const blob = await new Promise((res) => c.toBlob(res, 'image/webp', 0.85))
  const out = await api('media', { method: 'POST', body: blob, headers: { 'Content-Type': 'image/webp' } })
  return out.url
}

// Kenyan numbers like 0712345678 or 712345678 become 254712345678 for WhatsApp links.
const waDigits = (p) => {
  const d = (p || '').replace(/\D/g, '')
  if (/^0\d{9}$/.test(d)) return `254${d.slice(1)}`
  if (/^[17]\d{8}$/.test(d)) return `254${d}`
  return d
}

const box = 'rounded-2xl border border-paper/15 p-5'
const inp = 'w-full rounded-lg border border-paper/20 bg-transparent px-3 py-2 text-sm outline-none focus:border-amber'
const btn = 'rounded-full border border-paper/25 px-4 py-2 text-sm transition-colors hover:border-amber hover:text-amber disabled:opacity-40'
const btnMain = 'rounded-full bg-paper px-5 py-2 text-sm font-semibold text-ink transition-colors hover:bg-amber disabled:opacity-40'

function Field({ label, value, onChange, area, hint, type = 'text' }) {
  const Tag = area ? 'textarea' : 'input'
  return (
    <label className="block text-xs text-muted">
      {label}
      <Tag
        type={area ? undefined : type}
        rows={area ? 4 : undefined}
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value)}
        className={`${inp} mt-1 text-paper`}
      />
      {hint && <span className="mt-1 block text-[11px] text-muted/70">{hint}</span>}
    </label>
  )
}

function Check({ label, checked, onChange }) {
  return (
    <label className="flex items-center gap-2 text-sm">
      <input type="checkbox" checked={!!checked} onChange={(e) => onChange(e.target.checked)} className="h-4 w-4 accent-amber" />
      {label}
    </label>
  )
}

function Login({ onDone }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async (e) => {
    e.preventDefault()
    setBusy(true)
    setErr('')
    try {
      await send('login', 'POST', { password: pw })
      onDone()
    } catch (x) {
      setErr(x.message)
      setBusy(false)
    }
  }
  return (
    <main className="grid min-h-svh place-items-center px-6">
      <form onSubmit={submit} className="w-full max-w-sm space-y-4">
        <h1 className="text-3xl">Dashboard</h1>
        <input
          type="password"
          autoFocus
          autoComplete="current-password"
          placeholder="Password"
          value={pw}
          onChange={(e) => setPw(e.target.value)}
          className={inp}
        />
        {err && <p className="text-sm text-amber">{err}</p>}
        <button disabled={busy || !pw} className={btnMain}>{busy ? 'Checking...' : 'Sign in'}</button>
      </form>
    </main>
  )
}

function Inbox({ onCount }) {
  const [list, setList] = useState(null)
  const [open, setOpen] = useState(null)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState('')
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let alive = true
    api('messages')
      .then((d) => {
        if (!alive) return
        setList(d)
        onCount(d.filter((m) => !m.read).length)
      })
      .catch((e) => alive && setErr(e.message))
    return () => {
      alive = false
    }
  }, [tick, onCount])

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 60000)
    return () => clearInterval(t)
  }, [])

  const show = async (id) => {
    if (open === id) return setOpen(null)
    setOpen(id)
    setMsg(null)
    try {
      const m = await api(`messages/${id}`)
      setMsg(m)
      if (!m.read) {
        await send(`messages/${id}`, 'PATCH', { read: true })
        setTick((n) => n + 1)
      }
    } catch (e) {
      setErr(e.message)
    }
  }
  const unread = async (id) => {
    await send(`messages/${id}`, 'PATCH', { read: false })
    setOpen(null)
    setTick((n) => n + 1)
  }
  const del = async (id) => {
    if (!window.confirm('Delete this message for good?')) return
    await api(`messages/${id}`, { method: 'DELETE' })
    setOpen(null)
    setTick((n) => n + 1)
  }

  if (err) return <p className="text-amber">{err}</p>
  if (!list) return <p className="text-muted">Loading...</p>
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm text-muted">{list.length} message{list.length === 1 ? '' : 's'} (newest first)</p>
        <button className={btn} onClick={() => setTick((n) => n + 1)}>Refresh</button>
      </div>
      {list.length === 0 && <p className={`${box} text-muted`}>No messages yet. New enquiries from the contact form appear here.</p>}
      <ul className="space-y-2">
        {list.map((m) => (
          <li key={m.id} className={box}>
            <button onClick={() => show(m.id)} className="flex w-full items-start gap-3 text-left">
              <span className={`mt-2 h-2 w-2 shrink-0 rounded-full ${m.read ? 'bg-transparent' : 'bg-amber'}`} />
              <span className="min-w-0 flex-1">
                <span className={`block ${m.read ? '' : 'font-semibold'}`}>
                  {m.name} <span className="font-normal text-muted">· {m.service || 'No service chosen'}</span>
                </span>
                <span className="block truncate text-sm text-muted">{m.preview}</span>
              </span>
              <span className="shrink-0 text-xs text-muted">{m.createdAt && new Date(m.createdAt).toLocaleString()}</span>
            </button>
            {open === m.id && (
              <div className="mt-4 border-t border-paper/15 pt-4">
                {!msg ? (
                  <p className="text-muted">Loading...</p>
                ) : (
                  <>
                    <p className="text-sm text-muted">
                      {msg.email}
                      {msg.phone && ` · ${msg.phone}`}
                      {msg.company && ` · ${msg.company}`}
                    </p>
                    {msg.source && <p className="mt-1 text-xs text-muted">Came from: {msg.source}</p>}
                    <p className="mt-3 whitespace-pre-wrap">{msg.message}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      <a className={btnMain} href={`mailto:${msg.email}?subject=${encodeURIComponent('Re: your enquiry to Apex Studios')}`}>Reply by email</a>
                      {msg.phone && <a className={btn} href={`https://wa.me/${waDigits(msg.phone)}`} target="_blank" rel="noreferrer">WhatsApp</a>}
                      <button className={btn} onClick={() => unread(m.id)}>Mark unread</button>
                      <button className={btn} onClick={() => del(m.id)}>Delete</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}

function SiteSettings({ content, reload }) {
  const [s, setS] = useState({ ...siteDefault, available: true, ...(content.site || {}) })
  const [c, setC] = useState({ ...contactDefault, ...(content.contact || {}) })
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)
  const setSite = (k) => (v) => setS((x) => ({ ...x, [k]: v }))
  const setContact = (k) => (v) => setC((x) => ({ ...x, [k]: v }))

  const photo = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setMsg('Uploading photo...')
    try {
      setSite('portrait')(await uploadImage(f))
      setMsg('Photo uploaded. Press Save to use it.')
    } catch (x) {
      setMsg(x.message)
    }
  }
  const save = async () => {
    setBusy(true)
    setMsg('')
    try {
      await send('content', 'PUT', {
        site: { name: s.name, role: s.role, location: s.location, availability: s.availability, available: s.available, portrait: s.portrait },
        contact: { email: c.email, whatsapp: c.whatsapp, instagram: c.instagram, tiktok: c.tiktok },
      })
      await reload()
      setMsg('Saved. Visitors see it within a minute.')
    } catch (x) {
      setMsg(x.message)
    }
    setBusy(false)
  }
  return (
    <div className="space-y-6">
      <section className={`${box} space-y-4`}>
        <h2 className="text-xl">Hero and identity</h2>
        <Field label="Name" value={s.name} onChange={setSite('name')} />
        <Field label="Role line" value={s.role} onChange={setSite('role')} />
        <Field label="Location" value={s.location} onChange={setSite('location')} />
        <Check label="Show the green availability status" checked={s.available} onChange={setSite('available')} />
        <Field label="Availability text" value={s.availability} onChange={setSite('availability')} />
        <div>
          <p className="text-xs text-muted">Portrait (hero and About page)</p>
          <div className="mt-2 flex items-center gap-4">
            {s.portrait && <img src={s.portrait} alt="" className="h-24 w-auto rounded-lg bg-black" />}
            <label className={`${btn} cursor-pointer`}>
              Replace photo
              <input type="file" accept="image/*" onChange={photo} className="hidden" />
            </label>
          </div>
        </div>
      </section>
      <section className={`${box} space-y-4`}>
        <h2 className="text-xl">Contact details</h2>
        <p className="text-xs text-muted">Anything left empty is hidden on the site.</p>
        <Field label="Email" value={c.email} onChange={setContact('email')} />
        <Field label="WhatsApp number" value={c.whatsapp} onChange={setContact('whatsapp')} hint="Digits only, with country code, e.g. 2547XXXXXXXX" />
        <Field label="Instagram link" value={c.instagram} onChange={setContact('instagram')} hint="Full link starting with https://" />
        <Field label="TikTok link" value={c.tiktok} onChange={setContact('tiktok')} hint="Full link starting with https://" />
      </section>
      <div className="flex items-center gap-4">
        <button className={btnMain} disabled={busy} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button>
        <span className="text-sm text-muted">{msg}</span>
      </div>
    </div>
  )
}

const newKey = () => crypto.randomUUID()

function ProjectEditor({ p, set }) {
  const [msg, setMsg] = useState('')
  const upd = (k) => (v) => set({ ...p, [k]: v })
  const setResult = (i, k, v) => set({ ...p, results: p.results.map((r, j) => (j === i ? { ...r, [k]: v } : r)) })
  const img = async (e) => {
    const f = e.target.files[0]
    if (!f) return
    setMsg('Uploading...')
    try {
      upd('image')(await uploadImage(f))
      setMsg('')
    } catch (x) {
      setMsg(x.message)
    }
  }
  return (
    <div className="mt-4 grid gap-4 border-t border-paper/15 pt-4 md:grid-cols-2">
      <Field label="Title" value={p.title} onChange={upd('title')} />
      <Field label="Slug (the page address)" value={p.slug} onChange={upd('slug')} hint="Letters, numbers and dashes. Changing it changes the page link." />
      <Field label="Category line" value={p.category} onChange={upd('category')} hint="e.g. Website · Delivery ordering" />
      <Field label="Group" value={p.group} onChange={upd('group')} hint="e.g. Websites, Concepts, Google Business Profile" />
      <label className="block text-xs text-muted">
        Service
        <select
          value={p.service?.label || ''}
          onChange={(e) => {
            const s = SERVICES.find(([l]) => l === e.target.value)
            set({ ...p, service: s && s[0] ? { label: s[0], to: s[1] } : undefined })
          }}
          className={`${inp} mt-1 text-paper [&>option]:bg-ink`}
        >
          {SERVICES.map(([l]) => (
            <option key={l} value={l}>{l || 'None'}</option>
          ))}
        </select>
      </label>
      <Field label="Year" value={p.year} onChange={upd('year')} />
      <Field label="Location" value={p.location} onChange={upd('location')} />
      <Field label="Live site link" value={p.href} onChange={upd('href')} hint="https://... or /work" />
      <Field label="Live site label" value={p.live} onChange={upd('live')} hint="e.g. bullheadhotels.co.ke" />
      <div>
        <p className="text-xs text-muted">Project image</p>
        <div className="mt-1 flex items-center gap-3">
          {p.image && <img src={p.image} alt="" className="h-16 w-auto rounded bg-black" />}
          <label className={`${btn} cursor-pointer`}>
            Upload image
            <input type="file" accept="image/*" onChange={img} className="hidden" />
          </label>
        </div>
        <input value={p.image || ''} onChange={(e) => upd('image')(e.target.value)} placeholder="or paste an image link" className={`${inp} mt-2`} />
        {msg && <p className="mt-1 text-xs text-amber">{msg}</p>}
      </div>
      <div className="md:col-span-2"><Field label="Summary" area value={p.summary} onChange={upd('summary')} /></div>
      <div className="md:col-span-2"><Field label="What we built (solution)" area value={p.solution} onChange={upd('solution')} /></div>
      <div className="space-y-3 md:col-span-2">
        <p className="text-xs text-muted">Results (only publish numbers you have measured, and say when)</p>
        {p.results.map((r, i) => (
          <div key={i} className="grid gap-2 rounded-lg border border-paper/10 p-3 md:grid-cols-3">
            <Field label="Label" value={r.label} onChange={(v) => setResult(i, 'label', v)} />
            <Field label="Value" value={r.value} onChange={(v) => setResult(i, 'value', v)} />
            <Field label="Note" value={r.note} onChange={(v) => setResult(i, 'note', v)} />
            <button className={`${btn} w-fit`} onClick={() => set({ ...p, results: p.results.filter((_, j) => j !== i) })}>Remove result</button>
          </div>
        ))}
        <button className={btn} onClick={() => set({ ...p, results: [...p.results, { label: '', value: '', note: '' }] })}>Add a result</button>
      </div>
    </div>
  )
}

function ProjectsEditor({ content, reload }) {
  const stored = Array.isArray(content.projects)
  const [list, setList] = useState(() =>
    (stored ? content.projects : seedProjects).map((p) => ({ ...structuredClone(p), results: p.results || [], _k: newKey() })),
  )
  const [open, setOpen] = useState(null)
  const [dirty, setDirty] = useState(!stored)
  const [msg, setMsg] = useState('')
  const [busy, setBusy] = useState(false)

  const change = (fn) => {
    setList(fn)
    setDirty(true)
  }
  const setOne = (k) => (np) => change((l) => l.map((p) => (p._k === k ? np : p)))
  const move = (i, d) =>
    change((l) => {
      const a = [...l]
      const j = i + d
      if (j < 0 || j >= a.length) return l
      ;[a[i], a[j]] = [a[j], a[i]]
      return a
    })
  const add = () => {
    const p = { _k: newKey(), slug: `new-project-${list.length + 1}`, title: 'New project', category: '', group: 'Websites', image: '', href: '', live: '', summary: '', solution: '', location: '', year: String(new Date().getFullYear()), results: [], published: false }
    change((l) => [...l, p])
    setOpen(p._k)
  }
  const del = (p) => {
    if (window.confirm(`Delete "${p.title}"? This cannot be undone after you save.`)) change((l) => l.filter((x) => x._k !== p._k))
  }
  const save = async () => {
    setBusy(true)
    setMsg('')
    try {
      await send('content', 'PUT', { projects: list })
      await reload()
      setDirty(false)
      setMsg('Saved. Visitors see it within a minute.')
    } catch (x) {
      setMsg(x.message)
    }
    setBusy(false)
  }

  return (
    <div className="space-y-4">
      {!stored && (
        <p className={`${box} text-sm text-muted`}>
          These are the projects currently built into your code. When you press Save, this dashboard takes over the project list.
        </p>
      )}
      <ul className="space-y-2">
        {list.map((p, i) => (
          <li key={p._k} className={box}>
            <div className="flex flex-wrap items-center gap-2">
              <button className="min-w-0 flex-1 text-left" onClick={() => setOpen(open === p._k ? null : p._k)}>
                <span className="block truncate font-medium">{p.title || 'Untitled'}</span>
                <span className="text-xs text-muted">{p.group} · /work/{p.slug}</span>
              </button>
              <Check label="Published" checked={p.published} onChange={(v) => setOne(p._k)({ ...p, published: v })} />
              <button className={btn} onClick={() => move(i, -1)} aria-label="Move up">↑</button>
              <button className={btn} onClick={() => move(i, 1)} aria-label="Move down">↓</button>
              <button className={btn} onClick={() => del(p)}>Delete</button>
            </div>
            {open === p._k && <ProjectEditor p={p} set={setOne(p._k)} />}
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap items-center gap-4">
        <button className={btn} onClick={add}>Add a project</button>
        <button className={btnMain} disabled={busy || !dirty} onClick={save}>{busy ? 'Saving...' : 'Save changes'}</button>
        <span className="text-sm text-muted">{msg || (dirty ? 'Unsaved changes' : '')}</span>
      </div>
    </div>
  )
}

function Tools() {
  const [alerts, setAlerts] = useState(null) // null = checking, true/false = configured
  const [alertMsg, setAlertMsg] = useState('')
  const [backupMsg, setBackupMsg] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    let alive = true
    api('alerts')
      .then((d) => alive && setAlerts(d.configured))
      .catch(() => alive && setAlerts(false))
    return () => {
      alive = false
    }
  }, [])

  const testAlert = async () => {
    setBusy('alert')
    setAlertMsg('')
    try {
      await send('alerts/test', 'POST', {})
      setAlertMsg('Sent. Check Telegram.')
    } catch (x) {
      setAlertMsg(x.message)
    }
    setBusy('')
  }

  const backup = async () => {
    setBusy('backup')
    setBackupMsg('')
    try {
      let cursor = ''
      let content = null
      const messages = []
      do {
        const d = await api(`export${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`)
        if (d.content) content = d.content
        messages.push(...d.messages)
        cursor = d.cursor || ''
      } while (cursor)
      const file = { exportedAt: new Date().toISOString(), content, messages }
      const blob = new Blob([JSON.stringify(file, null, 2)], { type: 'application/json' })
      const a = document.createElement('a')
      a.href = URL.createObjectURL(blob)
      a.download = `apex-studios-backup-${new Date().toISOString().slice(0, 10)}.json`
      a.click()
      URL.revokeObjectURL(a.href)
      setBackupMsg(`Downloaded ${messages.length} message${messages.length === 1 ? '' : 's'} and your site settings.`)
    } catch (x) {
      setBackupMsg(x.message)
    }
    setBusy('')
  }

  return (
    <div className="space-y-6">
      <section className={`${box} space-y-4`}>
        <h2 className="text-xl">New-enquiry alerts</h2>
        <p className="text-sm text-muted">
          {alerts === null && 'Checking...'}
          {alerts === true && 'Telegram alerts are on. Every new enquiry is sent to your Telegram.'}
          {alerts === false &&
            'Telegram alerts are off. Add TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID as secrets in Cloudflare Pages (Settings, Variables and secrets), then redeploy.'}
        </p>
        <div className="flex items-center gap-4">
          <button className={btn} disabled={!alerts || busy === 'alert'} onClick={testAlert}>
            {busy === 'alert' ? 'Sending...' : 'Send a test alert'}
          </button>
          <span className="text-sm text-muted">{alertMsg}</span>
        </div>
      </section>
      <section className={`${box} space-y-4`}>
        <h2 className="text-xl">Backup</h2>
        <p className="text-sm text-muted">
          Downloads your site settings, projects and every enquiry as one file. Images you uploaded here are not included, so
          keep the original files.
        </p>
        <div className="flex items-center gap-4">
          <button className={btn} disabled={busy === 'backup'} onClick={backup}>
            {busy === 'backup' ? 'Preparing...' : 'Download backup'}
          </button>
          <span className="text-sm text-muted">{backupMsg}</span>
        </div>
      </section>
    </div>
  )
}

function Dashboard({ onLogout }) {
  const [tab, setTab] = useState('inbox')
  const [content, setContent] = useState(null)
  const [unread, setUnread] = useState(0)
  const [err, setErr] = useState('')
  const reload = () => api('content').then(setContent)

  useEffect(() => {
    let alive = true
    api('content')
      .then((d) => alive && setContent(d))
      .catch((e) => alive && setErr(e.message))
    return () => {
      alive = false
    }
  }, [])

  const out = async () => {
    await send('logout', 'POST', {}).catch(() => {})
    onLogout()
  }
  const tabs = [
    ['inbox', `Inbox${unread ? ` (${unread})` : ''}`],
    ['site', 'Site and contact'],
    ['projects', 'Projects'],
    ['tools', 'Alerts and backup'],
  ]
  return (
    <main className="mx-auto max-w-4xl px-6 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl">Dashboard</h1>
        <div className="flex gap-2">
          <a className={btn} href="/" target="_blank" rel="noreferrer">View site</a>
          <button className={btn} onClick={out}>Sign out</button>
        </div>
      </header>
      <nav className="mb-8 flex flex-wrap gap-2">
        {tabs.map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`rounded-full px-4 py-2 text-sm ${tab === k ? 'bg-paper text-ink' : 'border border-paper/25'}`}>
            {label}
          </button>
        ))}
      </nav>
      {err && <p className="text-amber">{err}</p>}
      {tab === 'inbox' && <Inbox onCount={setUnread} />}
      {tab !== 'inbox' && tab !== 'tools' && !content && !err && <p className="text-muted">Loading...</p>}
      {tab === 'site' && content && <SiteSettings content={content} reload={reload} />}
      {tab === 'projects' && content && <ProjectsEditor content={content} reload={reload} />}
      {tab === 'tools' && <Tools />}
    </main>
  )
}

export default function Admin() {
  const [authed, setAuthed] = useState(null)
  useEffect(() => {
    let alive = true
    api('me')
      .then(() => alive && setAuthed(true))
      .catch(() => alive && setAuthed(false))
    const kick = () => setAuthed(false)
    window.addEventListener('admin-401', kick)
    return () => {
      alive = false
      window.removeEventListener('admin-401', kick)
    }
  }, [])
  return (
    <div className="min-h-svh bg-ink text-paper">
      <title>Dashboard</title>
      <meta name="robots" content="noindex,nofollow" />
      {authed === null ? null : authed ? <Dashboard onLogout={() => setAuthed(false)} /> : <Login onDone={() => setAuthed(true)} />}
    </div>
  )
}
