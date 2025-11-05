// ---- Tabs: minimal click wiring ----
const tabs = Array.from(document.querySelectorAll('.tab-button[role="tab"]'));
const panels = {
  'login-form': document.getElementById('login-form'),
  'register-form': document.getElementById('register-form')
};

function activateTab(tabEl) {
  // 1) Update tabs
  tabs.forEach(t => {
    const isActive = t === tabEl;
    t.classList.toggle('active', isActive);
    t.setAttribute('aria-selected', String(isActive));
    t.setAttribute('tabindex', isActive ? '0' : '-1');
  });

  // 2) Update panels (use aria-controls from the clicked tab)
  const targetId = tabEl.getAttribute('aria-controls'); // 'login-form' or 'register-form'
  Object.entries(panels).forEach(([id, el]) => {
    if (!el) return;
    el.classList.toggle('active', id === targetId);
  });

  // 3) Keep focus on the active tab (good a11y feedback)
  tabEl.focus();
}

tabs.forEach(t => t.addEventListener('click', () => activateTab(t)));

