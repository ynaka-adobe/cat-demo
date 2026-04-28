export default function decorate(block) {
  const rows = [...block.children];
  if (rows.length < 2) return;

  const hash = window.location.hash?.replace('#', '').toLowerCase();
  const activeCondition = hash || 'new';

  // Row 0: page title + tabs
  const headerRow = rows[0];
  const titleCell = headerRow.children[0];
  const tabsCell = headerRow.children[1];

  const header = document.createElement('div');
  header.className = 'inventory-header';

  const titleArea = document.createElement('div');
  titleArea.className = 'inventory-title-area';
  const title = document.createElement('h2');
  title.className = 'inventory-title';
  title.textContent = titleCell?.textContent?.trim() || 'Inventory';
  titleArea.append(title);

  // Tabs from comma-separated values
  const tabNav = document.createElement('div');
  tabNav.className = 'inventory-tabs';
  const tabNames = tabsCell?.textContent?.trim().split(',').map((t) => t.trim()) || ['New', 'Used', 'Rental'];

  tabNames.forEach((name) => {
    const tab = document.createElement('a');
    tab.className = `inventory-tab${name.toLowerCase() === activeCondition ? ' active' : ''}`;
    tab.textContent = name;
    tab.href = `#${name.toLowerCase()}`;
    tab.dataset.condition = name.toLowerCase();
    tabNav.append(tab);
  });

  header.append(titleArea, tabNav);

  // Row 1: subtitle + configure link
  const subtitleRow = rows[1];
  const subtitle = document.createElement('div');
  subtitle.className = 'inventory-subtitle-bar';
  const subtitleText = document.createElement('h3');
  subtitleText.className = 'inventory-subtitle';
  subtitleText.textContent = subtitleRow?.children[0]?.textContent?.trim() || '';
  subtitle.append(subtitleText);

  const configLink = subtitleRow?.children[1]?.querySelector('a');
  if (configLink) {
    configLink.className = 'inventory-configure-btn';
    subtitle.append(configLink);
  }

  // Row 2: filter sidebar content
  const filterRow = rows[2];
  const sidebar = document.createElement('aside');
  sidebar.className = 'inventory-sidebar';
  if (filterRow?.children[0]) {
    sidebar.append(...filterRow.children[0].childNodes);
  }

  // Remaining rows: parse condition markers and cards
  // A marker row has a single cell with text like "condition: new"
  // Card rows have picture in first cell
  const conditionGroups = {};
  let currentCondition = 'new';

  for (let i = 3; i < rows.length; i += 1) {
    const row = rows[i];
    const firstCell = row.children[0];
    const text = firstCell?.textContent?.trim().toLowerCase() || '';

    // Check if this is a condition marker row
    if (text.startsWith('condition:')) {
      currentCondition = text.replace('condition:', '').trim();
      if (!conditionGroups[currentCondition]) {
        conditionGroups[currentCondition] = [];
      }
    } else {
      // It's a card row
      if (!conditionGroups[currentCondition]) {
        conditionGroups[currentCondition] = [];
      }
      conditionGroups[currentCondition].push(row);
    }
  }

  // Build card grids for each condition
  const grid = document.createElement('div');
  grid.className = 'inventory-grid';

  const infoBar = document.createElement('div');
  infoBar.className = 'inventory-info-bar';
  grid.append(infoBar);

  const allCardGrids = {};

  Object.keys(conditionGroups).forEach((condition) => {
    const cardGrid = document.createElement('div');
    cardGrid.className = 'inventory-card-grid';
    cardGrid.dataset.condition = condition;

    conditionGroups[condition].forEach((row) => {
      const card = document.createElement('div');
      card.className = 'inventory-card';

      const imgCell = row.children[0];
      const dataCell = row.children[1];

      if (imgCell) {
        const imgWrap = document.createElement('div');
        imgWrap.className = 'inventory-card-image';
        imgWrap.append(...imgCell.childNodes);
        card.append(imgWrap);
      }

      if (dataCell) {
        const body = document.createElement('div');
        body.className = 'inventory-card-body';
        body.append(...dataCell.childNodes);
        card.append(body);
      }

      cardGrid.append(card);
    });

    grid.append(cardGrid);
    allCardGrids[condition] = cardGrid;
  });

  // Show/hide function
  function showCondition(condition) {
    Object.keys(allCardGrids).forEach((key) => {
      allCardGrids[key].style.display = key === condition ? '' : 'none';
    });
    const count = conditionGroups[condition]?.length || 0;
    infoBar.innerHTML = `<span>Showing ${count} matches near 53703</span><span>Sort By: Distance <span class="sort-arrow">&#8964;</span></span>`;
  }

  // Attach tab click listeners now that showCondition is defined
  tabNav.querySelectorAll('.inventory-tab').forEach((tab) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const { condition } = tab.dataset;
      showCondition(condition);
      tabNav.querySelectorAll('.inventory-tab').forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
    });
  });

  // Initial state
  showCondition(activeCondition);

  // Assemble layout
  const content = document.createElement('div');
  content.className = 'inventory-content';
  content.append(sidebar, grid);

  block.textContent = '';
  block.append(header, subtitle, content);
}
