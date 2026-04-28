import { getConfig, getMetadata } from '../../scripts/ak.js';

const FOOTER_PATH = '/fragments/nav/footer';

function groupLinkColumns(section) {
  const content = section.querySelector('.default-content');
  if (!content) return;

  const children = [...content.children];
  const columns = [];
  let current = null;

  children.forEach((child) => {
    if (child.tagName === 'P' && child.querySelector('strong')) {
      current = document.createElement('div');
      current.classList.add('footer-column');
      current.append(child);
      columns.push(current);
    } else if (current) {
      current.append(child);
    }
  });

  content.innerHTML = '';
  columns.forEach((col) => content.append(col));
}

/**
 * loads and decorates the footer
 * @param {Element} el The footer element
 */
export default async function init(el) {
  const { locale } = getConfig();
  const footerMeta = getMetadata('footer');
  const path = footerMeta || FOOTER_PATH;
  try {
    const resp = await fetch(`${locale.prefix}${path}.plain.html`);
    if (!resp.ok) throw Error('Couldn\'t fetch footer');

    const html = await resp.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const fragment = document.createElement('div');
    fragment.classList.add('footer-content');

    const divs = doc.body.querySelectorAll(':scope > div');
    const sections = [...divs].map((div) => {
      const section = document.createElement('div');
      section.classList.add('section');
      const content = document.createElement('div');
      content.classList.add('default-content');
      content.append(...div.children);
      section.append(content);
      return section;
    });

    sections.forEach((s) => fragment.append(s));

    if (sections.length >= 2) {
      const copyright = sections[sections.length - 1];
      copyright.classList.add('section-copyright');

      const links = sections[0];
      links.classList.add('section-links');
      groupLinkColumns(links);
    }

    el.append(fragment);
  } catch (e) {
    throw Error(e);
  }
}
