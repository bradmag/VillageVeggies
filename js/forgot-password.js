document.getElementById('year').textContent = new Date().getFullYear();

const forgotForm = document.getElementById('forgotForm');
const forgotView = document.getElementById('forgot-view');
const successView = document.getElementById('success-view');
const errorEl = document.getElementById('forgot-error');

forgotForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const email = document.getElementById('forgot-email').value.trim();

    try {
        await fetch('/auth/forgot-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
        });
    } catch (err) {
        // Network failure — still show the generic success view to avoid leaking info
        console.error('Forgot-password request failed:', err);
    }

    // Always show the generic success message regardless of server response
    forgotView.hidden = true;
    successView.hidden = false;
});
