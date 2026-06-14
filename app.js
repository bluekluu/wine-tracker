let allWines = [];
let activeTypes = new Set();

async function init() {
  const data = await fetch('./wines.json').then(r => r.json());
  allWines = data.wines;
  document.getElementById('last-updated').textContent = formatDate(data.lastUpdated);
  setupFilters(allWines);
  renderWineGrid(allWines);
}

// ── Filters ───────────────────────────────────────────────────────────────────

function setupFilters(wines) {
  const types = [...new Set(wines.map(w => normalizeType(w.type)))].sort();
  document.getElementById('type-filters').innerHTML = types.map(t =>
    `<button class="chip" data-type="${t}">${t}</button>`
  ).join('');

  document.querySelectorAll('.chip').forEach(chip => {
    chip.addEventListener('click', () => {
      const t = chip.dataset.type;
      activeTypes.has(t) ? activeTypes.delete(t) : activeTypes.add(t);
      chip.classList.toggle('active');
      applyFilters();
    });
  });

  document.getElementById('search').addEventListener('input', applyFilters);
  document.getElementById('score-filter').addEventListener('change', applyFilters);
  document.getElementById('buy-again-filter').addEventListener('change', applyFilters);
}

function applyFilters() {
  const query    = document.getElementById('search').value.toLowerCase();
  const minScore = parseFloat(document.getElementById('score-filter').value);
  const buyAgain = document.getElementById('buy-again-filter').checked;

  const filtered = allWines.filter(w => {
    if (activeTypes.size > 0 && !activeTypes.has(normalizeType(w.type))) return false;
    if (w.score < minScore) return false;
    if (buyAgain && !w.buyAgain) return false;
    if (query) {
      const haystack = [w.name, w.region, w.taste, w.notes].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });

  const count = document.getElementById('result-count');
  count.textContent = filtered.length === allWines.length
    ? `Showing all ${allWines.length} wines`
    : `${filtered.length} of ${allWines.length} wines`;

  renderWineGrid(filtered);
}

// ── Wine grid & cards ─────────────────────────────────────────────────────────

function renderWineGrid(wines) {
  const grid = document.getElementById('wine-grid');
  if (wines.length === 0) {
    grid.innerHTML = '<p class="empty-state">No wines match your filters.</p>';
    return;
  }
  grid.innerHTML = wines.map(wineCard).join('');
  grid.querySelectorAll('.wine-card').forEach(card => {
    card.addEventListener('click', () => card.classList.toggle('expanded'));
  });
}

function wineCard(w) {
  return `
    <div class="wine-card">
      <div class="wine-card-header">
        <div class="wine-meta-row">
          <span class="wine-type-badge ${badgeClass(w.type)}">${w.type}</span>
          ${renderStars(w.score)}
        </div>
        <div class="wine-name">${w.name}</div>
        <div class="wine-vintage-region">${w.vintage} &middot; ${w.region}</div>
        <div class="wine-footer">
          <span class="wine-price">${formatPrice(w.price)}</span>
          <span class="buy-again-pill ${w.buyAgain ? 'pill-yes' : 'pill-no'}">
            ${w.buyAgain ? 'Buy again' : 'One &amp; done'}
          </span>
        </div>
      </div>
      <div class="wine-details">
        <div class="wine-detail-body">
          <img class="wine-bottle-photo" src="${w.image}" alt="${w.name} bottle" loading="lazy">
          <div class="wine-detail-info">
            <div class="detail-label">Tasting Notes</div>
            <div class="detail-text">${w.taste}</div>
            <div class="detail-label">Quick Notes</div>
            <div class="detail-text">${w.notes}</div>
            <div class="detail-meta">
              <span>${w.store}</span>
              <span>${w.source}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── Utilities ─────────────────────────────────────────────────────────────────

function renderStars(score) {
  const pct = (score / 5) * 100;
  return `<span class="stars" aria-label="${score} out of 5 stars">
    <span class="stars-bg">★★★★★</span>
    <span class="stars-fg" style="width:${pct}%">★★★★★</span>
  </span>`;
}

function normalizeType(type) {
  const t = type.toLowerCase();
  if (t.includes('champagne') || t.includes('sparkling')) return 'Champagne';
  if (t.includes('red')) return 'Red';
  if (t.includes('white')) return 'White';
  if (t.includes('ros')) return 'Rosé';
  return type;
}

function badgeClass(type) {
  const t = type.toLowerCase();
  if (t.includes('champagne') || t.includes('sparkling')) return 'badge-champagne';
  if (t.includes('red')) return 'badge-red';
  if (t.includes('white')) return 'badge-white';
  if (t.includes('ros')) return 'badge-rose';
  return 'badge-default';
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long', day: 'numeric', year: 'numeric'
  });
}

function formatPrice(price) {
  return '$' + price.toFixed(2);
}

init();
