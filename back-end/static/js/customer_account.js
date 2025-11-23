// customer_account.js - module
const payments = window.paymentsData || [];

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
});
