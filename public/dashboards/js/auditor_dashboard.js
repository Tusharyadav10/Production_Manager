// Check for user data in storage and update header
try {
    const userObj = JSON.parse(localStorage.getItem('user'));
    if (userObj && userObj.name) {
        document.getElementById('active-user-display').textContent = userObj.name;
    }
} catch (e) { /* default to System Auditor */ }

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

// --- Fetch Logs from API ---
let logs = [];

async function fetchLogs() {
    try {
        const res = await fetch('/api/auditor/logs', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({})
        });

        if (!res.ok) throw new Error("API Offline");

        const data = await res.json();

        if (data.logs && data.logs.length > 0) {
            logs = data.logs;
            renderLogs(logs);
        } else {
            handleEmptyOrError("No audit logs found.");
        }
    } catch (err) {
        console.error("Log fetch error:", err);

        // Fallback Mock Data for UI demonstration
        logs = [
            { action_timestamp: "2026-04-15 08:30:12", user_id: "USR-001", action_taken: "PASS" },
            { action_timestamp: "2026-04-15 09:15:44", user_id: "USR-042", action_taken: "FAIL" },
            { action_timestamp: "2026-04-15 10:05:00", user_id: "USR-011", action_taken: "HALT" },
            { action_timestamp: "2026-04-15 11:22:30", user_id: "USR-005", action_taken: "LOGIN" },
            { action_timestamp: "2026-04-15 13:40:10", user_id: "USR-001", action_taken: "LOGOUT" }
        ];
        renderLogs(logs);
        showNotification("Simulated Data: API Offline", "error");
    }
}

const tableBody = document.getElementById('auditTableBody');

function handleEmptyOrError(message) {
    logs = [];
    tableBody.innerHTML = `<tr><td colspan="3" class="loading">${message}</td></tr>`;
}

function renderLogs(data) {
    tableBody.innerHTML = "";

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="3" class="loading">No matching logs found.</td></tr>`;
        return;
    }

    data.forEach(log => {
        const row = document.createElement('tr');


        const rawAction = String(log.action_taken || 'INFO');
        const actionLower = rawAction.toLowerCase();
        let statusClass = 'default';

        if (['pass', 'success', 'approved'].includes(actionLower)) statusClass = 'pass';
        else if (['fail', 'error', 'rejected', 'delete'].includes(actionLower)) statusClass = 'fail';
        else if (['halt', 'warning', 'suspend'].includes(actionLower)) statusClass = 'halt';

        row.innerHTML = `
                    <td class="timestamp">${log.action_timestamp}</td>
                    <td><strong>${log.user_id}</strong></td>
                    <td>
                        <span class="status ${statusClass}">
                            ${rawAction}
                        </span>
                    </td>
                `;
        tableBody.appendChild(row);
    });
}

function filterLogs() {
    const search = document.getElementById('searchInput').value.toLowerCase().trim();

    if (!search) {
        renderLogs(logs);
        return;
    }

    const filtered = logs.filter(log => {
        const userIdStr = String(log.user_id || '').toLowerCase();
        const actionStr = String(log.action_taken || '').toLowerCase();
        return userIdStr.includes(search) || actionStr.includes(search);
    });

    renderLogs(filtered);
}

// Initialize
fetchLogs();