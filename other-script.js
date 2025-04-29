// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

  const itemGrid = document.getElementById('game-grid'); // Assuming the container still has id 'game-grid'
  const searchInput = document.getElementById('searchInput');
  let allItems = []; // This variable will hold the full list of items fetched from JSON

  // Check if the necessary elements exist on this page
  if (!itemGrid || !searchInput) {
    console.error('Error: Required DOM elements (#game-grid or #searchInput) not found.');
    // Stop execution if elements are missing
    return;
  }

  // Path to your JSON file for THIS list
  const jsonFilePath = 'other.json'; // <-- Updated path

  // Function to display items in the grid (uses the same logic and class names)
  function displayItems(itemList) {
    itemGrid.innerHTML = ''; // Clear the current grid
    itemList.forEach((item, index) => { // Changed 'game' to 'item' for clarity
      const itemElement = document.createElement('a');
      itemElement.className = 'game-item'; // Still using the 'game-item' class
      itemElement.style.animationDelay = `${index * 0.03}s`;
      itemElement.href = item.link;

      const itemImage = document.createElement('img');
      itemImage.src = item.img;
      itemImage.alt = item.name;

      const itemName = document.createElement('div');
      itemName.className = 'game-name'; // Still using the 'game-name' class
      itemName.textContent = item.name;

      itemElement.appendChild(itemImage);
      itemElement.appendChild(itemName);
      itemGrid.appendChild(itemElement);
    });
    // Update search input placeholder with the item count and specific text
    searchInput.placeholder = `Search ${itemList.length} Other Random Things...`; // <-- Updated text
  }

  // --- Fetch the JSON data ---
  fetch(jsonFilePath)
    .then(response => {
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.json();
    })
    .then(itemsData => { // Changed 'gamesData' to 'itemsData'
      // --- Data successfully loaded ---
      allItems = itemsData;

      // Sort the items alphabetically by name, just like your original script
      allItems.sort((a, b) => a.name.localeCompare(b.name));

      // Display all items initially
      displayItems(allItems); // Changed function call

      // Enable the search input now that items are loaded
      searchInput.disabled = false;
      searchInput.placeholder = `Search ${allItems.length} Other Random Things...`; // Set placeholder again after data loads

      // --- Add the search functionality ---
      searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filteredItems = allItems.filter(item => // Changed 'games' to 'items'
          item.name.toLowerCase().includes(searchTerm)
        );
        // Display the filtered list of items
        displayItems(filteredItems); // Changed function call
      });
    })
    .catch(error => {
      // --- Handle any errors ---
      console.error('Error loading or parsing items data:', error);
      itemGrid.innerHTML = '<p>Error loading items.</p>';
      searchInput.placeholder = 'Error loading items';
      searchInput.disabled = true;
    });

}); // End of DOMContentLoaded listener