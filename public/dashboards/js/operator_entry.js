let user_id = null;

async function loadBatches() {
    if (!user_id) return;

    try {
        const res = await fetch(`/api/operator/get_batches?operator_id=${user_id}`);
        const tbody = document.getElementById('batches-tbody');

        if (!res.ok) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: var(--danger);">Failed to load recent batches.</td></tr>';
            return;
        }

        const data = await res.json();
        const batches = data.batches || data || [];

        tbody.innerHTML = '';

        if (batches.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: var(--text-muted);">No recent batches found.</td></tr>';
            return;
        }

        batches.forEach(b => {
            const tr = document.createElement('tr');

            const dateObj = new Date(b.production_date);
            const formattedDate = isNaN(dateObj) ? b.production_date : dateObj.toLocaleDateString();

            tr.innerHTML = `
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--secondary);">${b.batch_id}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--secondary);">${b.product_id}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--secondary);">${b.quantity}</td>
                <td style="padding: 0.75rem 1rem; border-bottom: 1px solid var(--border); color: var(--secondary);">${formattedDate}</td>
            `;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error("Fetch batches error:", err);
        document.getElementById('batches-tbody').innerHTML = '<tr><td colspan="4" style="padding: 1rem; text-align: center; color: var(--danger);">Error connecting to server.</td></tr>';
    }
}

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

        loadBatches();

    } catch (err) {
        window.location.replace("/");
    }
}

checkAuth();

// Set today's date as default
document.getElementById('production-date').valueAsDate = new Date();

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

// --- Form Logic ---
const operatorForm = document.getElementById('production-form');

operatorForm.addEventListener('submit', async function (e) {
    e.preventDefault();

    const btn = operatorForm.querySelector('button');
    const originalText = btn.innerHTML;
    btn.innerHTML = 'Saving Data...';
    btn.style.opacity = '0.8';
    btn.disabled = true;

    const operator_id = user_id;
    const batch_id = document.getElementById('batch-id').value;
    const product_id = document.getElementById('product-id').value;
    const machine_id = document.getElementById('machine-id').value;
    const shift = document.getElementById('shift').value;
    const quantity = document.getElementById('quantity').value;
    const production_date = document.getElementById('production-date').value;

    try {
        setTimeout(async () => {
            const res = await fetch('/api/operator/log_batch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ batch_id, product_id, machine_id, operator_id, shift, quantity, production_date })
            });

            const data = await res.json();

            if (!res.ok) {
                showNotification(data.message || 'Failed to log batch.', 'error');
                operatorForm.reset();
                document.getElementById('production-date').valueAsDate = new Date();
            } else {
                showNotification(data.message || 'Batch logged successfully.', 'success');
                operatorForm.reset();
                document.getElementById('production-date').valueAsDate = new Date();

                loadBatches();
            }

            btn.innerHTML = originalText;
            btn.style.opacity = '1';
            btn.disabled = false;
        }, 600);

    } catch (err) {
        console.error(err);
        showNotification('Connection error. Please try again.', 'error');
        btn.innerHTML = originalText;
        btn.style.opacity = '1';
        btn.disabled = false;
    }
});
