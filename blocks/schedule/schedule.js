import { getConfig, localizeUrl } from '../../scripts/ak.js';
import ENV from '../../scripts/utils/env.js';
import { loadFragment } from '../fragment/fragment.js';

const config = getConfig();

const SESSION_START_KEY = 'aem-schedule-start';
const SESSION_PERSONA_KEY = 'aem-schedule-persona';

/** When `start` / `persona` appear in the URL, persist them for the rest of the tab session. */
function syncScheduleSessionFromUrl() {
  try {
    const params = new URL(window.location.href).searchParams;
    if (params.has('start')) {
      const raw = params.get('start')?.trim() ?? '';
      if (raw === '') {
        sessionStorage.removeItem(SESSION_START_KEY);
      } else if (!Number.isNaN(Date.parse(raw))) {
        sessionStorage.setItem(SESSION_START_KEY, raw);
      }
    }
    if (params.has('persona')) {
      const raw = params.get('persona')?.trim() ?? '';
      if (raw === '') {
        sessionStorage.removeItem(SESSION_PERSONA_KEY);
      } else {
        sessionStorage.setItem(SESSION_PERSONA_KEY, raw);
      }
    }
  } catch {
    // sessionStorage may be unavailable (private mode, disabled)
  }
}

async function removeSchedule(a, e) {
  if (ENV === 'prod') {
    a.remove();
    return;
  }
  if (e) config.log(e);
  config.log(`Could not load: ${a.href}`);
}

async function loadLocalizedEvent(event) {
  const url = new URL(event.fragment);
  const localized = localizeUrl({ config, url });
  const path = localized?.pathname || url.pathname;

  try {
    const fragment = await loadFragment(path);
    return fragment;
  } catch {
    config.log(`Error fetching ${path} fragment`);
    return null;
  }
}

/**
 * Determine what ancestor to replace with the fragment
 *
 * @param {Element}} a the fragment link
 * @returns the element that can be replaced
 */
function getReplaceEl(a) {
  let current = a;
  const ancestor = a.closest('.section');

  // Walk up the DOM from child to ancestor
  // Break when there is more than one child
  while (current && current !== ancestor) {
    const childCount = current.parentElement.children.length;
    if (childCount <= 1) {
      current = current.parentElement;
    } else {
      break;
    }
  }

  return current;
}

async function loadEvent(a, event, defEvent) {
  // If no fragment path on purpose, remove the schedule.
  if (!event.fragment) {
    a.remove();
    return;
  }

  let fragment = await loadLocalizedEvent(event);
  // Try the default event if the original match didn't work.
  if (!fragment && defEvent) fragment = await loadLocalizedEvent(defEvent);
  // If still no fragment, remove the schedule link
  if (!fragment) {
    removeSchedule(a);
    return;
  }
  const elToReplace = getReplaceEl(a);
  const sections = fragment.querySelectorAll(':scope > .section');
  const children = sections.length === 1
    ? fragment.querySelectorAll(':scope > *')
    : [fragment];
  for (const child of children) {
    elToReplace.insertAdjacentElement('afterend', child);
  }
  elToReplace.remove();
}

function getSimulatedNow() {
  const now = Date.now();
  if (ENV === 'prod') return now;

  const sim = localStorage.getItem('aem-schedule')
   || new URL(window.location.href).searchParams.get('schedule');
  return sim * 1000 || now;
}

/**
 * Effective instant used to pick a schedule row. URL `start` wins (ISO date or datetime),
 * then sessionStorage from a prior visit in this tab, then simulated / real now.
 */
function getEffectiveScheduleTime() {
  const startParam = new URL(window.location.href).searchParams.get('start')?.trim();
  if (startParam) {
    const parsed = Date.parse(startParam);
    if (!Number.isNaN(parsed)) return parsed;
    config.log(`Invalid schedule start query: ${startParam}`);
  }
  try {
    const stored = sessionStorage.getItem(SESSION_START_KEY)?.trim();
    if (stored) {
      const parsed = Date.parse(stored);
      if (!Number.isNaN(parsed)) return parsed;
    }
  } catch {
    // ignore
  }
  return getSimulatedNow();
}

/** Persona from URL `persona`, then sessionStorage, then `default`. */
function getEffectivePersona() {
  const params = new URL(window.location.href).searchParams;
  if (params.has('persona')) {
    const p = params.get('persona')?.trim();
    return p || 'default';
  }
  try {
    const stored = sessionStorage.getItem(SESSION_PERSONA_KEY)?.trim();
    if (stored) return stored;
  } catch {
    // ignore
  }
  return 'default';
}

function rowPersona(evt) {
  const p = evt.persona;
  if (p == null || String(p).trim() === '') return 'default';
  return String(p).trim();
}

function matchesPersona(evt, persona) {
  return rowPersona(evt).toLowerCase() === persona.toLowerCase();
}

export default async function init(a) {
  syncScheduleSessionFromUrl();

  const resp = await fetch(a.href);
  if (!resp.ok) {
    await removeSchedule(a);
    return;
  }
  const { data } = await resp.json();
  data.reverse();
  const effectiveMs = getEffectiveScheduleTime();
  const persona = getEffectivePersona();
  const found = data.find((evt) => {
    try {
      if (!matchesPersona(evt, persona)) return false;
      const start = Date.parse(evt.start);
      const end = Date.parse(evt.end);
      return effectiveMs > start && effectiveMs < end;
    } catch {
      config.log(`Could not get scheduled event: ${evt.name}`);
      return false;
    }
  });

  // Get a default event in case the main event doesn't load (same persona)
  const defEvent = data.find(
    (evt) => !(evt.start && evt.end) && matchesPersona(evt, persona),
  );

  // Use either the found event or the default
  const event = found || defEvent;
  if (!event) {
    await removeSchedule(a);
    return;
  }

  await loadEvent(a, event, defEvent);
}
