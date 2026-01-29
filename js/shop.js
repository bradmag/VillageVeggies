document.addEventListener('DOMContentLoaded', () => {
  const shopNameEl = document.getElementById('shop-name');
  const shopAddressEl = document.getElementById('shop-address');
  const shopUpdatedTimeEl = document.querySelector('#shop-updated time');
  const inventoryGrid = document.getElementById('inventory-grid');

  const shopId = getShopIdFromPath() || new URLSearchParams(window.location.search).get('shopId');

  if (!shopId) {
    shopNameEl.textContent = 'Unknown shop';
    inventoryGrid.innerHTML = '<p class="form-note">No shop id specified in the URL.</p>';
    return;
  }

  loadShop(shopId).catch(err => {
    console.error(err);
    inventoryGrid.innerHTML = `<p class="form-note">Unable to load inventory. ${escapeHtml(err.message)}</p>`;
  });

  async function loadShop(id) {
    inventoryGrid.innerHTML = '<p class="form-note">Loading inventory…</p>';

    // Primary endpoint that should return { shop: {...}, inventory: [...] }
    let resp = await fetch(`/api/shops/${encodeURIComponent(id)}`);
    if (resp.status === 404) {
      // Try a fallback inventory-only endpoint
      resp = await fetch(`/api/shops/${encodeURIComponent(id)}/inventory`);
      if (!resp.ok) throw new Error('Shop not found');
      const items = await resp.json();
      renderShop({}, items);
      return;
    }

    if (!resp.ok) throw new Error('Failed to fetch shop data');
    const payload = await resp.json();

    const shop = payload.shop || payload;
    const inventory = payload.inventory || payload.items || [];
    renderShop(shop, inventory);
  }

  function renderShop(shop = {}, items = []) {
    shopNameEl.textContent = shop.name || 'Plant Shop';
    shopAddressEl.textContent = shop.address || '';
    const updated = shop.updatedAt || shop.lastUpdated || shop.inventoryUpdated;
    if (updated) {
      const d = new Date(updated);
      if (!isNaN(d)) {
        shopUpdatedTimeEl.textContent = readableDate(d);
        shopUpdatedTimeEl.setAttribute('datetime', d.toISOString());
      }
    }

    inventoryGrid.innerHTML = '';
    if (!items || items.length === 0) {
      inventoryGrid.innerHTML = '<p class="form-note">No items available right now.</p>';
      return;
    }

    for (const it of items) {
      const card = document.createElement('div');
      card.className = 'step-card';

      const title = document.createElement('h3');
      title.textContent = it.name || it.title || 'Plant';
      card.appendChild(title);

      if (it.shortDescription || it.description) {
        const p = document.createElement('p');
        p.textContent = it.shortDescription || it.description;
        card.appendChild(p);
      }

      inventoryGrid.appendChild(card);
    }
  }

  function getShopIdFromPath() {
    // supports /shop/:shopId.html or /shop/:shopId
    const p = window.location.pathname;
    const parts = p.split('/').filter(Boolean);
    if (parts.length === 0) return null;
    const last = parts[parts.length - 1];
    // shopId.html -> shopId
    const m = last.match(/^(.+)\.html$/i);
    return m ? m[1] : (parts[parts.length - 1] === 'shop' ? null : parts[parts.length - 1]);
  }

  function readableDate(d) {
    return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);
  }
});
