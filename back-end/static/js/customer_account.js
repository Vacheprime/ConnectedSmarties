// customer_account.js - module
import { t } from './i18n.js'
import { showToast } from './notifications.js'

let allPayments = window.paymentsData || [];

// Build an index of products -> occurrences for fast search
function buildProductIndex() {
  const index = new Map();
  allPayments.forEach(payment => {
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
  // Reverse the payments array so older payments are first, newer are last
  const sortedPayments = [...allPayments].reverse();
  
  const labels = sortedPayments.map(p => (p.date || p.date_time || '').slice(0, 10));
  const totals = sortedPayments.map(p => Number(p.total_paid || p.total || 0));

  // Calculate and display total spending
  const totalSpending = totals.reduce((sum, val) => sum + val, 0);
  const totalSpendingElement = document.getElementById('chart-total-spending');
  if (totalSpendingElement) {
    totalSpendingElement.textContent = `$${totalSpending.toFixed(2)}`;
  }

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

function renderReceiptsList(payments) {
  const container = document.getElementById('receipts-list-container');
  if (!container) return;
  
  if (payments.length === 0) {
    container.innerHTML = `<p data-i18n="noPurchases">${t('noPurchases')}</p>`;
    return;
  }

  // Calculate total spending
  const totalSpending = payments.reduce((sum, payment) => sum + Number(payment.total_paid || 0), 0);

  container.innerHTML = `
    <div class="mb-3 p-3 border rounded" style="background-color: var(--color-background-card);">
      <p class="mb-0"><strong data-i18n="totalSpent">Total Spent:</strong> $${totalSpending.toFixed(2)}</p>
    </div>
    <ul class="list-group">
      ${payments.map(payment => `
        <li class="list-group-item receipt-item" data-payment-id="${payment.payment_id}" style="cursor:pointer;">
          ${payment.date} — <span data-i18n="receipt">${t('receipt')}</span> #${payment.payment_id} — $${payment.total_paid}
        </li>
      `).join('')}
    </ul>
  `;

  // Attach click handlers to receipt items
  container.querySelectorAll('.receipt-item').forEach(item => {
    item.addEventListener('click', function() {
      const paymentId = this.getAttribute('data-payment-id');
      window.showReceiptModal(paymentId);
    });
  });
}

let receiptModalInstance = null;

async function showReceiptModal(paymentId) {
  try {
    const response = await fetch(`/receipt-details/${paymentId}`);
    const data = await response.json();

    if (data.success) {
      const receiptContent = document.getElementById('receipt-content');
      const productsHtml = data.products.map(p => `
        <tr>
          <td>${p.name}</td>
          <td>${p.quantity}</td>
          <td>$${Number(p.price).toFixed(2)}</td>
        </tr>
      `).join('');

      receiptContent.innerHTML = `
        <div class="receipt-details">
          <h6><strong>Receipt #${paymentId}</strong></h6>
          <p><strong>Date:</strong> ${new Date(data.date).toLocaleDateString()}</p>
          <p><strong>Customer:</strong> ${data.customer.first_name || 'Guest'}</p>
          <table class="table table-sm">
            <thead>
              <tr>
                <th>Product</th>
                <th>Qty</th>
                <th>Price</th>
              </tr>
            </thead>
            <tbody>
              ${productsHtml}
            </tbody>
          </table>
          <hr>
          <p><strong>Total:</strong> $${Number(data.total).toFixed(2)}</p>
          <p><strong>Reward Points Earned:</strong> ${data.points}</p>
        </div>
      `;

      // Get the modal element
      const modalElement = document.getElementById('receiptModal');
      
      // Initialize modal only once
      if (!receiptModalInstance) {
        receiptModalInstance = new bootstrap.Modal(modalElement);
        
        // Add event listener to clean up backdrop on hidden
        modalElement.addEventListener('hidden.bs.modal', function handleModalHidden() {
          // Remove any lingering backdrop elements
          const backdrops = document.querySelectorAll('.modal-backdrop');
          backdrops.forEach(backdrop => backdrop.remove());
          
          // Ensure body scroll is restored
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
        }, { once: false });
      }
      
      // Show the modal
      receiptModalInstance.show();

    } else {
      showToast('Error', data.error || 'Failed to load receipt details', 'error');
    }
  } catch (error) {
    console.error('Error loading receipt:', error);
    showToast('Error', error.message, 'error');
  }
}

async function applyDateFilter() {
  const startDate = document.getElementById('filterStartDate').value;
  const endDate = document.getElementById('filterEndDate').value;

  if (!startDate || !endDate) {
    showToast('Validation Error', 'Please select both start and end dates', 'error');
    return;
  }

  if (startDate > endDate) {
    showToast('Validation Error', 'Start date must be before end date', 'error');
    return;
  }

  try {
    const response = await fetch(`/api/payments/filtered?start_date=${startDate}&end_date=${endDate}`);
    const data = await response.json();

    if (response.ok) {
      allPayments = data.payments || [];
      renderReceiptsList(allPayments);
      buildChart(); // Rebuild chart with filtered data
      showToast('Success', `Found ${allPayments.length} payment(s)`, 'success');
    } else {
      throw new Error(data.error || 'Failed to filter payments');
    }
  } catch (error) {
    console.error('Error filtering payments:', error);
    showToast('Error', error.message, 'error');
  }
}

function clearDateFilter() {
  document.getElementById('filterStartDate').value = '';
  document.getElementById('filterEndDate').value = '';
  allPayments = window.paymentsData || [];
  renderReceiptsList(allPayments);
  buildChart(); // Rebuild chart with all data
}

document.addEventListener('DOMContentLoaded', () => {
  try { buildChart(); } catch (err) { console.error(err); }
  setupSidebarScrolling();
  try { setupPurchaseSearch(); } catch (err) { console.error('search init', err); }
  
  // Render initial receipts list
  renderReceiptsList(allPayments);
});

// ============= EXPORT TO GLOBAL SCOPE =============
// Make functions available to be called from HTML onclick handlers
if (typeof window !== 'undefined') {
  window.applyDateFilter = applyDateFilter;
  window.clearDateFilter = clearDateFilter;
  window.showReceiptModal = showReceiptModal;
}
