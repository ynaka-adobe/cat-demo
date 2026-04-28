function addCarouselNav(block) {
  const ul = block.querySelector('ul');
  if (!ul) return;

  const nav = document.createElement('div');
  nav.className = 'carousel-nav';

  const prevBtn = document.createElement('button');
  prevBtn.className = 'carousel-prev';
  prevBtn.setAttribute('aria-label', 'Previous');
  prevBtn.textContent = '\u2190';

  const nextBtn = document.createElement('button');
  nextBtn.className = 'carousel-next';
  nextBtn.setAttribute('aria-label', 'Next');
  nextBtn.textContent = '\u2192';

  const dots = document.createElement('div');
  dots.className = 'carousel-dots';
  const items = ul.querySelectorAll('li');
  const pageCount = Math.ceil(items.length / 4) || 1;
  for (let i = 0; i < pageCount; i += 1) {
    const dot = document.createElement('span');
    dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
    dots.append(dot);
  }

  nav.append(prevBtn, dots, nextBtn);
  block.append(nav);

  prevBtn.addEventListener('click', () => {
    ul.scrollBy({ left: -260, behavior: 'smooth' });
  });
  nextBtn.addEventListener('click', () => {
    ul.scrollBy({ left: 260, behavior: 'smooth' });
  });

  ul.addEventListener('scroll', () => {
    const scrollPos = ul.scrollLeft;
    const maxScroll = ul.scrollWidth - ul.clientWidth;
    const page = Math.round((scrollPos / maxScroll) * (pageCount - 1));
    dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
      d.classList.toggle('active', i === page);
    });
  });
}

export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-category-card-image';
      else div.className = 'cards-category-card-body';
    });
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);

  // Add carousel nav if in the explore section (light bg)
  const section = block.closest('.section');
  if (section) {
    const bg = section.style.backgroundColor;
    if (bg && bg.includes('245')) {
      addCarouselNav(block);
    }
  }
}
