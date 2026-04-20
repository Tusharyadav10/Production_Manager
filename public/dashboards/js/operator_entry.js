// Check for user data in storage and update header
try {
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (userObj && userObj.name) {
        document.getElementById('active-user-display').textContent = userObj.name;
    }
} catch (e) { /* default to Line Operator */ }

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
function handleLogout() {
    if (confirm("Are you sure you want to securely log out?")) {
        localStorage.clear();
        sessionStorage.clear();
        window.location.href = "/";
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

    const operator_id = document.getElementById('operator-id').value;
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