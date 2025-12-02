import { showToast } from './notifications.js';

// Chart instances
let environmentalChart = null;
let customerChart = null;
let productChart = null;

// Store current report type for PDF saving
let currentReportType = '';
let currentReportTitle = '';

// DOM elements for modal
const modalOverlay = document.getElementById('report-modal-overlay');
const modalContent = document.getElementById('report-modal-content');
const modalTitle = document.getElementById('report-modal-title');
const modalLoader = '<div class="modal-loader"></div>';

// Map of report types to their date input IDs
const reportDateInputs = {
    environmental: { start: 'env-start-date', end: 'env-end-date' },
    customer: { start: 'cust-start-date', end: 'cust-end-date' },
    products: { start: 'prod-start-date', end: 'prod-end-date' }
};

// Polling handle for inventory updates
let inventoryPollTimer = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeAllDateFilters();
});

function initializeAllDateFilters() {
    const today = new Date();
    // Set default to 30 days ago
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    // Initialize date filters for each report
    Object.values(reportDateInputs).forEach(({ start, end }) => {
        const startInput = document.getElementById(start);
        const endInput = document.getElementById(end);
        
        if (startInput) startInput.valueAsDate = thirtyDaysAgo;
        if (endInput) endInput.valueAsDate = today;
    });
}

function getDateFiltersForReport(reportType) {
    const inputs = reportDateInputs[reportType];
    if (!inputs) return { start_date: '', end_date: '' };
    
    return {
        start_date: document.getElementById(inputs.start).value,
        end_date: document.getElementById(inputs.end).value
    };
}

/**
 * Opens the report modal, injects the correct template, and fetches the data.
 * @param {string} reportType - e.g., 'environmental', 'customer'
 * @param {string} title - The display title for the modal
 */
async function openReportModal(reportType, title) {
    currentReportType = reportType;
    currentReportTitle = title;

    // Show modal and set title/loader - localize the title
    const localizedTitle = window.i18n?.t(reportType) || title;
    modalTitle.textContent = localizedTitle;
    modalContent.innerHTML = modalLoader;
    modalOverlay.classList.add('modal-active');
    
    // Get the HTML content from the corresponding <template> tag
    const template = document.getElementById(`template-${reportType}`);
    if (template) {
        modalContent.innerHTML = template.innerHTML;
        // Translate new content if i18n is loaded
        if (window.i18n && typeof window.i18n.updateContent === 'function') {
            window.i18n.updateContent();
        }
        // Now that the canvas elements are in the DOM, fetch the data
        await fetchAndRenderReport(reportType);
    } else {
        modalContent.innerHTML = `<p>Error: Report template not found.</p>`;
        console.error(`Template not found for: template-${reportType}`);
    }
}

/**
 * Closes the report modal and clears its content.
 */
function closeReportModal() {
    modalOverlay.classList.remove('modal-active');
    modalContent.innerHTML = '';
    currentReportType = '';
    currentReportTitle = '';

    // Destroy charts to free up memory
    if (environmentalChart) environmentalChart.destroy();
    if (customerChart) customerChart.destroy();
    if (productChart) productChart.destroy();
    
    environmentalChart = null;
    customerChart = null;
    productChart = null;

    stopInventoryPolling();
}

/**
 * Saves the current modal content as a PDF.
 */
