// Helper function to create a crop card element
function createCropCard(listing) {
  const card = document.createElement('a');
  card.href = `/view-crop.html?id=${listing.id}`;
  card.className = 'crop-card';
  
  // Title
  const title = document.createElement('h3');
  title.className = 'crop-title';
  title.textContent = listing.title || 'Untitled Crop';
  card.appendChild(title);
  
  // Price
  const price = document.createElement('div');
  price.className = 'crop-price';
  price.textContent = `Price: ${listing.price || 'Not specified'}`;
  card.appendChild(price);
  
  // Quantity
  const quantity = document.createElement('div');
  quantity.className = 'crop-description';
  quantity.textContent = `Quantity: ${listing.quantity || 'Not specified'}`;
  card.appendChild(quantity);
  
  // ZIP Code
  if (listing.zip) {
    const zip = document.createElement('div');
    zip.className = 'crop-zip';
    zip.textContent = `ZIP: ${listing.zip}`;
    card.appendChild(zip);
  }
  
  // Harvest Date
  if (listing.harvest_date) {
    const harvestDate = document.createElement('div');
    harvestDate.className = 'crop-date';
    const date = new Date(listing.harvest_date);
    harvestDate.textContent = `Harvest Date: ${date.toLocaleDateString()}`;
    card.appendChild(harvestDate);
  }
  
  // Status badge (if not active)
  if (listing.status && listing.status !== 'active') {
    const status = document.createElement('div');
    status.style.marginTop = '0.5rem';
    status.style.padding = '0.25rem 0.5rem';
    status.style.borderRadius = '4px';
    status.style.backgroundColor = '#fef2f2';
    status.style.color = '#991b1b';
    status.style.fontSize = '0.85rem';
    status.style.display = 'inline-block';
    status.textContent = listing.status.charAt(0).toUpperCase() + listing.status.slice(1);
    card.appendChild(status);
  }
  
  return card;
}

// Set footer year and load profile data
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

  // Fetch user profile data from API
  try {
    const response = await fetch('/api/profile', {
      method: 'GET',
      credentials: 'include' // Important: include cookies for session
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = '/auth.html?mode=login';
        return;
      }
      throw new Error('Failed to fetch profile');
    }

    const data = await response.json();
    const user = data.user;

    // Populate profile information
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileZip = document.getElementById('profile-zip');
    const profileBlurb = document.getElementById('profile-blurb');
    const profileContact = document.getElementById('profile-contact');

    if (profileName) profileName.textContent = user.name || '';
    if (profileEmail) profileEmail.textContent = user.email || '';
    if (profileZip) profileZip.textContent = user.zip || '';
    if (profileBlurb) profileBlurb.textContent = user.blurb || '';
    if (profileContact) profileContact.textContent = user.contact || '';

    // Populate crops grid with user's listings
    const cropsGrid = document.getElementById('crops-grid');
    if (cropsGrid) {
      const listings = data.listings || [];
      
      // Clear any existing content
      cropsGrid.innerHTML = '';
      
      if (listings.length === 0) {
        // Show message if there are no crops
        const noCropsMsg = document.createElement('p');
        noCropsMsg.textContent = 'No crops listed yet. Click "Add Crop" to get started!';
        noCropsMsg.style.textAlign = 'center';
        noCropsMsg.style.padding = '2rem';
        noCropsMsg.style.color = '#666';
        cropsGrid.appendChild(noCropsMsg);
      } else {
        // Create crop cards for each listing
        listings.forEach(listing => {
          const card = createCropCard(listing);
          cropsGrid.appendChild(card);
        });
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    // Redirect to login on error
    window.location.href = '/auth.html?mode=login';
  }
});

