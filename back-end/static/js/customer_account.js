// customer_account.js - module
import { t } from './i18n.js'

const payments = window.paymentsData || [];

// Build an index of products -> occurrences for fast search
function buildProductIndex() {
  const index = new Map();
  payments.forEach(payment => {
    const date = payment.date || '';
    (payment.products || []).forEach(prod => {
      const name = (prod.name || '').trim();
      if (!name) return;
      const key = name.toLowerCase();
      const entry = {
        payment_id: payment.payment_id,
        date: date,
        price: prod.price,
        quantity: prod.quantity,
        name: prod.name,
      };
      if (!index.has(key)) index.set(key, []);
      index.get(key).push(entry);
    })
  });
  return index;
}

function formatDateTime(dateStr) {
  if (!dateStr) return '';
  // Try to parse "YYYY-MM-DD HH:MM:SS" or ISO
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  const date = d.toLocaleDateString('en-CA');
  const time = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `${date} @ ${time}`;
}

function renderSearchResultsForMatch(container, productName, occurrences) {
  const card = document.createElement('div');
  card.className = 'mb-3 p-3 border rounded bg-white';

  const nameEl = document.createElement('h5');
  nameEl.textContent = `Item: ${productName}`;
  card.appendChild(nameEl);

  const purchasedCount = document.createElement('p');
  purchasedCount.className = 'mb-2 text-muted';
  purchasedCount.textContent = `${t('purchased')}: ${occurrences.length} ${t('times')}`;
  card.appendChild(purchasedCount);

  const ul = document.createElement('ul');
  ul.className = 'list-unstyled mb-0';

  // Sort by date ascending
  occurrences.sort((a, b) => new Date(a.date) - new Date(b.date));
  occurrences.forEach(o => {
    const li = document.createElement('li');
    li.className = 'py-1';
    li.textContent = `${formatDateTime(o.date)} – $${Number(o.price).toFixed(2)}`;
    ul.appendChild(li);
  });

  card.appendChild(ul);
  container.appendChild(card);
}

function renderSearchResults(productMatches) {
  const results = document.getElementById('searchResults');
  if (!results) return;
  results.innerHTML = '';
  if (!productMatches || productMatches.length === 0) {
    const p = document.createElement('p');
    p.textContent = t('noResults');
    results.appendChild(p);
    return;
  }

  // For each matched product show its block
  productMatches.forEach(match => {
    renderSearchResultsForMatch(results, match.name, match.occurrences);
  });
}

function setupPurchaseSearch() {
  const input = document.getElementById('purchaseSearch');
  const index = buildProductIndex();
  if (!input) return;

  let timeout = null;
  input.addEventListener('input', e => {
    clearTimeout(timeout);
    const q = (e.target.value || '').trim().toLowerCase();
    timeout = setTimeout(() => {
      if (!q) {
        document.getElementById('searchResults').innerHTML = '';
        return;
      }
      // Match keys that contain q
      const matches = [];
      for (const [key, arr] of index.entries()) {
        if (key.includes(q)) {
          matches.push({ name: arr[0].name, occurrences: arr });
        }
      }
      if (matches.length === 0) {
        renderSearchResults([]);
        return;
      }
      // Show all matches (limit to 10 to avoid huge lists)
      renderSearchResults(matches.slice(0, 10));
    }, 180);
  });
}

function buildChart() {
  const labels = payments.map(p => (p.date || p.date_time || '').slice(0, 10));
  const totals = payments.map(p => Number(p.total_paid || p.total || 0));

  const ctx = document.getElementById('spendingChart');
  if (!ctx) return;

  // Destroy existing chart instance if present (in case of live reload)
  if (ctx._chartInstance) {
    ctx._chartInstance.destroy();
  }

  const chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.length ? labels : ['No data'],
      datasets: [{
        label: 'Spending',
        data: totals.length ? totals : [0],
        borderColor: '#0d6efd',
        backgroundColor: 'rgba(13,110,253,0.1)',
        fill: true,
        tension: 0.2,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: { beginAtZero: true }
      },
      plugins: { legend: { display: false } }
    }
  });

  ctx._chartInstance = chart;
}

function setupSidebarScrolling() {
  const links = document.querySelectorAll('#accountSidebar .nav-link');
  const sections = Array.from(links).map(l => document.querySelector(l.getAttribute('href'))).filter(Boolean);

  function onScroll() {
    const scrollPos = window.scrollY + 120; // offset
    let currentIndex = 0;
    sections.forEach((sec, idx) => {
      if (sec.offsetTop <= scrollPos) currentIndex = idx;
    });
    links.forEach(l => l.classList.remove('active'));
    if (links[currentIndex]) links[currentIndex].classList.add('active');
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  links.forEach(l => {
    l.addEventListener('click', e => {
      e.preventDefault();
      const target = document.querySelector(l.getAttribute('href'));
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

document.addEventListener('DOMContentLoaded', () => {
  try { buildChart(); } catch (err) { console.error(err); }
  setupSidebarScrolling();
  try { setupPurchaseSearch(); } catch (err) { console.error('search init', err); }
});
