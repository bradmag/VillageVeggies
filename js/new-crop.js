// Set footer year
document.addEventListener('DOMContentLoaded', () => {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }
});

const newCropForm = document.getElementById('newCropForm');
const $errors = document.getElementById('form-errors');

// Validation patterns
const reZip = /^\d{5}$/;

function showError(errorMsg) {
  $errors.textContent = errorMsg;
  $errors.hidden = !errorMsg;
}

function clearErrors() {
  showError('');
  // Clear individual field errors
  document.querySelectorAll('.error[data-for]').forEach(el => {
    el.textContent = '';
  });
}

function setFieldError(fieldName, errorMsg) {
  const errorEl = document.querySelector(`.error[data-for="${fieldName}"]`);
  if (errorEl) {
    errorEl.textContent = errorMsg;
  }
}

// Form submission handler
if (newCropForm) {
  newCropForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearErrors();

    // Collect form data
    const title = document.getElementById('crop-title').value.trim();
    const price = document.getElementById('crop-price').value.trim();
    const quantity = document.getElementById('crop-quantity').value.trim();
    const harvestDate = document.getElementById('crop-harvest-date').value;
    const zip = document.getElementById('crop-zip').value.trim();
    const growingMethod = document.getElementById('crop-growing-method').value.trim();
    const notes = document.getElementById('crop-notes').value.trim();

    // Validation
    let hasErrors = false;

    // Validate title
    if (!title) {
      setFieldError('title', 'Crop title is required.');
      hasErrors = true;
    }

    // Validate price
    if (!price) {
      setFieldError('price', 'Price is required.');
      hasErrors = true;
    }

    // Validate zip
    if (!zip) {
      setFieldError('zip', 'ZIP code is required.');
      hasErrors = true;
    } else if (!reZip.test(zip)) {
      setFieldError('zip', 'Please enter a valid 5-digit ZIP code.');
      hasErrors = true;
    }

    if (hasErrors) {
      showError('Please fix the errors above.');
      return;
    }

    // Prepare data object
    const data = {
      title,
      price,
      quantity: quantity || null,
      harvestDate: harvestDate || null,
      zip: parseInt(zip, 10),
      growingMethod: growingMethod || null,
      notes: notes || null
    };

    try {
      const response = await fetch('/api/crops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Important: include cookies for session
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Not authenticated, redirect to login
          window.location.href = '/auth.html?mode=login';
          return;
        }
        
        const error = await response.text();
        showError(`Failed to create crop: ${error}`);
        return;
      }

      const result = await response.json();
      console.log('Crop created successfully:', result);
      
      // Redirect to profile page on success
      window.location.href = '/profile.html';

    } catch (error) {
      console.error('Error creating crop:', error);
      showError(`An error occurred: ${error.message}`);
    }
  });
}

