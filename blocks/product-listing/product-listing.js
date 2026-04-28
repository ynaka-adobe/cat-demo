export default function decorate(block) {
  const rows = [...block.children];
  rows.forEach((row) => {
    row.classList.add('product-listing-item');
    const cols = [...row.children];
    if (cols.length >= 2) {
      cols[0].classList.add('product-listing-specs');
      cols[1].classList.add('product-listing-media');
    }
  });
}
