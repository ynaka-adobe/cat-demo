export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;
  const col = row.querySelector(':scope > div');
  const text = col ? col.textContent.trim() : '';

  block.innerHTML = '';

  const bar = document.createElement('div');
  bar.className = 'sort-bar-inner';

  const filterIcon = document.createElement('span');
  filterIcon.className = 'sort-bar-icon';
  filterIcon.textContent = '\u2261';

  const label = document.createElement('span');
  label.className = 'sort-bar-label';
  label.textContent = text;

  const chevron = document.createElement('span');
  chevron.className = 'sort-bar-chevron';
  chevron.textContent = '\u25BE';

  bar.append(filterIcon, label, chevron);
  block.append(bar);
}
