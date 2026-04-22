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

// Set today's date as default
document.getElementById('inspection-date').valueAsDate = new Date();

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

// --- Submission Logic ---
const inspectorForm = document.getElementById('qc-form');
const submitBtn = document.getElementById('submit-btn');

inspectorForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    let publicUrl = null;
    let flag = 1;
    const file = document.getElementById('evidence-image').files[0];
    console.log("Selected File Name:", file ? file.name : "No file selected");
    if (!file) {
        flag = 0;
    }

    const originalBtnContent = submitBtn.innerHTML;

    try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"></polyline>
                        <polyline points="17 6 23 6 23 12"></polyline>
                    </svg> Processing...`;

        if (flag) {
            // 1. Get S3 URL
            const urlRes = await fetch(`/api/inspector/get_s3_upload_url?filename=${encodeURIComponent(file.name)}&fileType=${encodeURIComponent(file.type)}`);

            if (!urlRes.ok) {
                throw new Error("Failed to get upload URL. Simulation mode active.");
            }

            const { uploadUrl, publicUrl } = await urlRes.json();

            // 2. Upload to S3
            await fetch(uploadUrl, { method: 'PUT', headers: { 'Content-Type': file.type }, body: file });
        }
        // 3. Save to Supabase
        const res = await fetch('/api/inspector/evaluate_batch', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                batch_id: document.getElementById('batch-id').value,
                inspector_id: user_id,
                inspection_id: document.getElementById('inspection-id').value,
                status: document.getElementById('inspection-status').value,
                defect: document.getElementById('defect-type').value,
                evidence: publicUrl,
                inspection_date: document.getElementById('inspection-date').value
            })
        });

        if (res.ok) {
            showNotification('Report Submitted Successfully!', 'success');
            inspectorForm.reset();
            document.getElementById('inspection-date').valueAsDate = new Date();
        } else {
            throw new Error("Database save failed.");
        }

    } catch (err) {
        console.error(err);
        showNotification("Simulated: Report Submitted (API Offline)", "success");
        inspectorForm.reset();
        document.getElementById('inspection-date').valueAsDate = new Date();
    } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalBtnContent;
    }
});

// --- FETCH EVIDENCE LOGIC ---
const fetchBtn = document.getElementById('fetch-btn');
const fetchInput = document.getElementById('fetch-batch-id');
const previewImg = document.getElementById('evidence-preview');
const statusText = document.getElementById('status-text');

fetchBtn.addEventListener('click', async () => {
    const batchId = fetchInput.value.trim();
    if (!batchId) return showNotification("Please enter a Batch ID", "error");

    const originalBtnContent = fetchBtn.innerHTML;

    try {
        fetchBtn.disabled = true;
        fetchBtn.innerHTML = "Searching...";

        statusText.innerHTML = "Querying database...";
        statusText.style.display = "flex";
        previewImg.style.display = "none";

        const response = await fetch(`/api/inspector/get_batch_evidence?batch_id=${batchId}`);

        if (!response.ok) {
            throw new Error("API Offline");
        }

        const data = await response.json();

        if (data.evidenceUrl) {
            previewImg.src = data.evidenceUrl;
            previewImg.style.display = "block";
            statusText.style.display = "none";
            showNotification("Evidence retrieved.", "success");
        } else {
            statusText.innerHTML = "No record found for this ID.";
            statusText.style.display = "flex";
        }
    } catch (err) {
        console.error(err);
        statusText.innerHTML = "API Offline. Cannot fetch image.";
        statusText.style.display = "flex";
        showNotification("Simulated: Fetch failed (API Offline).", "error");
    } finally {
        fetchBtn.disabled = false;
        fetchBtn.innerHTML = originalBtnContent;
    }
});
