// Check for user data in storage and update header
try {
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (userObj && userObj.name) {
        document.getElementById('active-user-display').textContent = userObj.name;
    }
} catch (e) { /* default to Supply Manager */ }

document.getElementById('add_delivery_date').valueAsDate = new Date();

// --- Notification System ---
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;

    container.appendChild(notification);

    requestAnimationFrame(() => {
        setTimeout(() => notification.classList.add('show'), 10);
    });

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// --- Logout Logic ---
function handleLogout() {
    if (confirm("Are you sure you want to securely log out?")) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
    }
}

// --- Trace Form Logic ---
const traceForm = document.getElementById('trace-form');
traceForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('trace-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Scanning...";
    btn.disabled = true;

    const batch_id = document.getElementById('batch_id').value;
    const messageDiv = document.getElementById('message');
    const tableContainer = document.getElementById('table-container');
    const tbody = document.querySelector('#shipment-table tbody');

    try {
        const res = await fetch('/api/recall/trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_id })
        });

        const data = await res.json();

        messageDiv.style.display = 'block';
        messageDiv.className = `message ${res.ok && data.shipments?.length > 0 ? 'success' : 'error'}`;
        messageDiv.innerText = data.message || "Scan complete.";

        tbody.innerHTML = '';

        if (data.shipments && data.shipments.length > 0) {
            tableContainer.style.display = 'block';
            data.shipments.forEach(shipment => {
                const row = document.createElement('tr');
                row.innerHTML = `
                            <td><strong>${shipment.shipment_id}</strong></td>
                            <td style="font-family: monospace;">${shipment.batch_id}</td>
                            <td>${shipment.customer_name}</td>
                            <td>${shipment.delivery_date}</td>
                            <td>
                                <span class="status ${shipment.status.toLowerCase()}">
                                    ${shipment.status}
                                </span>
                            </td>
                        `;
                tbody.appendChild(row);
            });
        } else {
            tableContainer.style.display = 'none';
        }
    } catch (err) {
        console.error("Trace error:", err);
        messageDiv.style.display = 'block';
        messageDiv.className = 'message error';
        messageDiv.innerText = "Connection error while scanning shipments.";
        tableContainer.style.display = 'none';
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- Recall Form Logic ---
const recallForm = document.getElementById('recall-form');
recallForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('recall-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Processing...";
    btn.disabled = true;

    const shipment_id = document.getElementById('shipment_id').value;

    try {
        const res = await fetch('/api/recall/recall_shipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipment_id })
        });

        const data = await res.json();

        if (res.ok) {
            showNotification(data.message || "Recall action processed.", "success");
            recallForm.reset();
        } else {
            showNotification(data.message || "Failed to process recall.", "error");
        }
    } catch (err) {
        console.error("Recall error:", err);
        showNotification("An error occurred while processing the recall.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});

// --- Add Shipment Form Logic ---
const addShipmentForm = document.getElementById('add-shipment-form');
addShipmentForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('add-shipment-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = "Registering...";
    btn.disabled = true;

    const shipment_id = document.getElementById('add_shipment_id').value;
    const batch_id = document.getElementById('add_batch_id').value;
    const customer_name = document.getElementById('add_customer_name').value;
    const delivery_date = document.getElementById('add_delivery_date').value;
    const status = document.getElementById('add_status').value;
    const supply_manager_id = document.getElementById('add_supply_manager_id').value;

    const newShipment = {
        shipment_id,
        batch_id,
        customer_name,
        delivery_date,
        status,
        supply_manager_id
    };

    try {
        const res = await fetch('/api/shipments/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newShipment)
        });

        const data = await res.json();

        if (res.ok) {
            showNotification(data.message || "Shipment successfully added!", "success");
            addShipmentForm.reset();
            document.getElementById('add_delivery_date').valueAsDate = new Date();
        } else {
            showNotification(data.message || "Failed to add shipment.", "error");
        }
    } catch (err) {
        console.error("Add shipment error:", err);
        showNotification("An error occurred while adding the shipment.", "error");
    } finally {
        btn.innerHTML = originalText;
        btn.disabled = false;
    }
});
