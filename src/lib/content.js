// Site content = defaults from src/data/*.js, overridden by whatever the dashboard saved.
import { useMemo, useSyncExternalStore } from 'react'
import { site as siteDefault } from '../data/site'
import { contact as contactDefault } from '../data/contact'
import { projects as projectsDefault } from '../data/projects'

const CONTACT_KEYS = ['email', 'whatsapp', 'instagram', 'tiktok']
let state = { site: siteDefault, contact: contactDefault, projects: projectsDefault }
const listeners = new Set()
const subscribe = (fn) => {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function applyContent(c = {}) {
  const contact = { ...contactDefault }
  CONTACT_KEYS.forEach((k) => {
    if (typeof c.contact?.[k] === 'string') contact[k] = c.contact[k]
  })
  state = {
    site: { ...siteDefault, ...(c.site || {}) },
    contact,
    projects: Array.isArray(c.projects) ? c.projects : projectsDefault,
  }
  listeners.forEach((fn) => fn())
}

export async function loadContent() {
  try {
    const res = await fetch('/api/content')
    if (res.ok) applyContent(await res.json())
  } catch {
    // No API (local dev) or offline: the built-in defaults stay.
  }
}

export const useSite = () => useSyncExternalStore(subscribe, () => state.site)
export const useContact = () => useSyncExternalStore(subscribe, () => state.contact)
export function useVisibleProjects() {
  const all = useSyncExternalStore(subscribe, () => state.projects)
  return useMemo(() => all.filter((p) => p.published || import.meta.env.DEV), [all])
}
