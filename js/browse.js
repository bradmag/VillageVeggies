

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

