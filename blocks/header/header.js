import { getConfig, getMetadata } from '../../scripts/ak.js';

const { locale } = getConfig();
const HEADER_PATH = '/fragments/nav/header';

/* ------------------------------------------------------------------ */
/* Menu open/close helpers */
/* ------------------------------------------------------------------ */

function closeAllMenus(header) {
  header.querySelectorAll('.is-open').forEach((el) => el.classList.remove('is-open'));
}

/* ------------------------------------------------------------------ */
/* Build global bar (top row) */
/* ------------------------------------------------------------------ */

function buildGlobalBar(globalData) {
  const bar = document.createElement('div');
  bar.className = 'header-global-bar';

  const inner = document.createElement('div');
  inner.className = 'header-inner';

  // Cat.com back link (matches dealer pattern: "< Cat.com")
  const rawLabel = (globalData.catLabel || 'Cat.com').trim();
  const catWord = rawLabel.replace(/^<\s*/, '').trim();
  const backLink = document.createElement('a');
  backLink.className = 'header-back-link';
  backLink.href = globalData.catUrl || 'https://www.cat.com';
  backLink.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><polyline points="15 18 9 12 15 6"/></svg><span>&lt; ${catWord}</span>`;

  // Right side: address + phones
  const info = document.createElement('div');
  info.className = 'header-dealer-info';

  if (globalData.address) {
    const addr = document.createElement('span');
    addr.className = 'header-dealer-address';
    addr.textContent = globalData.address;
    info.append(addr);
  }

  (globalData.phones || []).forEach(({ label, number }) => {
    const phone = document.createElement('a');
    phone.className = 'header-dealer-phone';
    phone.href = `tel:${number.replace(/[^+\d]/g, '')}`;
    phone.innerHTML = `<strong>${label}:</strong> ${number}`;
    info.append(phone);
  });

  inner.append(backLink, info);
  bar.append(inner);
  return bar;
}

/* ------------------------------------------------------------------ */
/* Build search */
/* ------------------------------------------------------------------ */

function buildSearch() {
  const wrap = document.createElement('div');
  wrap.className = 'header-search';
  wrap.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
    <form class="header-search-form" action="/search" method="get" role="search">
      <input type="search" name="q" placeholder="Search" autocomplete="off" aria-label="Search">
    </form>`;

  const form = wrap.querySelector('form');
  form.addEventListener('submit', (e) => e.preventDefault());

  return wrap;
}

/* ------------------------------------------------------------------ */
/* Build login */
/* ------------------------------------------------------------------ */

