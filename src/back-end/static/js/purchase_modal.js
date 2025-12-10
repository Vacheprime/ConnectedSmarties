import { showToast } from './notifications.js';

document.addEventListener("DOMContentLoaded", () => {
    const receiptItems = document.querySelectorAll(".receipt-item");

    receiptItems.forEach(item => {
        item.addEventListener("click", () => {
            const paymentId = item.dataset.paymentId;
            openReceiptModal(paymentId);
        });
    });

    // Setup PDF export button
    const exportPdfBtn = document.getElementById("exportPdfBtn");
    if (exportPdfBtn) {
        exportPdfBtn.addEventListener("click", exportReceiptAsPDF);
    }
});

async function openReceiptModal(paymentId) {
    try {
        const res = await fetch(`/receipt-details/${paymentId}`);

        const raw = await res.text();
        console.log("RAW RESPONSE:", raw);
        const data = JSON.parse(raw);


        if (!data.success) {
            showToast("Error", "Unable to load receipt details", "error");
            return;
        }

        const productsHTML = data.products.map(p => `
            <tr>
                <td>${p.name}</td>
                <td>${p.quantity}</td>
                <td>$${p.price.toFixed(2)}</td>
            </tr>
        `).join("");

        const html = `
            <h4>Thank you for your purchase, ${data.customer && data.customer.first_name ? data.customer.first_name : ''}</h4>
            <p><strong>Receipt #:</strong> ${paymentId}</p>
            <p><strong>Date:</strong> ${data.date}</p>

            <h5>Products</h5>
            <table class="table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Qty</th>
                        <th>Price</th>
                    </tr>
                </thead>
                <tbody>
                    ${productsHTML}
                </tbody>
            </table>

            <hr>
            <p><strong>Total Amount:</strong> $${data.total.toFixed(2)}</p>
            <p><strong>Points Earned:</strong> ${data.points}</p>
        `;

        document.querySelector("#receipt-content").innerHTML = html;

        const modal = new bootstrap.Modal(document.getElementById("receiptModal"));
        modal.show();

    } catch (error) {
        console.log(error);
        showToast("Error", "Something went with loading the receipts.", "error");
    }
}

function exportReceiptAsPDF() {
    try {
        const receiptContent = document.querySelector("#receipt-content");
        
        if (!receiptContent || !receiptContent.innerHTML.trim()) {
            showToast("Error", "No receipt to export.", "error");
            return;
        }

        // Extract receipt number from the content
        const receiptNumberMatch = receiptContent.innerHTML.match(/Receipt #:<\/strong> (\d+)/);
        const receiptNumber = receiptNumberMatch ? receiptNumberMatch[1] : "Receipt";

        // Create a new element to hold the printable content
        const element = document.createElement("div");
        element.innerHTML = receiptContent.innerHTML;
        
        // Style the element for better PDF appearance
        element.style.padding = "20px";
        element.style.fontFamily = "Arial, sans-serif";
        element.style.fontSize = "12px";
        element.style.lineHeight = "1.6";

        // HTML to PDF options
        const options = {
            margin: 10,
            filename: `receipt_${receiptNumber}.pdf`,
            image: { type: "jpeg", quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { orientation: "portrait", unit: "mm", format: "a4" }
        };

        // Generate PDF
        html2pdf().set(options).from(element).save();
        showToast("Success", "Receipt exported as PDF successfully.", "success");

    } catch (error) {
        console.error("PDF Export Error:", error);
        showToast("Error", "Failed to export receipt as PDF.", "error");
    }
}
