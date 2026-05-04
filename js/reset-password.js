document.getElementById('year').textContent = new Date().getFullYear();

const loadingView = document.getElementById('loading-view');
const resetView = document.getElementById('reset-view');
const messageView = document.getElementById('message-view');
const messageText = document.getElementById('message-text');
const errorEl = document.getElementById('reset-error');

function showMessage(text) {
    loadingView.hidden = true;
    resetView.hidden = true;
    messageText.textContent = text;
    messageView.hidden = false;
}

const params = new URLSearchParams(window.location.search);
const token = params.get('token');

if (!token) {
    showMessage('This reset link is invalid or has expired.');
} else {
    // Validate the token before showing the form
    fetch(`/auth/reset-password/${encodeURIComponent(token)}`)
        .then(async (res) => {
            if (res.ok) {
                loadingView.hidden = true;
                resetView.hidden = false;
            } else {
                const data = await res.json().catch(() => ({}));
                showMessage(data.error || 'This reset link is invalid or has expired.');
            }
        })
        .catch(() => {
            showMessage('Could not validate your reset link. Please check your connection and try again.');
        });
}

const resetForm = document.getElementById('resetForm');

resetForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.textContent = '';

    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (newPassword !== confirmPassword) {
        errorEl.textContent = 'Passwords do not match.';
        return;
    }

    try {
        const res = await fetch(`/auth/reset-password/${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ newPassword, confirmPassword })
        });

        if (res.ok) {
            showMessage('Password updated successfully. You can now log in with your new password.');
        } else {
            const data = await res.json().catch(() => ({}));
            errorEl.textContent = data.error || 'Failed to update password. Please try again.';
        }
    } catch (err) {
        errorEl.textContent = 'A network error occurred. Please check your connection and try again.';
        console.error('Reset-password request failed:', err);
    }
});
