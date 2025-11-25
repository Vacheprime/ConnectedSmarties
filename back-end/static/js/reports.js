import { showToast } from './notifications.js';

// Chart instances
let environmentalChart = null;
let customerChart = null;
let productChart = null;
let fanChart = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initializeDateFilters();
    setupFilterListeners();
    loadCategoryFilter();
});

function initializeDateFilters() {
    const today = new Date();
    const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    document.getElementById('end-date').valueAsDate = today;
    document.getElementById('start-date').valueAsDate = thirtyDaysAgo;
}

function setupFilterListeners() {
    document.getElementById('apply-filters').addEventListener('click', () => {
        // Reload all open reports with new filters
        document.querySelectorAll('.report-detail[style*="display: block"]').forEach(detail => {
            const reportType = detail.id.replace('-detail', '');
            loadReportData(reportType);
        });
        showToast('Filters Applied', 'Reports updated with new date range', 'info');
    });

    document.getElementById('reset-filters').addEventListener('click', () => {
        initializeDateFilters();
        document.getElementById('category-filter').value = '';
    });
}

function getDateFilters() {
    return {
        start_date: document.getElementById('start-date').value,
        end_date: document.getElementById('end-date').value
    };
}

function toggleReportDetail(event, reportType) {
    const button = event.target.closest('.btn-expand');
    const detailElement = document.getElementById(`${reportType}-detail`);
    
    button.classList.toggle('active');
    
    if (detailElement.style.display === 'none') {
        detailElement.style.display = 'block';
    } else {
        detailElement.style.display = 'none';
    }
}

async function closeReportDetail(reportType) {
    const detailElement = document.getElementById(`${reportType}-detail`);
    detailElement.style.display = 'none';
}

function showReportDetail(reportType) {
    const detailElement = document.getElementById(`${reportType}-detail`);
    detailElement.style.display = 'block';
}

async function loadReportData(reportType) {
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
        case 'performance':
            await loadSystemPerformanceReport();
            break;
        case 'fan':
            await loadFanUsageReport();
            break;
    }
}

// ============= ENVIRONMENTAL REPORT =============

async function loadEnvironmentalReport() {
    try {
        const filters = getDateFilters();
        const response = await fetch(`/api/reports/environmental?start_date=${filters.start_date}&end_date=${filters.end_date}`);
        const data = await response.json();

        if (!data.success) {
            showToast('Error', data.error || 'Failed to load environmental report', 'error');
            return;
        }

        // Calculate averages
        const tempData = data.temperature_data || [];
        const humidityData = data.humidity_data || [];

        const avgTemp = tempData.length > 0 
            ? (tempData.reduce((sum, d) => sum + d.value, 0) / tempData.length).toFixed(2)
            : 'N/A';
        
        const avgHumidity = humidityData.length > 0
            ? (humidityData.reduce((sum, d) => sum + d.value, 0) / humidityData.length).toFixed(2)
            : 'N/A';

        document.getElementById('avg-temp').textContent = `${avgTemp}°C`;
        document.getElementById('avg-humidity').textContent = `${avgHumidity}%`;

        // Prepare chart data
        const labels = tempData.map(d => new Date(d.timestamp).toLocaleDateString());
        const tempValues = tempData.map(d => d.value);
        const humidityValues = humidityData.map(d => d.value);

        // Create or update chart
        createEnvironmentalChart(labels, tempValues, humidityValues);

        // Show the detail section
        showReportDetail('environmental');

        showToast('Success', 'Environmental report loaded', 'success');
    } catch (error) {
        console.error('Error loading environmental report:', error);
        showToast('Error', 'Failed to load environmental report', 'error');
    }
}

