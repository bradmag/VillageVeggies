// Set footer year
document.addEventListener('DOMContentLoaded', () => {
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
          window.location.href = '/auth.html?mode=login';
        }
      } catch (error) {
        console.error('Error during logout:', error);
        window.location.href = '/auth.html?mode=login';
      }
    });
  }

  // Get crop ID from URL query parameter
  const urlParams = new URLSearchParams(window.location.search);
  const cropId = urlParams.get('id');

  if (!cropId) {
    // Show error message and hide crop info section
    const errorMessage = document.getElementById('error-message');
    const cropInfoSection = document.getElementById('crop-info-section');
    if (errorMessage) errorMessage.hidden = false;
    if (cropInfoSection) cropInfoSection.hidden = true;
    return;
  }

  // Fetch crop details from API
  loadCropDetails(cropId);
});

// Function to load crop details from API
async function loadCropDetails(cropId) {
  try {
    const response = await fetch(`/api/crops/${cropId}`, {
      method: 'GET',
      credentials: 'include' // Important: include cookies for session
    });

    if (!response.ok) {
      if (response.status === 401) {
        // Not authenticated, redirect to login
        window.location.href = '/auth.html?mode=login';
        return;
      }
      
      // Show error message
      const errorMessage = document.getElementById('error-message');
      const cropInfoSection = document.getElementById('crop-info-section');
      if (errorMessage) {
        errorMessage.hidden = false;
        errorMessage.querySelector('p').textContent = 'Failed to load crop details.';
      }
      if (cropInfoSection) cropInfoSection.hidden = true;
      return;
    }

    const data = await response.json();
    const crop = data.crop;
    const grower = data.grower;

    // Populate crop information
    const cropNameEl = document.getElementById('crop-name');
    const cropPriceEl = document.getElementById('crop-price');
    const cropQuantityEl = document.getElementById('crop-quantity');
    const cropHarvestDateEl = document.getElementById('crop-harvest-date');
    const cropZipEl = document.getElementById('crop-zip');
    const cropGrowingMethodEl = document.getElementById('crop-growing-method');
    const cropDescriptionEl = document.getElementById('crop-description');
    const cropDateEl = document.getElementById('crop-date');

    if (cropNameEl) cropNameEl.textContent = crop.title || 'Untitled Crop';
    if (cropPriceEl) cropPriceEl.textContent = crop.price || 'Not specified';
    if (cropQuantityEl) cropQuantityEl.textContent = crop.quantity || 'Not specified';
    
    if (cropHarvestDateEl) {
      if (crop.harvestDate) {
        const date = new Date(crop.harvestDate);
        cropHarvestDateEl.textContent = date.toLocaleDateString();
      } else {
        cropHarvestDateEl.textContent = 'Not specified';
      }
    }
    
    if (cropZipEl) cropZipEl.textContent = crop.zip || 'Not specified';
    
    if (cropGrowingMethodEl) {
      cropGrowingMethodEl.textContent = crop.growingMethod || 'Not specified';
    }
    
    if (cropDescriptionEl) {
      cropDescriptionEl.textContent = crop.description || 'No description provided';
    }
    
    if (cropDateEl) {
      if (crop.createdAt) {
        const date = new Date(crop.createdAt);
        cropDateEl.textContent = date.toLocaleDateString();
      } else {
        cropDateEl.textContent = 'Not available';
      }
    }

    // Store crop ID for contact reveal
    const contactButton = document.getElementById('contact-grower-button');
    if (contactButton) {
      contactButton.addEventListener('click', () => {
        revealGrowerContact(cropId, grower);
      });
    }

    // Show crop info section and hide error
    const errorMessage = document.getElementById('error-message');
    const cropInfoSection = document.getElementById('crop-info-section');
    if (errorMessage) errorMessage.hidden = true;
    if (cropInfoSection) cropInfoSection.hidden = false;

  } catch (error) {
    console.error('Error loading crop details:', error);
    const errorMessage = document.getElementById('error-message');
    const cropInfoSection = document.getElementById('crop-info-section');
    if (errorMessage) {
      errorMessage.hidden = false;
      errorMessage.querySelector('p').textContent = 'An error occurred while loading crop details.';
    }
    if (cropInfoSection) cropInfoSection.hidden = true;
  }
}

// Function to reveal grower contact information
async function revealGrowerContact(cropId, grower) {
  try {
    const response = await fetch(`/api/crops/${cropId}/reveal-contact`, {
      method: 'POST',
      credentials: 'include'
    });

    if (!response.ok) {
      if (response.status === 401) {
        window.location.href = '/auth.html?mode=login';
        return;
      }
      
      const errorData = await response.json().catch(() => ({ error: 'Failed to reveal contact' }));
      alert(`Error: ${errorData.error || 'Failed to load contact information'}`);
      return;
    }

    const data = await response.json();
    const contactText = data.contactText || data.contact || 'Contact information not available';

    // Populate grower information
    const growerNameEl = document.getElementById('grower-name');
    const growerContactEl = document.getElementById('grower-contact');
    const growerZipEl = document.getElementById('grower-zip');
    const growerBlurbEl = document.getElementById('grower-blurb');
    const growerInfoSection = document.getElementById('grower-info-section');
    const contactButton = document.getElementById('contact-grower-button');

    if (growerNameEl) growerNameEl.textContent = grower.name || 'Not specified';
    if (growerContactEl) growerContactEl.textContent = contactText;
    if (growerZipEl) growerZipEl.textContent = grower.zip || 'Not specified';
    if (growerBlurbEl) growerBlurbEl.textContent = grower.blurb || 'No information provided';

    // Show grower info section and hide/disable contact button
    if (growerInfoSection) growerInfoSection.hidden = false;
    if (contactButton) {
      contactButton.disabled = true;
      contactButton.textContent = 'Contact Revealed';
    }

  } catch (error) {
    console.error('Error revealing contact:', error);
    alert('An error occurred while loading contact information.');
  }
}
