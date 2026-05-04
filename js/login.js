document.getElementById('year').textContent = new Date().getFullYear();

const loginForm = document.getElementById('loginForm');

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value;
  const errorEl = document.getElementById('login-error');

  errorEl.textContent = '';

  if (!email || !password) {
    errorEl.textContent = 'Please enter both email and password.';
    return;
  }

  try {
    const response = await fetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const text = await response.text();
      errorEl.textContent = `Login failed: ${text}`;
      return;
    }

    window.location.href = '/dashboard.html';
  } catch (err) {
    errorEl.textContent = `An error occurred: ${err.message}`;
  }
});
