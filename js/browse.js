// Set footer year and load browse listings
document.addEventListener('DOMContentLoaded', async () => {
    const yearEl = document.getElementById('year');
    if (yearEl) {
        yearEl.textContent = new Date().getFullYear();
    }

    const zipInput = document.getElementById('zip-code');
    let debounceTimer;

    zipInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);

        const zipValue = parseInt(zipInput.value, 10);
        console.log(zipValue);

        debounceTimer = setTimeout(() => {
            fetchListing(zipValue);
        }, 100);
    });

    // Handle logout link
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', async (e) => {
        e.preventDefault();
        try {
            const response = await fetch('/auth/logout', {
            method: 'POST',
            credentials: 'include'
            });
            
            if (response.ok) {
            window.location.href = '/auth.html?mode=login';
            } else {
            window.location.href = '/auth.html?mode=login';
            }
        } catch (error) {
            console.error('Error during logout:', error);
            window.location.href = '/auth.html?mode=login';
        }
        });
    }

    try {
        const userInfo = await fetch(`/api/profile`);
        const data = await userInfo.json();
        const userZip = parseInt(data.user.zip, 10);
        fetchListing(userZip);
    } catch (err) {
        console.error('Failed to preload user zip:', err);
    }

  // Load user's ZIP code and initial listings
  try {
    const userInfo = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include'
    });
    
    if (!userInfo.ok) {
      if (userInfo.status === 401) {
        window.location.href = '/auth.html?mode=login';
        return;
      }
      throw new Error('Failed to fetch user info');
    }
    
    const data = await userInfo.json();
    const userZip = parseInt(data.user.zip, 10);
    
    if (zipInput && !isNaN(userZip)) {
      zipInput.value = userZip;
      fetchListing(userZip);
    }
  } catch (err) {
    console.error('Failed to preload user zip:', err);
  }
});
    

async function fetchListing(zip){
    if (!zip) return;

    try {
        const res = await fetch(`/api/browse?zip=${zip}`, {
            method: 'GET',
            credentials: 'include' // Important: include cookies for session
        });
        
        if (!res.ok) {
            if (res.status === 401) {
                window.location.href = '/auth.html?mode=login';
                return;
            }
            throw new Error(`Failed to fetch: ${res.status}`);
        }
        
        const data = await res.json();
        renderListings(data);
    } catch (err) {
        console.error('Error fetching listings:', err);
    }
}

function renderListings(data){
    const grid = document.getElementById('browse-crops-grid');
    grid.innerHTML = '';

    const listings = data.listings || [];

    if (listings.length === 0){
        const noCropsMsg = document.createElement('p');
        noCropsMsg.textContent = `No crops available in your area (ZIP: ${data.zip || 'N/A'}). Check back later!`;
        grid.appendChild(noCropsMsg);
    } else {
        listings.forEach(listing => {
        const card = createBrowseCropCard(listing);
        grid.appendChild(card);
        });
    }
}

function createBrowseCropCard(listing) {
    const card = document.createElement('a');
    card.href = `/view-crop.html?id=${listing.id}`;
    card.className = 'crop-card';
    
    // Title
    const title = document.createElement('h3');
    title.className = 'crop-title';
    title.textContent = listing.title || 'Untitled Crop';
    card.appendChild(title);
    
    // Price (simplified for browse - just the price)
    const price = document.createElement('div');
    price.className = 'crop-price';
    price.textContent = listing.price || 'Price not specified';
    card.appendChild(price);
    
    return card;
}
