export default function decorate(block) {
  const row = block.querySelector(':scope > div');
  if (!row) return;

  const cols = [...row.children];
  if (cols.length < 2) return;

  // First column: image
  const imgCol = cols[0];
  imgCol.className = 'cta-banner-image';

  // Second column: content
  const contentCol = cols[1];
  contentCol.className = 'cta-banner-content';
}
