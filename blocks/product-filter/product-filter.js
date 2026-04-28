export default function decorate(block) {
  const groups = [...block.children];
  groups.forEach((row) => {
    const cols = [...row.children];
    if (cols.length >= 1) {
      const heading = cols[0].querySelector('p');
      if (heading) {
        const h4 = document.createElement('h4');
        h4.textContent = heading.textContent;
        heading.replaceWith(h4);
      }
    }
    if (cols.length >= 2) {
      const options = cols[1];
      const items = options.querySelectorAll('p');
      const list = document.createElement('ul');
      list.className = 'filter-options';
      items.forEach((item) => {
        const li = document.createElement('li');
        const label = document.createElement('label');
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        label.append(checkbox);
        label.append(document.createTextNode(` ${item.textContent}`));
        li.append(label);
        list.append(li);
      });
      options.replaceChildren(list);
    }
    row.classList.add('filter-group');
  });
}
