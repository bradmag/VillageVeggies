// ---- Tabs: minimal click wiring ----
const tabs = Array.from(document.querySelectorAll('.tab-button[role="tab"]'));
const panels = {
  "login-form": document.getElementById("login-form"),
  "register-form": document.getElementById("register-form"),
};
const formReg = document.getElementById("registerForm");

if (formReg) {
  formReg.addEventListener("submit", (e) => {
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