function savePdf() {
    const reportContent = document.getElementById('report-modal-content');
    const filename = `${currentReportTitle.toLowerCase().replace(/ /g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;

    // Options for html2pdf
    const options = {
        margin: 0.5,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Show toast notification
    showToast(window.i18n?.t('generatingPDF') || 'Generating PDF', window.i18n?.t('reportPreparing') || 'Your report is being prepared...', 'info');

    // Run html2pdf
    html2pdf().from(reportContent).set(options).save();
}

/**
 * Central function to call the correct data-fetching function.
 * @param {string} reportType - e.g., 'environmental', 'customer'
 */
async function fetchAndRenderReport(reportType) {
    try {
        switch(reportType) {
            case 'environmental':
                await loadEnvironmentalReport();
                break;
            case 'customer':
                await loadCustomerAnalyticsReport();
                break;
            case 'products':
                await loadProductSalesReport();
                break;
            case 'inventory':
                await loadInventoryReport();
                startInventoryPolling();
                break;
        }
        // Translate new content if i18n is loaded
        if (window.i18n && typeof window.i18n.updateContent === 'function') {
            window.i18n.updateContent();
        }
    } catch (error) {
        console.error(`Error loading report for ${reportType}:`, error);
        showToast(window.i18n?.t('error') || 'Error', `${window.i18n?.t('failedToLoad') || 'Failed to load'} ${reportType} ${window.i18n?.t('report') || 'report'}`, 'error');
        modalContent.innerHTML = `<p>Error loading report. Please try again.</p>`;
    }
}

// ============= ENVIRONMENTAL REPORT =============

async function loadEnvironmentalReport() {
    const filters = getDateFiltersForReport('environmental');
    // Set date range labels
    const startEl = document.querySelector('#report-modal-content #env-report-start-date');
    const endEl = document.querySelector('#report-modal-content #env-report-end-date');
    if (startEl) startEl.textContent = filters.start_date;
    if (endEl) endEl.textContent = filters.end_date;

    const response = await fetch(`/api/reports/environmental?start_date=${filters.start_date}&end_date=${filters.end_date}`);
    const data = await response.json();

    if (!data.success) throw new Error(data.error || 'Failed to load data');

    const tempData = data.temperature_data || [];
    const humidityData = data.humidity_data || [];

    const avgTemp = tempData.length > 0 
        ? (tempData.reduce((sum, d) => sum + d.value, 0) / tempData.length).toFixed(2)
        : 'N/A';
    
    const avgHumidity = humidityData.length > 0
        ? (humidityData.reduce((sum, d) => sum + d.value, 0) / humidityData.length).toFixed(2)
        : 'N/A';

    // Target elements inside the modal
    document.querySelector('#report-modal-content #avg-temp').textContent = `${avgTemp}°C`;
    document.querySelector('#report-modal-content #avg-humidity').textContent = `${avgHumidity}%`;

    const labels = tempData.map(d => new Date(d.timestamp).toLocaleDateString());
    const tempValues = tempData.map(d => d.value);
    const humidityValues = humidityData.map(d => d.value);

    createEnvironmentalChart(labels, tempValues, humidityValues);
}

function createEnvironmentalChart(labels, tempData, humidityData) {
    // Target canvas inside the modal
    const ctx = document.querySelector('#report-modal-content #environmental-chart')?.getContext('2d');
    if (!ctx) return; // Exit if canvas not found

    if (environmentalChart) environmentalChart.destroy();

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e7ff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    environmentalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: window.i18n?.t('temperature') || 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#ff6b6b',
                    backgroundColor: isDarkMode ? 'rgba(255, 107, 107, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: window.i18n?.t('humidity') || 'Humidity (%)',
                    data: humidityData,
                    borderColor: '#4dabf7',
                    backgroundColor: isDarkMode ? 'rgba(77, 171, 247, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y1'
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: 'index', intersect: false },
            scales: {
                y: {
                    type: 'linear', display: true, position: 'left',
                    title: { display: true, text: 'Temperature (°C)', color: textColor },
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                },
                y1: {
                    type: 'linear', display: true, position: 'right',
                    title: { display: true, text: window.i18n?.t('humidity') || 'Humidity (%)', color: textColor },
                    ticks: { color: textColor },
                    grid: { drawOnChartArea: false },
                },
                x: {
                    ticks: { color: textColor },
                    grid: { color: gridColor }
                }
            },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: textColor } }
            }
        }
    });
}

// ============= CUSTOMER ANALYTICS REPORT =============

async function loadCustomerAnalyticsReport() {
    const filters = getDateFiltersForReport('customer');
    const response = await fetch(`/api/reports/customer-analytics?start_date=${filters.start_date}&end_date=${filters.end_date}`);
    const data = await response.json();

    if (!data.success) throw new Error(data.error || 'Failed to load data');

    // Date range label
    document.querySelector('#report-modal-content #cust-report-start-date').textContent = filters.start_date;
    document.querySelector('#report-modal-content #cust-report-end-date').textContent = filters.end_date;

    // Stats
    document.querySelector('#report-modal-content #total-customers').textContent = data.total_customers;
    document.querySelector('#report-modal-content #new-customers').textContent = data.new_customers;
    document.querySelector('#report-modal-content #returning-customers').textContent = data.returning_customers || 0;
    document.querySelector('#report-modal-content #total-rewards').textContent = data.total_rewards_distributed;

    // Populate table and chart
    populateTopCustomersTable(data.top_customers || []);
    createCustomerChart(data.top_customers || []);
}

function populateTopCustomersTable(topCustomers) {
    const tbody = document.querySelector('#report-modal-content #top-customers-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    topCustomers.forEach(item => {
        const name = `${item.customer.first_name} ${item.customer.last_name}`;
        const totalSpent = Number(item.total_spent || 0);
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${name}</td>
            <td>$${totalSpent.toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function createCustomerChart(topCustomers) {
    const ctx = document.querySelector('#report-modal-content #customer-chart')?.getContext('2d');
    if (!ctx) return;

    const labels = topCustomers.map(item => `${item.customer.first_name} ${item.customer.last_name}`);
    const totals = topCustomers.map(item => Number(item.total_spent || 0));

    if (customerChart) customerChart.destroy();

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e7ff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    customerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: window.i18n?.t('totalSpent') || 'Total Spent ($)',
                data: totals,
                backgroundColor: '#4dabf7',
                borderColor: '#1590f5',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            indexAxis: 'y',
            scales: {
                x: { ticks: { color: textColor }, grid: { color: gridColor } },
                y: { ticks: { color: textColor }, grid: { color: gridColor } }
            },
            plugins: {
                legend: { display: true, position: 'top', labels: { color: textColor } },
                tooltip: {
                    callbacks: {
                        label: (ctx) => `$${Number(ctx.parsed.x || 0).toFixed(2)}`
                    }
                }
            }
        }
    });
}

// ============= PRODUCT SALES REPORT =============

async function loadProductSalesReport() {
    const filters = getDateFiltersForReport('products');

    let url = `/api/reports/product-sales?start_date=${filters.start_date}&end_date=${filters.end_date}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.success) throw new Error(data.error || 'Failed to load data');

    // Display date range
    document.querySelector('#report-modal-content #report-start-date').textContent = filters.start_date;
    document.querySelector('#report-modal-content #report-end-date').textContent = filters.end_date;

    // Display stats
    document.querySelector('#report-modal-content #total-sales').textContent = `$${data.total_sales.toFixed(2)}`;
    document.querySelector('#report-modal-content #products-sold-count').textContent = data.total_products_sold || 0;

    // Populate tables
    populateProductsSoldTable(data.products_sold || []);
    populateMostSoldTable(data.most_sold_products || []);
    populateLeastSoldTable(data.least_sold_products || []);

    // Create circular chart by category
    createProductCategoryChart(data.products_sold || []);
}

