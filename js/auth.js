// ---- Tabs: minimal click wiring ----
const tabs = Array.from(document.querySelectorAll('.tab-button[role="tab"]'));
const panels = {
  "login-form": document.getElementById("login-form"),
  "register-form": document.getElementById("register-form"),
};
const registerForm = document.getElementById("registerForm");
const loginForm = document.getElementById("loginForm");

const reEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const rePassword = /(?=.*[a-z])(?=.*[A-Z])(?=.*[^A-Za-z0-9]).{8,}/;
const reZip = /^\d{5}(-\d{4})?$/;

const $errors = document.getElementById('form-errors');

function showError(errorMsg) {
  $errors.textContent = errorMsg;
  $errors.hidden = !errorMsg;
}
function clearErrors() { showError(''); }


// ---- Register Form Submission ----
if (registerForm) {
  registerForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    // Here you can add your registration logic
    console.log("Front End Form Submitted");
    clearErrors();

    const email = document.getElementById("register-email").value.trim();
    const password = document.getElementById("register-password").value;
    const confirm = document.getElementById("confirm-password").value;
    const name = document.getElementById("register-name").value.trim();
    const zip = document.getElementById("register-zip").value.trim();
    const blurb = document.getElementById("register-blurb").value.trim();
    const contact = document.getElementById("register-contact").value.trim();

    if (!name) return showError("Please enter your name.");
    if (!reEmail.test(email)) return showError('Please enter a valid email address.');
    if (!rePassword.test(password)) return showError("Password must be at least 8 characters long and include uppercase, lowercase, and special character.");
    if (password !== confirm) return showError("Passwords do not match.");
    if (!reZip.test(zip)) return showError("Please enter a valid ZIP code (5 digits or ZIP+4).");

    clearErrors();
    const data = { email, password, name, zip, blurb, contact };
    console.log("Front End Validation Passed! Sending Data:", data);

    try {
      const response = await fetch('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    });

    if (!response.ok) {
      const error = await response.text();
      showError(`Registration failed: ${error}`);
      return;
    }

    const result = await response.json();
    console.log('Sucess:', result);
    window.location.href = '/auth.html?mode=login';
    } catch (error) {
      showError(`An error occurred: ${error.message}`);
    }
  }); 
}

// ---- Login Form Submission ----
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault(); 
    console.log("Login Form Submitted");

    const email = document.getElementById("login-email").value.trim();
    const password = document.getElementById("login-password").value;
    const errorE1 = document.getElementById("login-error");

    errorE1.textContent = '';

    if (!email || !passqword) {
      errorE1.textContent = 'Please enter both email and password.';
      return;
    }

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const text = await response.text();
        errorE1.textContent = `Login failed: ${text}`;
        return;
      }

      // successful login
      window.location.href = "/profile.html";

    } catch (error) {
      errorE1.textContent = `An error occurred: ${error.message}`;
      console.error('Error during login:', error);
    }
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
