document.getElementById('year').textContent = new Date().getFullYear();

const shopName      = document.getElementById('shop-name');
const shopLocation  = document.getElementById('shop-location');
const inventoryGrid  = document.getElementById('inventory-grid');
const inventoryEmpty = document.getElementById('inventory-empty');
const editSection   = document.getElementById('edit-section');
const editHeading   = document.getElementById('edit-heading');
const editName      = document.getElementById('edit-name');
const nameFieldGroup = document.getElementById('name-field-group');
const editPrice     = document.getElementById('edit-price');
const editQty       = document.getElementById('edit-quantity');
const editAvail     = document.getElementById('edit-availability');
const editMessage   = document.getElementById('edit-message');
const editForm      = document.getElementById('editForm');
const deleteBtn     = document.getElementById('delete-item-btn');
const closeEditBtn  = document.getElementById('close-edit-btn');
const signOutBtn    = document.getElementById('sign-out-btn');
const addItemBtn    = document.getElementById('add-item-btn');

let selectedItemId = null;
let selectedCard   = null;
let mode           = 'edit'; // 'edit' | 'add'

// ---- Auth check + load profile ----
async function loadProfile() {
  const res = await fetch('/api/dashboard/profile', { credentials: 'include' });
  if (res.status === 401 || res.status === 403) {
    window.location.href = '/login.html';
    return;
  }
  const shop = await res.json();
  shopName.textContent     = shop.name;
  shopLocation.textContent = shop.location;
}

// ---- Load inventory ----
async function loadInventory() {
  const res = await fetch('/api/dashboard/inventory/items', { credentials: 'include' });
  if (!res.ok) return;
  const items = await res.json();

  inventoryGrid.innerHTML = '';
  inventoryEmpty.hidden = items.length > 0;

  items.forEach(item => {
    const card = document.createElement('div');
    card.className = 'inventory-card';
    card.setAttribute('role', 'listitem');
    card.dataset.id = item.id;

    const stockClass = item.availability ? 'in-stock' : 'out-of-stock';
    const stockLabel = item.availability ? 'In Stock' : 'Out of Stock';
    const qty = item.quantity != null ? `Qty: ${item.quantity}` : '';

    card.innerHTML = `
      <h3>${item.name}</h3>
      <p class="item-price">${item.price_range || '—'}</p>
      ${qty ? `<p class="item-qty">${qty}</p>` : ''}
      <span class="stock-badge ${stockClass}">${stockLabel}</span>
    `;

    card.addEventListener('click', () => openEditMode(card, item));
    inventoryGrid.appendChild(card);
  });
}

// ---- Open edit mode for an existing item ----
function openEditMode(card, item) {
  mode = 'edit';
  if (selectedCard) selectedCard.classList.remove('selected');
  selectedCard = card;
  card.classList.add('selected');

  selectedItemId = item.id;
  editHeading.textContent = `Edit — ${item.name}`;
  nameFieldGroup.hidden = false;
  editName.value    = item.name;
  editName.required = false; // name already exists; only send if changed
  editPrice.value   = item.price_range || '';
  editQty.value     = item.quantity != null ? item.quantity : '';
  editAvail.checked = item.availability;
  deleteBtn.hidden  = false;
  clearMessage();

  editSection.hidden = false;
  editSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

// ---- Open add mode ----
function openAddMode() {
  mode = 'add';
  if (selectedCard) selectedCard.classList.remove('selected');
  selectedCard = null;
  selectedItemId = null;

  editHeading.textContent = 'Add New Item';
  nameFieldGroup.hidden = false;
  editName.value    = '';
  editName.required = true;
  editPrice.value   = '';
  editQty.value     = '';
  editAvail.checked = true;
  deleteBtn.hidden  = true;
  clearMessage();

  editSection.hidden = false;
  editSection.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function clearMessage() {
  editMessage.textContent = '';
  editMessage.className = 'edit-message';
}

// ---- Close edit/add panel ----
closeEditBtn.addEventListener('click', () => {
  editSection.hidden = true;
  if (selectedCard) selectedCard.classList.remove('selected');
  selectedCard = null;
  selectedItemId = null;
});

// ---- Add Item button ----
addItemBtn.addEventListener('click', openAddMode);

// ---- Form submit (save changes or add new item) ----
editForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  clearMessage();

  const price    = editPrice.value.trim() || null;
  const qty      = editQty.value !== '' ? parseInt(editQty.value, 10) : null;
  const avail    = editAvail.checked;

  if (mode === 'add') {
    const name = editName.value.trim();
    if (!name) { showMessage('Plant name is required.', 'error'); return; }

    const res = await fetch('/api/dashboard/inventory/items', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, price_range: price, quantity: qty, availability: avail })
    });

    if (!res.ok) {
      const text = await res.text();
      showMessage(`Error: ${text}`, 'error');
      return;
    }

    const newItem = await res.json();
    await loadInventory();
    editSection.hidden = true;

    // Select the newly created card
    const newCard = inventoryGrid.querySelector(`[data-id="${newItem.id}"]`);
    if (newCard) {
      selectedCard = newCard;
      newCard.classList.add('selected');
    }

  } else {
    const name = editName.value.trim() || null;

    const res = await fetch(`/api/dashboard/inventory/items/${selectedItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ name, price_range: price, quantity: qty, availability: avail })
    });

    if (!res.ok) {
      const text = await res.text();
      showMessage(`Error: ${text}`, 'error');
      return;
    }

    showMessage('Saved.', 'success');
    const savedId = selectedItemId;
    await loadInventory();

    const updatedCard = inventoryGrid.querySelector(`[data-id="${savedId}"]`);
    if (updatedCard) {
      updatedCard.classList.add('selected');
      selectedCard = updatedCard;
    }
  }
});

// ---- Delete item ----
deleteBtn.addEventListener('click', async () => {
  if (!selectedItemId) return;
  if (!confirm('Delete this item? This cannot be undone.')) return;

  const res = await fetch(`/api/dashboard/inventory/items/${selectedItemId}`, {
    method: 'DELETE',
    credentials: 'include'
  });

  if (!res.ok) {
    const text = await res.text();
    showMessage(`Error: ${text}`, 'error');
    return;
  }

  editSection.hidden = true;
  selectedCard = null;
  selectedItemId = null;
  await loadInventory();
});

// ---- Sign out ----
signOutBtn.addEventListener('click', async () => {
  await fetch('/auth/logout', { method: 'POST', credentials: 'include' });
  window.location.href = '/login.html';
});

function showMessage(text, type) {
  editMessage.textContent = text;
  editMessage.className = `edit-message ${type}`;
}

// ---- Init ----
loadProfile();
loadInventory();