function populateProductsSoldTable(productsSold) {
    const tbody = document.querySelector('#report-modal-content #product-sales-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    productsSold.forEach(item => {
        const product = item.product;
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>${item.number_sold}</td>
        `;
        tbody.appendChild(row);
    });
}

function populateMostSoldTable(mostSold) {
    const tbody = document.querySelector('#report-modal-content #most-sold-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    mostSold.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>$${(product.price || 0).toFixed(2)}</td>
            <td>${product.points_worth || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

function populateLeastSoldTable(leastSold) {
    const tbody = document.querySelector('#report-modal-content #least-sold-table tbody');
    if (!tbody) return;
    tbody.innerHTML = '';

    leastSold.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category || '-'}</td>
            <td>$${(product.price || 0).toFixed(2)}</td>
            <td>${product.points_worth || 0}</td>
        `;
        tbody.appendChild(row);
    });
}

function createProductCategoryChart(productsSold) {
    const ctx = document.querySelector('#report-modal-content #product-chart')?.getContext('2d');
    if (!ctx) return;

    // Aggregate quantities by category
    const categoryData = {};
    productsSold.forEach(item => {
        const category = item.product.category || 'Uncategorized';
        categoryData[category] = (categoryData[category] || 0) + item.number_sold;
    });

    const labels = Object.keys(categoryData);
    const quantities = Object.values(categoryData);

    if (productChart) productChart.destroy();

    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e7ff' : '#333';
    const borderColor = isDarkMode ? '#3d4557' : '#ffffff';

    productChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: quantities,
                backgroundColor: [
                    '#4dabf7', '#ff6b6b', '#51cf66', '#ffa94d', '#b197fc',
                    '#ff8c8c', '#4ecdc4', '#ff922b', '#82c91e', '#748ffc',
                    '#20c997', '#ff6b9d', '#ffd43b', '#748ffc', '#da77f2'
                ],
                borderColor: borderColor,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    display: true, 
                    position: 'right', 
                    labels: { color: textColor, padding: 15 }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const units = window.i18n?.t('units') || 'units';
                            return context.label + ': ' + context.parsed + ' ' + units;
                        }
                    }
                }
            }
        }
    });
}

