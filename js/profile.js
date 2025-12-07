// Set footer year
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Mock profile data
  const mockProfile = {
    name: "Jane Doe",
    email: "jane@example.com",
    zip: "80202",
    blurb: "Backyard gardener growing tomatoes and herbs.",
    contact: "Text me at (555) 123-4567"
  };

  // Mock crops data
  const mockCrops = [
    { 
      id: 1, 
      name: "Tomatoes", 
      price: "$4/lb", 
      description: "Fresh and ripe.", 
      zip: "80202", 
      date: "2024-02-01" 
    },
    { 
      id: 2, 
      name: "Basil", 
      price: "$2/bundle", 
      description: "Picked this morning.", 
      zip: "80202", 
      date: "2024-02-03" 
    },
    { 
      id: 3, 
      name: "Lettuce", 
      price: "$3/head", 
      description: "Crisp and fresh from the garden.", 
      zip: "80202", 
      date: "2024-02-05" 
    },
    { 
      id: 4, 
      name: "Peppers", 
      price: "$5/lb", 
      description: "Mixed variety of bell peppers.", 
      zip: "80202", 
      date: "2024-02-07" 
    }
  ];

  // Populate profile information
  const profileName = document.getElementById('profile-name');
  const profileEmail = document.getElementById('profile-email');
  const profileZip = document.getElementById('profile-zip');
  const profileBlurb = document.getElementById('profile-blurb');
  const profileContact = document.getElementById('profile-contact');

  if (profileName) profileName.textContent = mockProfile.name;
  if (profileEmail) profileEmail.textContent = mockProfile.email;
  if (profileZip) profileZip.textContent = mockProfile.zip;
  if (profileBlurb) profileBlurb.textContent = mockProfile.blurb;
  if (profileContact) profileContact.textContent = mockProfile.contact;

  // Populate crops grid
  const cropsGrid = document.getElementById('crops-grid');
  if (cropsGrid) {
    mockCrops.forEach(crop => {
      const cropCard = document.createElement('a');
      cropCard.href = `crop.html?id=${crop.id}`;
      cropCard.className = 'crop-card';
      
      cropCard.innerHTML = `
        <h3 class="crop-title">${crop.name}</h3>
        <p class="crop-description">${crop.description}</p>
        <p class="crop-price">${crop.price}</p>
        <p class="crop-zip">ZIP: ${crop.zip}</p>
        <p class="crop-date">Posted: ${crop.date}</p>
      `;
      
      cropsGrid.appendChild(cropCard);
    });
  }
});

