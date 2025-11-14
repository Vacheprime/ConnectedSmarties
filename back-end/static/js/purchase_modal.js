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
        const res = await fetch('')
    }
}