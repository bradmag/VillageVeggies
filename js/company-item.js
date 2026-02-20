document.addEventListener("DOMContentLoaded", async () => {
    const grid = document.querySelector(".admin-inventory-grid");
    const form = document.getElementById("inventory-form");
    const cancelBtn = document.getElementById("cancel-edit");
    const editLabel = document.getElementById("edit-label");

    cancelBtn.addEventListener("click", () => {
        form.reset();                               // Clear inputs
        delete form.dataset.editingId;              // Exit edit mode
        editLabel.textContent = "";                 // Clear the "Editing label"
        form.querySelector("button[type='submit']").textContent = "Add Item"; 
    })

    // --- Handle item deletion
    grid.addEventListener("click", async (e) => {
        if (e.target.classList.contains("delete-item")) {
            const button = e.target;
            const itemId = button.dataset.id;

            try {
                const response = await fetch(`/api/inventory/${itemId}`, {
                    method: "DELETE"
                });

                if (!response.ok) throw new Error("Failed to delete item");

                // Remove item from UI
                const card = button.closest(".admin-inventory-card");
                card.remove();

                console.log(`Item ${itemId} deleted`);
            } catch (err) {
                console.error("Error deleting item:", err);
            }
        }
    })

    // --- Helper: render a single inventory card ---
    function renderItem(item) {
        const card = document.createElement("div");
        card.classList.add("admin-inventory-card");

        card.innerHTML = `
            <button class="delete-item" data-id="${item.id}">&times;</button>
            <div class="admin-inventory-card-details">
                <p class="admin-inventory-card-name">${item.name}</p>
                <p class="admin-inventory-card-availability">
                    ${item.availability ? "In Stock" : "Out of Stock"}
                </p>
                <p class="admin-inventory-card-quantity">
                    Quantity: ${item.quantity ?? 0}
                </p>
                <p class="admin-inventory-card-price">
                    ${item.price_range}
                </p>
            </div>
        `;

        grid.appendChild(card);
    }

    // --- Handle item click to edit ---
    grid.addEventListener("click", (e) => {
        if (e.target.classList.contains("delete-item")) return;

        const card = e.target.closest(".admin-inventory-card");
        if (!card) return;

        const itemId = card.querySelector(".delete-item").dataset.id;
        const name = card.querySelector(".admin-inventory-card-name").textContent;
        const quantityText = card.querySelector(".admin-inventory-card-quantity").textContent;
        const quantity = Number(quantityText.replace("Quantity: ", "").trim());
        const price_range = card.querySelector(".admin-inventory-card-price").textContent;
        const availabilityText = card.querySelector(".admin-inventory-card-availability").textContent;
        const availability = availabilityText

        // populate form
        document.getElementById("inventory-item").value = name;
        document.getElementById("quantity").value = quantity;
        document.getElementById("price-range").value = price_range;
        document.getElementById("availability-type").value = availability;

        // mark form as editing
        form.dataset.editingId = itemId;
        
        editLabel.textContent = `Editing: ${name}`
        const submitButton = form.querySelector("button[type='submit']");
        submitButton.textContent = "Update Item";
    })

    // --- Load all items on page load ---
    async function loadInventory() {
        try {
            const response = await fetch("/api/inventory");
            if (!response.ok) throw new Error("Failed to fetch inventory");
            const items = await response.json();

            grid.innerHTML = ""; // clear grid
            items.forEach(renderItem);
        } catch (err) {
            console.error("Error loading inventory:", err);
        }
    }

    await loadInventory(); // initial load

    // --- Handle form submission to add new item ---
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("inventory-item").value;
        const availValue = document.getElementById("availability-type").value;
        const quantity = Number(document.getElementById("quantity").value);
        const price_range = document.getElementById("price-range").value;
        const availability = availValue === "in-stock" || availValue === "low-stock";
        
        const editingId = form.dataset.editingId;

        try {
            let response;
            
            if (editingId){
                // PATCH to update existing item
                response = await fetch(`/api/inventory/update/${editingId}`, {
                    method: "PATCH",
                    headers: {"Content-Type": "application/json"}, 
                    body: JSON.stringify({ name, availability, quantity, price_range })
                });

                delete form.dataset.editingId;
                editLabel.textContent = "";
                const submitButton = form.querySelector("button[type='submit']");
                submitButton.textContent = "Add Item";

            } else {
                // POST to add new item
                response = await fetch("/api/inventory/add", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, availability, quantity, price_range })
                });
            }
            

            if (!response.ok) throw new Error("Failed to add item");
            const savedItem = await response.json();

            if (editingId) {
                // update existing card in DOM
                const card = grid.querySelector(`.delete-item[data-id='${editingId}']`).closest(".admin-inventory-card");
                card.querySelector(".admin-inventory-card-name").textContent = savedItem.name;
                card.querySelector(".admin-inventory-card-availability").textContent = savedItem.availability ? "In Stock" : "Out of Stock";
                card.querySelector(".admin-inventory-card-quantity").textContent = `Quantity: ${savedItem.quantity}`;
                card.querySelector(".admin-inventory-card-price").textContent = savedItem.price_range;

                delete form.dataset.editingId; // clear editing flag
            } else {
                renderItem(savedItem);
            }

            form.reset();

        } catch (err) {
            console.error("Error adding inventory:", err);
        }
    });
});
