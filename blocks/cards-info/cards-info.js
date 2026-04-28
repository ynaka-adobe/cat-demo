export default function decorate(block) {
  const ul = document.createElement('ul');
  [...block.children].forEach((row) => {
    const li = document.createElement('li');
    while (row.firstElementChild) li.append(row.firstElementChild);
    [...li.children].forEach((div) => {
      if (div.children.length === 1 && div.querySelector('picture')) div.className = 'cards-info-card-image';
      else div.className = 'cards-info-card-body';
    });
    ul.append(li);
  });
  block.textContent = '';
  block.append(ul);
}