function buildLogin() {
  const wrap = document.createElement('a');
  wrap.className = 'header-login';
  wrap.href = '/login';
  wrap.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
    <span>Login</span>`;
  return wrap;
}

/* ------------------------------------------------------------------ */
/* Build hamburger (mobile) */
/* ------------------------------------------------------------------ */

function buildHamburger(header) {
  const btn = document.createElement('button');
  btn.className = 'header-hamburger';
  btn.setAttribute('aria-label', 'Open navigation menu');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span></span><span></span><span></span>';

  btn.addEventListener('click', () => {
    const isOpen = header.classList.toggle('nav-open');
    btn.setAttribute('aria-expanded', String(isOpen));
    btn.setAttribute('aria-label', isOpen ? 'Close navigation menu' : 'Open navigation menu');
  });

  return btn;
}

/* ------------------------------------------------------------------ */
/* Build navigation */
/* ------------------------------------------------------------------ */

function buildNav(items, header) {
  const nav = document.createElement('nav');
  nav.className = 'header-nav';
  nav.setAttribute('aria-label', 'Dealer navigation');

  const ul = document.createElement('ul');
  ul.className = 'nav-list';

  items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'nav-item';

    const a = document.createElement('a');
    a.className = 'nav-link';
    a.href = item.href || '#';
    a.textContent = item.label;

    if (item.hasDropdown) {
      a.setAttribute('aria-haspopup', 'true');
      a.setAttribute('aria-expanded', 'false');

      const dropdown = document.createElement('ul');
      dropdown.className = 'nav-dropdown';
      dropdown.setAttribute('aria-hidden', 'true');

      (item.links || []).forEach((link) => {
        const dli = document.createElement('li');
        const da = document.createElement('a');
        da.href = link.href || '#';
        da.textContent = link.label;
        dli.append(da);
        dropdown.append(dli);
      });

      li.append(a, dropdown);

      a.addEventListener('click', (e) => {
        e.preventDefault();
        const isOpen = li.classList.contains('is-open');
        closeAllMenus(header);
        if (!isOpen) {
          li.classList.add('is-open');
          a.setAttribute('aria-expanded', 'true');
          dropdown.setAttribute('aria-hidden', 'false');
        } else {
          a.setAttribute('aria-expanded', 'false');
          dropdown.setAttribute('aria-hidden', 'true');
        }
      });
    } else {
      li.append(a);
    }

    ul.append(li);
  });

  nav.append(ul);
  return nav;
}

/* ------------------------------------------------------------------ */
/* Extract dealer header data from fragment */
/* ------------------------------------------------------------------ */

function extractDealerData(fragment) {
  const data = {
    global: { catUrl: 'https://www.cat.com', catLabel: 'Cat.com', phones: [] },
    logo: null,
    navItems: [],
  };

  const sections = fragment.querySelectorAll(':scope > div');

  // Section 1: Global bar data (logo link, address, phones)
  const globalSection = sections[0];
  if (globalSection) {
    const links = globalSection.querySelectorAll('a');
    links.forEach((a) => {
      const text = a.textContent.trim();
      if (text.toLowerCase().includes('cat.com')) {
        data.global.catUrl = a.href;
        data.global.catLabel = text;
      }
    });

    // Look for address and phone data in paragraphs
    const paras = globalSection.querySelectorAll('p');
    paras.forEach((p) => {
      const text = p.textContent.trim();
      if (!p.querySelector('a') && !p.querySelector('picture') && text.length > 20) {
        data.global.address = text;
      }
    });

    // Extract phones from list items or paragraphs with phone patterns
    const phonePattern = /^(Service|Parts|Sales):\s*(.+)$/i;
    globalSection.querySelectorAll('li, p').forEach((el) => {
      const match = el.textContent.trim().match(phonePattern);
      if (match) {
        data.global.phones.push({ label: match[1], number: match[2].trim() });
      }
    });
  }

  // Section 2: Dealer logo + navigation
  const navSection = sections[1];
  if (navSection) {
    const pic = navSection.querySelector('picture');
    if (pic) data.logo = pic;

    const navUl = navSection.querySelector('ul');
    if (navUl) {
      const topLis = navUl.querySelectorAll(':scope > li');
      topLis.forEach((li) => {
        const link = li.querySelector(':scope > a, :scope > p > a');
        const label = link
          ? link.textContent.trim()
          : li.querySelector(':scope > p')?.textContent.trim();
        if (!label) return;

        const item = {
          label,
          href: link ? link.href : '#',
          hasDropdown: false,
          links: [],
        };

        const subUl = li.querySelector(':scope > ul');
        if (subUl) {
          item.hasDropdown = true;
          subUl.querySelectorAll('a').forEach((sub) => {
            item.links.push({ label: sub.textContent.trim(), href: sub.href });
          });
        }

        data.navItems.push(item);
      });
    }
  }

  // Fallback: if logo not found in nav section, check global section
  if (!data.logo && globalSection) {
    const pic = globalSection.querySelector('picture');
    if (pic) data.logo = pic;
  }

  return data;
}

/* ------------------------------------------------------------------ */
/* Assemble dealer header */
/* ------------------------------------------------------------------ */

function buildHeader(el, dealerData) {
  el.innerHTML = '';

  /* --- Global bar (top row) --- */
  el.append(buildGlobalBar(dealerData.global));

  /* --- Dealer nav row (bottom row) --- */
  const navRow = document.createElement('div');
  navRow.className = 'header-dealer-row';

  const navInner = document.createElement('div');
  navInner.className = 'header-inner';

  // Dealer logo
  const logoLink = document.createElement('a');
  logoLink.className = 'header-dealer-logo';
  logoLink.href = '/';
  logoLink.setAttribute('aria-label', 'Dealer Home');
  if (dealerData.logo) {
    logoLink.append(dealerData.logo);
  } else {
    logoLink.innerHTML = '<img src="/images/dealer-logo.png" alt="DEALER CAT" width="213" height="77">';
  }

  // Nav
  const nav = buildNav(dealerData.navItems, el);

  // Right tools: search + login
  const tools = document.createElement('div');
  tools.className = 'header-tools';
  tools.append(buildSearch(), buildLogin(), buildHamburger(el));

  navInner.append(logoLink, nav, tools);
  navRow.append(navInner);
  el.append(navRow);

  // Close menus on outside click
  document.addEventListener('click', (e) => {
    if (!el.contains(e.target)) closeAllMenus(el);
  });
}

/* ------------------------------------------------------------------ */
/* Init */
/* ------------------------------------------------------------------ */

async function loadHeaderFragment(path) {
  const resp = await fetch(`${path}.plain.html`);
  if (!resp.ok) return null;
  const html = await resp.text();
  const doc = new DOMParser().parseFromString(html, 'text/html');
  // The plain.html may or may not have <main>; get top-level divs from wherever they are
  const sections = doc.querySelectorAll('body > div, body > main > div');
  const wrapper = document.createElement('div');
  wrapper.append(...sections);
  return wrapper;
}

export default async function init(el) {
  const headerMeta = getMetadata('header');
  if (headerMeta === 'off') {
    document.body.classList.add('no-header');
    el.remove();
    return;
  }

  const path = headerMeta || HEADER_PATH;
  let dealerData = null;

  try {
    const fragment = await loadHeaderFragment(`${locale.prefix}${path}`);
    if (fragment) dealerData = extractDealerData(fragment);
  } catch {
    // Fragment not available — use defaults
  }

  if (!dealerData || !dealerData.navItems.length) {
    dealerData = {
      global: {
        catUrl: 'https://www.cat.com',
        catLabel: 'Cat.com',
        address: '12345 Main Street, Chicago, IL 12345',
        phones: [
          { label: 'Service', number: '(555) 123-4567' },
          { label: 'Parts', number: '(555) 123-4567' },
          { label: 'Sales', number: '(555) 123-4567' },
        ],
      },
      logo: null,
      navItems: [
        {
          label: 'Equipment',
          href: '/equipment',
          hasDropdown: true,
          links: [
            { label: 'New Equipment', href: '/new-equipment' },
            { label: 'Used Equipment', href: '/used-equipment' },
            { label: 'Rental Equipment', href: '/rental-equipment' },
          ],
        },
        {
          label: 'Parts',
          href: '/parts',
          hasDropdown: true,
          links: [
            { label: 'Shop Parts', href: '/parts/shop' },
            { label: 'Parts Specials', href: '/parts/specials' },
          ],
        },
        {
          label: 'Service',
          href: '/service',
          hasDropdown: true,
          links: [
            { label: 'Service Requests', href: '/service/request' },
            { label: 'Maintenance Plans', href: '/service/maintenance' },
          ],
        },
        { label: 'Offers', href: '/offers', hasDropdown: false, links: [] },
        {
          label: 'About Us',
          href: '/about',
          hasDropdown: true,
          links: [
            { label: 'Our Story', href: '/about/story' },
            { label: 'Locations', href: '/about/locations' },
            { label: 'Careers', href: '/about/careers' },
          ],
        },
        { label: 'Careers', href: '/careers', hasDropdown: false, links: [] },
      ],
    };
  }

  buildHeader(el, dealerData);
}
