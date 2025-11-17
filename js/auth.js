// ---- Tabs: minimal click wiring ----
const tabs = Array.from(document.querySelectorAll('.tab-button[role="tab"]'));
const panels = {
  "login-form": document.getElementById("login-form"),
  "register-form": document.getElementById("register-form"),
};
const registerForm = document.getElementById("registerForm");

const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rePassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/;
const reZip = /^\d{5}(-\d{4})?$/;

const $errors = document.getElementById('form-errors');
function showErrors(errorMsg) {
  $errors.textContent = errorMsg;
  $errors.hidden = !errorMsg;
}
function clearErrors() {
  showErrors(''); }

if (registerForm) {
  registerForm.addEventListener("submit", (e) => {
    e.preventDefault();
    // Here you can add your registration logic
    console.log("Front End Form Submitted");

    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value.trim();
    const confirm = document.getElementById("confirm-password").value.trim();
    const name = document.getElementById("register-name").value.trim();
    const zip = document.getElementById("register-zip").value.trim();
    const blurb = document.getElementById("register-blurb").value.trim();
    const contact = document.getElementById("register-contact").value.trim();

    if (!name) return showErrors("Please enter your name.");
    if (!reEmail.test(email)) return showError('Please enter a valid email address.');
    if (!rePassword.test(password)) return showErrors("Password must be at least 8 characters long and include uppercase, lowercase, and special character.");
    if (password !== confirm) return showErrors("Passwords do not match.");
    if (!reZip.test(zip)) return showErrors("Please enter a valid ZIP code (5 digits or AIP+4).");

    clearErrors();
    console.log('Front End Validation Passed!');
  });
}


function activateTab(tabEl) {
  // 1) Update tabs
  tabs.forEach((t) => {
    const isActive = t === tabEl;
    t.classList.toggle("active", isActive);
    t.setAttribute("aria-selected", String(isActive));
    t.setAttribute("tabindex", isActive ? "0" : "-1");
  });

  // 2) Update panels (use aria-controls from the clicked tab)
  const targetId = tabEl.getAttribute("aria-controls"); // 'login-form' or 'register-form'
  Object.entries(panels).forEach(([id, el]) => {
    if (!el) return;
    el.classList.toggle("active", id === targetId);
  });

  // 3) Keep focus on the active tab (good a11y feedback)
  tabEl.focus();
}

tabs.forEach((t) => t.addEventListener("click", () => activateTab(t)));
