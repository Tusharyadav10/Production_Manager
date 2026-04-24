let user_id = null;

// Check authentication on page load
async function checkAuth() {
    try {
        const res = await fetch('/api/auth/check-session', {
            credentials: 'include'
        });

        if (!res.ok) {
            window.location.replace("/");
            return;
        }

        const data = await res.json();
        user_id = data.user.user_id;
        document.getElementById('active-user-display').textContent = data.user.name;

    } catch (err) {
        window.location.replace("/");
    }
}

checkAuth();

document.getElementById('add_delivery_date').valueAsDate = new Date();

function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `<span>${message}</span>`;
    container.appendChild(notification);
    requestAnimationFrame(() => setTimeout(() => notification.classList.add('show'), 10));
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.remove(), 300);
    }, 4000);
}

// --- Logout Logic ---
async function handleLogout() {
    if (!confirm("Are you sure you want to securely log out?")) return;

    try {
        const res = await fetch('/api/auth/logout', {
            method: 'POST',
            credentials: 'include'
        });

        console.log("Logout status:", res.status);

        localStorage.clear();
        sessionStorage.clear();

        window.location.replace("/");

    } catch (err) {
        console.error("Logout error:", err);

        localStorage.clear();
        window.location.replace("/");
    }
}
// --- Fetch Defective Shipments Table ---
async function fetchAndRenderDefectiveShipments() {
    const tbody = document.querySelector('#defective-batches-tbody');
    try {
        const res = await fetch('/api/recall/defective_shipments');
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        const shipments = data.defective_shipments || [];

        tbody.innerHTML = '';
        if (shipments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="table-loader">No defective shipments found.</td></tr>';
            return;
        }

        shipments.forEach(shipment => {
            const tr = document.createElement('tr');
            const statusClass = (shipment.status || 'pending').toLowerCase();
            tr.innerHTML = `
                        <td><strong>${shipment.shipment_id}</strong></td>
                        <td style="font-family: monospace;">${shipment.batch_id}</td>
                        <td>${shipment.customer_name}</td>
                        <td>${new Date(shipment.delivery_date).toLocaleDateString()}</td>
                        <td><span class="status ${statusClass}">${shipment.status}</span></td>
                    `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        tbody.innerHTML = '<tr><td colspan="5" class="table-loader" style="color:var(--danger)">Error loading shipments.</td></tr>';
    }
}

// --- Trace Form Logic ---
document.getElementById('trace-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const btn = document.getElementById('trace-btn');
    const batch_id = document.getElementById('batch_id').value;
    const container = document.getElementById('table-container');
    const tbody = document.querySelector('#trace-results-table tbody');

    btn.disabled = true;
    try {
        const res = await fetch('/api/recall/trace', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ batch_id })
        });
        const data = await res.json();

        tbody.innerHTML = '';
        if (data.shipments && data.shipments.length > 0) {
            container.style.display = 'block';
            data.shipments.forEach(s => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                            <td><strong>${s.shipment_id}</strong></td>
                            <td>${s.batch_id}</td>
                            <td>${s.customer_name}</td>
                            <td>${new Date(s.delivery_date).toLocaleDateString()}</td>
                            <td><span class="status ${s.status.toLowerCase()}">${s.status}</span></td>
                        `;
                tbody.appendChild(tr);
            });
        } else {
            container.style.display = 'none';
            showNotification("No shipments found for this batch.", "warning");
        }
    } catch (err) {
        showNotification("Error scanning shipments.", "error");
    } finally {
        btn.disabled = false;
    }
});

// --- Execute Recall Logic ---
document.getElementById('recall-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const shipment_id = document.getElementById('shipment_id').value;
    try {
        const res = await fetch('/api/recall/recall_shipment', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ shipment_id })
        });
        if (res.ok) {
            showNotification("Recall processed successfully.", "success");
            fetchAndRenderDefectiveShipments();
        } else {
            data = await res.json();
            showNotification(data.message, "error");
        }
    } catch (err) {
        showNotification("Recall failed.", "error");
    }
});

// --- Add Shipment Logic ---
document.getElementById('add-shipment-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const formData = {
        shipment_id: document.getElementById('add_shipment_id').value,
        batch_id: document.getElementById('add_batch_id').value,
        customer_name: document.getElementById('add_customer_name').value,
        delivery_date: document.getElementById('add_delivery_date').value,
        status: document.getElementById('add_status').value,
        supply_manager_id: user_id
    };
    try {
        const res = await fetch('/api/shipments/add', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        });
        if (res.ok) {
            showNotification("Shipment registered.", "success");
            this.reset();
            fetchAndRenderDefectiveShipments();
        }
    } catch (err) {
        showNotification("Registration failed.", "error");
    }
});

document.addEventListener('DOMContentLoaded', fetchAndRenderDefectiveShipments);
