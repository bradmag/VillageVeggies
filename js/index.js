// Set current year in footer
document.addEventListener('DOMContentLoaded', function() {
    const yearElement = document.getElementById('year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }
    // Load shops for the homepage
    loadShops();
});

async function loadShops() {
    const grid = document.getElementById('shops-grid');
    if (!grid) return;
    grid.innerHTML = '<p class="form-note">Loading shops…</p>';
    try {
        const res = await fetch('/api/index/shops');
        if (!res.ok) throw new Error('Failed to fetch shops');
        const shops = await res.json();
        renderShops(grid, shops);
    } catch (err) {
        console.error(err);
        grid.innerHTML = `<p class="form-note">Unable to load shops. ${escapeHtml(err.message)}</p>`;
    }
}

function renderShops(container, shops) {
    container.innerHTML = '';
    if (!shops || shops.length === 0) {
        container.innerHTML = '<p class="form-note">No shops available.</p>';
        return;
    }
    for (const s of shops) {
        const card = document.createElement('article');
        card.className = 'step-card';

        const title = document.createElement('h3');
        const link = document.createElement('a');
        link.href = `/shop/${encodeURIComponent(s.id)}.html`;
        link.textContent = s.name || 'Shop';
        title.appendChild(link);

        const loc = document.createElement('p');
        loc.textContent = s.location || '';

        const updated = document.createElement('p');
        updated.className = 'shop-meta';
        if (s.inventory_updated_at) {
            updated.textContent = `Updated ${timeAgo(new Date(s.inventory_updated_at))}`;
        } else {
            updated.textContent = 'Not updated yet';
        }

        card.appendChild(title);
        card.appendChild(loc);
        card.appendChild(updated);

        container.appendChild(card);
    }
}

function timeAgo(date) {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes!==1?'s':''} ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours!==1?'s':''} ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} day${days!==1?'s':''} ago`;
    return date.toLocaleDateString();
}

function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"})[c]);
}