// ============= INVENTORY REPORT =============

function getInventoryLevelFromProduct(p) {
    const stock = Number(p.available_stock ?? p.total_stock ?? 0);
    const low = Number(p.low_stock_threshold ?? 10);
    const moderate = Number(p.moderate_stock_threshold ?? 50);

    if (stock <= low) return { label: window.i18n?.t('low') || 'Low', color: '#dc2626' };
    if (stock <= moderate) return { label: window.i18n?.t('moderate') || 'Moderate', color: '#f59f00' };
    return { label: window.i18n?.t('ok') || 'OK', color: '#20c997' };
}

// Render inventory table rows
function renderInventoryRows(products) {
    const tbody = document.querySelector('#report-modal-content #inventory-table tbody');
    if (!tbody) return;

    if (!products || products.length === 0) {
        const noProductsText = window.i18n?.t('noProductsFound') || 'No products found';
        tbody.innerHTML = `<tr><td colspan="5" class="text-muted">${noProductsText}</td></tr>`;
        return;
    }

    tbody.innerHTML = products.map(p => {
        const stock = Number(p.available_stock ?? p.total_stock ?? 0);
        const level = getInventoryLevelFromProduct(p);
        return `
            <tr>
                <td>${p.product_id}</td>
                <td>${p.name}</td>
                <td>${p.category || '-'}</td>
                <td><strong>${stock}</strong></td>
                <td>
                    <span style="
                        display:inline-block;
                        padding:0.25rem 0.5rem;
                        border-radius:999px;
                        color:#fff;
                        background:${level.color};
                        font-size:0.8rem;
                    ">${level.label}</span>
                </td>
            </tr>
        `;
    }).join('');
}

// Fetch inventory data
async function loadInventoryReport() {
    try {
        // Use existing products API
        const response = await fetch('/products/data');
        const products = await response.json();
        renderInventoryRows(products);
    } catch (err) {
        console.error('Error loading inventory report:', err);
        showToast(window.i18n?.t('error') || 'Error', window.i18n?.t('failedToLoadInventory') || 'Failed to load inventory', 'error');
        const tbody = document.querySelector('#report-modal-content #inventory-table tbody');
        if (tbody) {
            const errorMsg = window.i18n?.t('errorLoadingInventory') || 'Error loading inventory';
            tbody.innerHTML = `<tr><td colspan="4" class="text-danger">${errorMsg}</td></tr>`;
        }
    }
}

// Start/stop polling while modal is active
function startInventoryPolling() {
    stopInventoryPolling();
    // Poll every 5 seconds
    inventoryPollTimer = setInterval(loadInventoryReport, 5000);
}

function stopInventoryPolling() {
    if (inventoryPollTimer) {
        clearInterval(inventoryPollTimer);
        inventoryPollTimer = null;
    }
}

// ============= EXPORT TO GLOBAL SCOPE =============
// Make functions available to be called from HTML
if (typeof window !== 'undefined') {
    window.openReportModal = openReportModal;
    window.closeReportModal = closeReportModal;
    window.savePdf = savePdf;
}

// Listen for language changes to re-localize modal content
document.addEventListener('languageChanged', () => {
    if (window.i18n && typeof window.i18n.updateContent === 'function') {
        window.i18n.updateContent();
    }
});