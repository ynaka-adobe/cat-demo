export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  // Row 0: title + button
  const headerRow = rows[0];
  const titleCell = headerRow.children[0];
  const buttonCell = headerRow.children[1];

  const header = document.createElement('div');
  header.className = 'showcase-header';

  const title = document.createElement('h2');
  title.className = 'showcase-title';
  title.textContent = titleCell?.textContent?.trim() || '';

  header.append(title);

  if (buttonCell) {
    const link = buttonCell.querySelector('a');
    if (link) {
      link.className = 'showcase-btn';
      header.append(link);
    }
  }

  // Separate tab rows from image row
  // Last row = images (has <picture> elements), rest = tabs
  const tabRows = [];
  let imageRow = null;

  for (let i = 1; i < rows.length; i += 1) {
    const hasPicture = rows[i].querySelector('picture');
    if (hasPicture && i === rows.length - 1) {
      imageRow = rows[i];
    } else {
      tabRows.push(rows[i]);
    }
  }

  // Build tabs
  const tabNav = document.createElement('div');
  tabNav.className = 'showcase-tab-nav';

  const tabPanels = document.createElement('div');
  tabPanels.className = 'showcase-tab-panels';

  tabRows.forEach((row, idx) => {
    const tabName = row.children[0]?.textContent?.trim() || `Tab ${idx + 1}`;
    const tabContent = row.children[1];

    const btn = document.createElement('button');
    btn.className = `showcase-tab${idx === 0 ? ' active' : ''}`;
    btn.textContent = tabName;
    btn.dataset.tab = idx;
    btn.addEventListener('click', () => {
      tabNav.querySelectorAll('.showcase-tab').forEach((t) => t.classList.remove('active'));
      tabPanels.querySelectorAll('.showcase-tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      tabPanels.children[idx]?.classList.add('active');
    });
    tabNav.append(btn);

    const panel = document.createElement('div');
    panel.className = `showcase-tab-panel${idx === 0 ? ' active' : ''}`;
    if (tabContent) panel.append(...tabContent.childNodes);
    tabPanels.append(panel);
  });

  const tabSection = document.createElement('div');
  tabSection.className = 'showcase-tabs';
  tabSection.append(tabNav, tabPanels);

  // Build carousel
  const carousel = document.createElement('div');
  carousel.className = 'showcase-carousel';

  if (imageRow) {
    const pictures = imageRow.querySelectorAll('picture');
    const mainImg = document.createElement('div');
    mainImg.className = 'carousel-main';

    const thumbStrip = document.createElement('div');
    thumbStrip.className = 'carousel-thumbs';

    let currentIndex = 0;

    const dots = document.createElement('div');
    dots.className = 'carousel-dots';

    const showSlide = (idx) => {
      currentIndex = idx;
      mainImg.innerHTML = '';
      const pic = pictures[idx]?.cloneNode(true);
      if (pic) mainImg.append(pic);
      thumbStrip.querySelectorAll('.carousel-thumb').forEach((t, i) => {
        t.classList.toggle('active', i === idx);
      });
      dots.querySelectorAll('.carousel-dot').forEach((d, i) => {
        d.classList.toggle('active', i === idx);
      });
    };

    // Dots
    pictures.forEach((_, i) => {
      const dot = document.createElement('span');
      dot.className = `carousel-dot${i === 0 ? ' active' : ''}`;
      dot.addEventListener('click', () => showSlide(i));
      dots.append(dot);
    });

    // Thumbs
    pictures.forEach((pic, i) => {
      const thumb = document.createElement('button');
      thumb.className = `carousel-thumb${i === 0 ? ' active' : ''}`;
      const thumbPic = pic.cloneNode(true);
      thumb.append(thumbPic);
      thumb.addEventListener('click', () => showSlide(i));
      thumbStrip.append(thumb);
    });

    // Navigation
    const nav = document.createElement('div');
    nav.className = 'carousel-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-prev';
    prevBtn.innerHTML = '&larr;';
    prevBtn.addEventListener('click', () => {
      const idx = (currentIndex - 1 + pictures.length) % pictures.length;
      showSlide(idx);
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-next';
    nextBtn.innerHTML = '&rarr;';
    nextBtn.addEventListener('click', () => {
      const idx = (currentIndex + 1) % pictures.length;
      showSlide(idx);
    });

    nav.append(prevBtn, dots, nextBtn);
    carousel.append(mainImg, thumbStrip, nav);

    // Show first slide
    if (pictures.length > 0) showSlide(0);
  }

  // Build body (tabs left, carousel right)
  const body = document.createElement('div');
  body.className = 'showcase-body';
  body.append(tabSection, carousel);

  // Replace block content
  block.textContent = '';
  block.append(header, body);
}
