function setBackgroundFocus(img) {
  const { title } = img.dataset;
  if (!title?.includes('data-focal')) return;
  delete img.dataset.title;
  const [x, y] = title.split(':')[1].split(',');
  img.style.objectPosition = `${x}% ${y}%`;
}

function decorateBackground(bg) {
  const bgPic = bg.querySelector('picture');
  if (!bgPic) return;

  const img = bgPic.querySelector('img');
  setBackgroundFocus(img);

  const vidLink = bgPic.closest('a[href*=".mp4"]');
  if (!vidLink) return;
  const video = document.createElement('video');
  video.src = vidLink.href;
  video.loop = true;
  video.muted = true;
  video.inert = true;
  video.setAttribute('playsinline', '');
  video.setAttribute('preload', 'none');
  video.load();
  video.addEventListener('canplay', () => {
    video.play();
    bgPic.remove();
  });
  vidLink.parentElement.append(video, bgPic);
  vidLink.remove();
}

/**
 * True when the page runs inside Document Authoring Universal Editor.
 * DOM must stay aligned with the authored table so data-aue-* / Media Bus
 * bindings on the hero image are not reparented away from the instrumented nodes.
 */
function isUniversalEditorHost() {
  return /\.(?:stage-ue|ue)\.da\.live$/i.test(window.location?.hostname ?? '');
}

/**
 * Full-bleed overlay CSS expects `.hero-background` + `.hero-foreground` as two
 * direct children. Authoring often delivers one row (e.g. DA UE 1×1): picture + copy
 * in one wrapper — that row was ending up as foreground-only, so the image never
 * filled the viewport. Normalize one-row shapes into bg + fg. Skip `stack` (in-flow
 * layout) and Universal Editor (keep DOM aligned with data-aue selectors).
 */
function normalizeHeroRowsForOverlay(el) {
  if (el.classList.contains('stack')) return;

  const rows = [...el.querySelectorAll(':scope > div')];
  if (rows.length !== 1) return;

  const row = rows[0];
  const cols = [...row.children].filter((c) => c.nodeName === 'DIV');

  const hasPicture = (node) => !!node.querySelector?.('picture');

  /* One row: <picture> and copy as direct siblings (no cell divs) */
  const directPic = row.querySelector(':scope > picture');
  const directHeading = row.querySelector(
    ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6',
  );
  const directLead = row.querySelector(':scope > p');
  if (cols.length < 2 && directPic && (directHeading || directLead)) {
    const bg = document.createElement('div');
    const picWrap = document.createElement('div');
    picWrap.append(directPic);
    bg.append(picWrap);
    const fg = document.createElement('div');
    while (row.firstChild) fg.append(row.firstChild);
    el.replaceChildren(bg, fg);
    return;
  }

  if (cols.length >= 2) {
    const picCol = cols.find((c) => hasPicture(c));
    if (!picCol) return;

    /* Prefer a non-image column with a heading; skip <a> on picture matching as "text". */
    let textCol = cols.find(
      (c) => c !== picCol && c.querySelector('h1, h2, h3, h4, h5, h6'),
    );
    if (!textCol) {
      textCol = cols.find(
        (c) => c !== picCol && !hasPicture(c) && c.querySelector('p, a, ul'),
      );
    }
    if (!textCol) return;

    const bg = document.createElement('div');
    bg.append(picCol);
    const fg = document.createElement('div');
    cols.forEach((c) => {
      if (c !== picCol) fg.append(c);
    });
    el.replaceChildren(bg, fg);
    return;
  }

  if (cols.length === 1) {
    const only = cols[0];
    const pic = only.querySelector(':scope picture');
    const hasText = only.querySelector(
      ':scope > h1, :scope > h2, :scope > h3, :scope > h4, :scope > h5, :scope > h6, :scope > p',
    );
    if (!pic || !hasText) return;

    const bg = document.createElement('div');
    const picWrap = document.createElement('div');
    picWrap.append(pic);
    bg.append(picWrap);
    const fg = document.createElement('div');
    while (only.firstChild) fg.append(only.firstChild);
    el.replaceChildren(bg, fg);
  }
}

function decorateForeground(fg) {
  const hero = fg.closest('.hero');
  if (!hero) return;

  const isLargeDiagonal = hero.classList.contains('large')
    && hero.classList.contains('diagonal-overlay');

  const { children } = fg;
  for (const [idx, child] of [...children].entries()) {
    const heading = /^H[1-6]$/.test(child.nodeName)
      ? child
      : child.querySelector('h1, h2, h3, h4, h5, h6');
    const text = heading
      || (child.nodeName === 'P' ? child : null)
      || child.querySelector('p, a, ul');
    if (heading) {
      heading.classList.add('hero-heading');
      const detail = heading.previousElementSibling;
      if (detail) {
        detail.classList.add('hero-detail');
      }
    }
    // Determine foreground column types
    if (text) {
      child.classList.add('fg-text');
      if (idx === 0) {
        hero.classList.add('hero-text-start');
      } else {
        hero.classList.add('hero-text-end');
      }
    }
  }

  /* Large diagonal: tag every cell with copy/CTA so flex stacks headline + button. */
  if (isLargeDiagonal) {
    [...fg.children].forEach((child) => {
      if (child.nodeName !== 'DIV') return;
      if (child.querySelector('h1, h2, h3, h4, h5, h6, p, a, ul, ol')) {
        child.classList.add('fg-text');
      }
    });
  }
}

export default async function init(el) {
  if (!isUniversalEditorHost()) {
    normalizeHeroRowsForOverlay(el);
  }
  const rows = [...el.querySelectorAll(':scope > div')];
  const fg = rows.pop();
  fg.classList.add('hero-foreground');
  /* Avoid mutating copy / media subtree in UE so data-aue bindings stay stable. */
  if (!isUniversalEditorHost()) {
    decorateForeground(fg);
  }
  if (rows.length) {
    const bg = rows.pop();
    bg.classList.add('hero-background');
    if (!isUniversalEditorHost()) {
      decorateBackground(bg);
    }
  }
}
