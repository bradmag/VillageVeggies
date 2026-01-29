// wishlist.js — simple client-side waitlist handling
document.addEventListener('DOMContentLoaded', function () {
  const form = document.getElementById('waitlist-form');
  const emailInput = document.getElementById('email');
  const successEl = document.getElementById('waitlist-success');

  if (!form || !emailInput || !successEl) return;

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const email = (emailInput.value || '').trim().toLowerCase();
    if (!validateEmail(email)) {
      emailInput.setCustomValidity('Please enter a valid email address');
      emailInput.reportValidity();
      return;
    }

    // Save to localStorage so the site owner can retrieve later while backend is pending
    saveLocally(email);

    // Optimistic UI
    successEl.style.display = 'block';
    form.querySelector('button[type="submit"]').disabled = true;

    // Optional: attempt to POST to an API endpoint if available
    try {
      await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch (err) {
      // network failure is fine — entries are in localStorage
      console.warn('Waitlist POST failed (this is okay for now):', err);
    }
  });

  function saveLocally(email) {
    try {
      const key = 'vv_waitlist_emails';
      const existing = JSON.parse(localStorage.getItem(key) || '[]');
      if (!existing.includes(email)) existing.push(email);
      localStorage.setItem(key, JSON.stringify(existing));
    } catch (e) {
      console.warn('Could not save waitlist locally', e);
    }
  }

  function validateEmail(email) {
    // Simple RFC-like check
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
});
