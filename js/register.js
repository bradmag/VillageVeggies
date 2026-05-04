document.getElementById('year').textContent = new Date().getFullYear();

const registerForm = document.getElementById('registerForm');
const $errors = document.getElementById('form-errors');

const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rePassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/;

function showError(msg) {
  $errors.textContent = msg;
  $errors.hidden = !msg;
}

registerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  showError('');

  const email = document.getElementById('register-email').value.trim();
  const password = document.getElementById('register-password').value;
  const confirm = document.getElementById('confirm-password').value;
  const name = document.getElementById('register-name').value.trim();
  const location = document.getElementById('register-address').value.trim();

  if (!name) return showError('Please enter your shop name.');
  if (!reEmail.test(email)) return showError('Please enter a valid email address.');
  if (!rePassword.test(password)) return showError('Password must be at least 8 characters and include uppercase, lowercase, and a special character.');
  if (password !== confirm) return showError('Passwords do not match.');

  try {
    const response = await fetch('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name, location })
    });

    if (!response.ok) {
      const error = await response.text();
      showError(`Registration failed: ${error}`);
      return;
    }

    window.location.href = '/dashboard.html';
  } catch (err) {
    showError(`An error occurred: ${err.message}`);
  }
});
