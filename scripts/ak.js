import {
  decorateSections,
  decorateBlocks,
  loadSections,
  getMetadata,
} from './aem.js';

/**
 * Site config (locale prefix, logging). Prefix is empty when paths are served from repo root (local preview).
 */
export function getConfig() {
  return {
    locale: {
      prefix: '',
      lang: document.documentElement.lang || 'en',
    },
    log: (...args) => {
      console.error('[site]', ...args);
    },
  };
}

export { getMetadata };

/**
 * Decorate and load blocks inside a dynamically inserted subtree (e.g. fragment block).
 */
export async function loadArea({ area }) {
  decorateSections(area);
  decorateBlocks(area);
  await loadSections(area);
}

/**
 * Prefix localized paths when multi-locale routing is enabled (no-op for single-locale sites).
 * @param {string} url
 * @returns {string}
 */
export function localizeUrl(url) {
  if (!url || typeof url !== 'string') return url;
  return url;
}
