export default function decorate(block) {
  if (!block.querySelector(':scope > div:first-child img')) {
    block.classList.add('no-image');
  }

  const textWrap = block.querySelector(':scope > div:last-child > div');
  const lastP = textWrap?.querySelector('p:last-of-type');
  lastP?.querySelectorAll('a').forEach((a) => {
    if (!a.classList.contains('btn')) a.classList.add('btn');
  });
}
