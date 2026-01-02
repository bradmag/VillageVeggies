<<<<<<< HEAD


document.addEventListener('DOMContentLoaded', async () => {

    const zipInput = document.getElementById('zip-code');
    const grid = document.getElementById('browse-crops-grid');

    let debounceTimer;

    async function fetchAndRender(zip) {
        if (!zip || isNaN(zip)) return;

        try {
            const res = await fetch(`/search?zip=${zip}`);
            const data = await res.json();
            renderListings(data);
            // Print out listings in renderListings(listings);
        } catch (err) {
            console.error('Error occured at:', err);
        }
    }

    zipInput.addEventListener('input', () => {
        clearTimeout(debounceTimer);
        
        const zipValue = parseInt(zipInput.value, 10);

        debounceTimer = setTimeout(() => {
            fetchAndRender(zipValue);
        }, 300);
    });

    try {
        const userInfo = await fetch(`/api/profile`);
        const data = await userInfo.json();
        const userZip = parseInt(data.user.zip, 10);

        zipInput.value = userZip;
        fetchAndRender(userZip);
    } catch (err) {
        console.error('Failed to preload user zip:', err);
    }

    function renderListings(listings){
        grid.innerHTML = '';

        if (listings.length === 0){
            grid.innerHTML = '<p>No results found</p>'; return;
        }    
        
        listings.array.forEach(element => {
            const card = document.createElement('div');
            card.className = 'crop-card';
            card.innerHTML = `
                <h3>${element.id}</h3>
                <p>Price: $${element.price}</p>
            `
        });
    }   
})
=======
// Helper function to create a simplified crop card for browse page
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

// Set footer year and load browse listings
document.addEventListener('DOMContentLoaded', async () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

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
          // Even if logout fails, redirect to login
          window.location.href = '/auth.html?mode=login';
        }
      } catch (error) {
        console.error('Error during logout:', error);
        // Redirect anyway
        window.location.href = '/auth.html?mode=login';
      }
    });
  }

  // Fetch browse listings from API
  try {
    const response = await fetch('/api/browse', {
      method: 'GET',
      credentials: 'include' // Important: include cookies for session
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = '/auth.html?mode=login';
        return;
      }
      
      // Try to get error message from response
      let errorMessage = `Failed to fetch listings (${response.status})`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
        } else {
          const text = await response.text();
          errorMessage = text || errorMessage;
        }
      } catch (e) {
        errorMessage = `Server error: ${response.status} ${response.statusText}`;
      }
      
      console.error('Browse API error:', errorMessage, 'Status:', response.status);
      throw new Error(errorMessage);
    }

    // Parse JSON response
    let data;
    try {
      data = await response.json();
    } catch (e) {
      console.error('Failed to parse JSON response:', e);
      throw new Error('Invalid response from server');
    }
    const listings = data.listings || [];

    // Populate crops grid
    const cropsGrid = document.getElementById('browse-crops-grid');
    if (cropsGrid) {
      // Clear any existing content
      cropsGrid.innerHTML = '';
      
      if (listings.length === 0) {
        // Show message if there are no crops
        const noCropsMsg = document.createElement('p');
        noCropsMsg.textContent = `No crops available in your area (ZIP: ${data.zip || 'N/A'}). Check back later!`;
        cropsGrid.appendChild(noCropsMsg);
      } else {
        // Create crop cards for each listing
        listings.forEach(listing => {
          const card = createBrowseCropCard(listing);
          cropsGrid.appendChild(card);
        });
      }
    }
  } catch (error) {
    console.error('Error loading browse listings:', error);
    // Show error message with more details
    const cropsGrid = document.getElementById('browse-crops-grid');
    if (cropsGrid) {
      const errorMsg = document.createElement('p');
      errorMsg.style.textAlign = 'center';
      errorMsg.style.padding = '2rem';
      errorMsg.style.color = '#991b1b';
      errorMsg.textContent = `Failed to load crops: ${error.message}. Please check the console for details.`;
      cropsGrid.innerHTML = '';
      cropsGrid.appendChild(errorMsg);
    }
  }
});
>>>>>>> origin/dev

