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

    // Populate crops grid (will be empty until crops table is created)
    const cropsGrid = document.getElementById('crops-grid');
    if (cropsGrid) {
      // Crops will be loaded here once the crops table and API are implemented
      // For now, show a message if there are no crops
      if (cropsGrid.children.length === 0) {
        const noCropsMsg = document.createElement('p');
        noCropsMsg.textContent = 'No crops listed yet. Click "Add Crop" to get started!';
        noCropsMsg.style.textAlign = 'center';
        noCropsMsg.style.padding = '2rem';
        noCropsMsg.style.color = '#666';
        cropsGrid.appendChild(noCropsMsg);
      }
    }
  } catch (error) {
    console.error('Error loading profile:', error);
    // Redirect to login on error
    window.location.href = '/auth.html?mode=login';
  }
});

