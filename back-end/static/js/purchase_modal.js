document.addEventListener("DOMContentLoaded", () => {
    const receiptItems = document.querySelectorAll(".receipt-item");

    receiptItems.forEach(item => {
        item.addEventListener("click", () => {
            const paymentId = item.dataset.paymentId;
            openReceiptModal(paymentId);
        });
    });
});

async function openReceiptModal(paymentId) {
    try {
        const res = await fetch(`/receipt-details/${paymentId}`);
        const data = await res.json();

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
        showToast("Error", "Something went wrong.", "error");
    }
}