function createEnvironmentalChart(labels, tempData, humidityData) {
    const ctx = document.getElementById('environmental-chart').getContext('2d');
    
    if (environmentalChart) {
        environmentalChart.destroy();
    }

    // Detect dark mode for better chart visibility
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e7ff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    environmentalChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Temperature (°C)',
                    data: tempData,
                    borderColor: '#ff6b6b',
                    backgroundColor: isDarkMode ? 'rgba(255, 107, 107, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                    tension: 0.4,
                    fill: true,
                    yAxisID: 'y'
                },
                {
                    label: 'Humidity (%)',
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
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Humidity (%)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// ============= CUSTOMER ANALYTICS REPORT =============

async function loadCustomerAnalyticsReport() {
    try {
        const filters = getDateFilters();
        const response = await fetch(`/api/reports/customer-analytics?start_date=${filters.start_date}&end_date=${filters.end_date}`);
        const data = await response.json();

        if (!data.success) {
            showToast('Error', data.error || 'Failed to load customer analytics', 'error');
            return;
        }

        // Update stats
        document.getElementById('total-customers').textContent = data.total_customers;
        document.getElementById('new-customers').textContent = data.new_customers;
        document.getElementById('total-rewards').textContent = data.total_rewards_distributed;
        document.getElementById('avg-rewards').textContent = data.average_rewards_per_customer;

        // Populate top customers table
        populateTopCustomersTable(data.top_customers);

        // Create chart
        createCustomerChart(data.top_customers);

        // Show the detail section
        showReportDetail('customer');

        showToast('Success', 'Customer analytics loaded', 'success');
    } catch (error) {
        console.error('Error loading customer analytics:', error);
        showToast('Error', 'Failed to load customer analytics', 'error');
    }
}

function populateTopCustomersTable(customers) {
    const tbody = document.querySelector('#top-customers-table tbody');
    tbody.innerHTML = '';

    customers.forEach(customer => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${customer.first_name} ${customer.last_name}</td>
            <td>${customer.purchase_count || 0}</td>
            <td>$${(customer.total_spent || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function createCustomerChart(topCustomers) {
    const ctx = document.getElementById('customer-chart').getContext('2d');
    const labels = topCustomers.map(c => `${c.first_name} ${c.last_name}`);
    const purchases = topCustomers.map(c => c.purchase_count || 0);

    if (customerChart) {
        customerChart.destroy();
    }

    // Detect dark mode
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e7ff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    customerChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Purchase Count',
                data: purchases,
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
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// ============= PRODUCT SALES REPORT =============

async function loadProductSalesReport() {
    try {
        const filters = getDateFilters();
        const category = document.getElementById('category-filter').value;
        
        let url = `/api/reports/product-sales?start_date=${filters.start_date}&end_date=${filters.end_date}&limit=10`;
        if (category) {
            url += `&category=${encodeURIComponent(category)}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (!data.success) {
            showToast('Error', data.error || 'Failed to load product sales report', 'error');
            return;
        }

        // Populate table
        populateProductSalesTable(data.sales_data);

        // Create chart
        createProductChart(data.sales_data);

        // Show the detail section
        showReportDetail('products');

        showToast('Success', 'Product sales report loaded', 'success');
    } catch (error) {
        console.error('Error loading product sales report:', error);
        showToast('Error', 'Failed to load product sales report', 'error');
    }
}

function populateProductSalesTable(products) {
    const tbody = document.querySelector('#product-sales-table tbody');
    tbody.innerHTML = '';

    products.forEach(product => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${product.name}</td>
            <td>${product.category}</td>
            <td>${product.total_quantity || 0}</td>
            <td>${product.total_transactions || 0}</td>
            <td>$${(product.total_revenue || 0).toFixed(2)}</td>
        `;
        tbody.appendChild(row);
    });
}

function createProductChart(products) {
    const ctx = document.getElementById('product-chart').getContext('2d');
    const labels = products.map(p => p.name);
    const quantities = products.map(p => p.total_quantity || 0);

    if (productChart) {
        productChart.destroy();
    }

    // Detect dark mode
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
                    '#4dabf7',
                    '#ff6b6b',
                    '#51cf66',
                    '#ffa94d',
                    '#b197fc',
                    '#ff8c8c',
                    '#4ecdc4',
                    '#ff922b',
                    '#82c91e',
                    '#748ffc'
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
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// ============= SYSTEM PERFORMANCE REPORT =============

async function loadSystemPerformanceReport() {
    try {
        const filters = getDateFilters();
        const response = await fetch(`/api/reports/system-performance?start_date=${filters.start_date}&end_date=${filters.end_date}`);
        const data = await response.json();

        if (!data.success) {
            showToast('Error', data.error || 'Failed to load system performance report', 'error');
            return;
        }

        // Update stats
        document.getElementById('total-transactions').textContent = data.total_transactions;
        document.getElementById('total-revenue').textContent = `$${data.total_revenue.toFixed(2)}`;
        document.getElementById('avg-transaction').textContent = `$${data.average_transaction_value.toFixed(2)}`;
        document.getElementById('device-uptime').textContent = data.device_uptime_days;

        // Show the detail section
        showReportDetail('performance');

        showToast('Success', 'System performance report loaded', 'success');
    } catch (error) {
        console.error('Error loading system performance report:', error);
        showToast('Error', 'Failed to load system performance report', 'error');
    }
}

// ============= FAN USAGE REPORT =============

async function loadFanUsageReport() {
    try {
        const filters = getDateFilters();
        const response = await fetch(`/api/reports/fan-usage?start_date=${filters.start_date}&end_date=${filters.end_date}`);
        const data = await response.json();

        if (!data.success) {
            showToast('Error', data.error || 'Failed to load fan usage report', 'error');
            return;
        }

        // Populate table
        populateFanUsageTable(data.fan_usage_data);

        // Create chart
        createFanChart(data.fan_usage_data);

        // Show the detail section
        showReportDetail('fan');

        showToast('Success', 'Fan usage report loaded', 'success');
    } catch (error) {
        console.error('Error loading fan usage report:', error);
        showToast('Error', 'Failed to load fan usage report', 'error');
    }
}

function populateFanUsageTable(fanData) {
    const tbody = document.querySelector('#fan-usage-table tbody');
    tbody.innerHTML = '';

    fanData.forEach(data => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${data.date}</td>
            <td>${data.sensor_readings}</td>
            <td>${(data.avg_temperature || 0).toFixed(2)}°C</td>
        `;
        tbody.appendChild(row);
    });
}

function createFanChart(fanData) {
    const ctx = document.getElementById('fan-chart').getContext('2d');
    const labels = fanData.map(d => d.date);
    const temps = fanData.map(d => (d.avg_temperature || 0).toFixed(2));
    const readings = fanData.map(d => d.sensor_readings);

    if (fanChart) {
        fanChart.destroy();
    }

    // Detect dark mode for better chart visibility
    const isDarkMode = document.documentElement.getAttribute('data-theme') === 'dark';
    const textColor = isDarkMode ? '#e0e7ff' : '#333';
    const gridColor = isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

    fanChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Avg Temperature (°C)',
                data: temps,
                borderColor: '#ff6b6b',
                backgroundColor: isDarkMode ? 'rgba(255, 107, 107, 0.15)' : 'rgba(239, 68, 68, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y'
            },
            {
                label: 'Sensor Readings',
                data: readings,
                borderColor: '#4dabf7',
                backgroundColor: isDarkMode ? 'rgba(77, 171, 247, 0.15)' : 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                fill: true,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Temperature (°C)',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Sensor Readings',
                        color: textColor
                    },
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        drawOnChartArea: false,
                    },
                },
                x: {
                    ticks: {
                        color: textColor
                    },
                    grid: {
                        color: gridColor
                    }
                }
            },
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: textColor
                    }
                }
            }
        }
    });
}

// ============= CATEGORY FILTER =============

async function loadCategoryFilter() {
    try {
        const response = await fetch('/api/reports/product-sales');
        const data = await response.json();

        if (data.success && data.categories) {
            const select = document.getElementById('category-filter');
            data.categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category;
                option.textContent = category;
                select.appendChild(option);
            });
        }
    } catch (error) {
        console.error('Error loading categories:', error);
    }
}

// ============= EXPORT TO GLOBAL SCOPE =============

if (typeof window !== 'undefined') {
    window.loadEnvironmentalReport = loadEnvironmentalReport;
    window.loadCustomerAnalyticsReport = loadCustomerAnalyticsReport;
    window.loadProductSalesReport = loadProductSalesReport;
    window.loadSystemPerformanceReport = loadSystemPerformanceReport;
    window.loadFanUsageReport = loadFanUsageReport;
    window.toggleReportDetail = toggleReportDetail;
}
