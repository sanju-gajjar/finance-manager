function openModal(type) {
    document.getElementById("modal").style.display = "block";
    document.getElementById("modalTitle").innerText = type === 'expense' ? 'Add Expense' : 'Add Income';
}

function closeModal() {
    document.getElementById("modal").style.display = "none";
}

function submitEntry() {
    const amount = document.getElementById("amount").value;
    const type = document.getElementById("type").value;
    const desc = document.getElementById("description").value;
    const selection = document.getElementById("selectOption").value;
    const entryType = document.getElementById("modalTitle").innerText.includes("Expense") ? "expense" : "income";

    fetch("/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selection, type, description: desc, amount, entryType })
    })
        .then(res => res.json())
        .then(() => {
            alert("Entry saved!");
            closeModal();
        })
        .catch(console.error);
}

function showSummaryForm() {
    document.getElementById('summaryForm').style.display = 'block';
    document.getElementById('summaryResult').style.display = 'none';
}

function fetchSummary() {
    const month = document.getElementById("month").value;
    const year = document.getElementById("year").value;

    fetch(`/summary?month=${month}&year=${year}`)
        .then(res => res.json())
        .then(data => {
            document.getElementById('summaryMonthYear').innerText = `${month}-${year}`;
            document.getElementById('totalExpense').innerText = data.totalExpense.toFixed(2);
            document.getElementById('totalIncome').innerText = data.totalIncome.toFixed(2);
            document.getElementById('expensePercentage').innerText = data.expensePercentage.toFixed(2);
            document.getElementById('incomePercentage').innerText = data.incomePercentage.toFixed(2);
            document.getElementById('topCategory').innerText = data.topCategory;
            document.getElementById('summaryResult').style.display = 'block';
        })
        .catch(() => alert("No data found or error occurred."));
}

function deleteEntry(entryId) {
    if (!confirm('Are you sure you want to delete this entry?')) return;
    fetch(`/entry/${entryId}`, { method: 'DELETE' })
        .then(res => res.json())
        .then(result => {
            if (result.success) {
                alert('Entry deleted.');
                fetchSummary();
            } else {
                alert('Failed to delete entry.');
            }
        })
        .catch(() => alert('Error deleting entry.'));
}
