// --- Notification System ---
function showNotification(message, type = 'info') {
    const container = document.getElementById('notification-container');

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;

    notification.innerHTML = `
                <span>${message}</span>
                <button class="notification-close" onclick="closeNotification(this.parentElement)">&times;</button>
            `;

    container.appendChild(notification);

    requestAnimationFrame(() => {
        setTimeout(() => notification.classList.add('show'), 10);
    });

    setTimeout(() => {
        closeNotification(notification);
    }, 10000);
}

function closeNotification(element) {
    if (!element) return;
    element.classList.remove('show');
    setTimeout(() => {
        if (element.parentElement) {
            element.remove();
        }
    }, 300);
}

// --- Mobile Menu Functionality ---
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const navLinks = document.getElementById('nav-links');

mobileMenuBtn.addEventListener('click', () => {
    mobileMenuBtn.classList.toggle('active');
    navLinks.classList.toggle('active');
});

function closeMobileMenu() {
    mobileMenuBtn.classList.remove('active');
    navLinks.classList.remove('active');
}

// --- Form Toggle Functionality ---
function toggleForm(target) {
    const loginForm = document.getElementById('login-form');
    const signupForm = document.getElementById('signup-form');

    if (target === 'signup') {
        loginForm.classList.add('hidden');
        signupForm.classList.remove('hidden');
    } else if (target === 'login') {
        signupForm.classList.add('hidden');
        loginForm.classList.remove('hidden');
    } else {
        loginForm.classList.toggle('hidden');
        signupForm.classList.toggle('hidden');
    }
}

// --- Form Submissions ---

// Login
const loginFormElement = document.querySelector('#login-submission-form');
loginFormElement.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    const btn = loginFormElement.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Logging in...';
    btn.style.opacity = '0.8';

    try {
        const res = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password })
        });

        const data = await res.json();

        if (data.redirect) {
            window.location.href = `/${data.user.role}/dashboard`;
        } else {
            showNotification(data.message || 'Login failed. Please check your credentials.', 'error');
        }
    } catch (err) {
        console.log('Login fetch error:', err);
        showNotification('Connection error. Please try again later.', 'error');
    } finally {
        btn.innerText = originalText;
        btn.style.opacity = '1';
    }
});

// Signup
const signupFormElement = document.querySelector('#signup-submission-form');
signupFormElement.addEventListener('submit', async function (e) {
    e.preventDefault();

    const formData = new FormData(this);
    const dataObj = Object.fromEntries(formData.entries());

    const btn = signupFormElement.querySelector('button');
    const originalText = btn.innerText;
    btn.innerText = 'Creating account...';
    btn.style.opacity = '0.8';

    try {
        const res = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dataObj)
        });

        const data = await res.json();

        // if (data.redirect) {
        //     window.location.href = `/${data.user.role}/dashboard`;
        // } else
        if (res.ok || data.success) {
            const success_msg = 'Account created successfully! Your user id: ' + data.user_id;
            showNotification(success_msg, 'success');
            toggleForm('login');
            this.reset();
        } else {
            showNotification(data.message || 'Signup failed. This email may already be in use.', 'error');
        }
    } catch (err) {
        console.log('Signup fetch error:', err);
        showNotification('Connection error. Please try again later.', 'error');
    } finally {
        btn.innerText = originalText;
        btn.style.opacity = '1';
    }
});

// Contact
document.querySelector('#contact-submission-form').addEventListener('submit', function (e) {
    e.preventDefault();
    showNotification('Thank you for reaching out. Our team will contact you shortly.', 'success');
    this.reset();
});
