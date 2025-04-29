// Wait for the DOM to be fully loaded before running the script
document.addEventListener('DOMContentLoaded', function() {

  const gameGrid = document.getElementById('game-grid');
  const searchInput = document.getElementById('searchInput');
  let allGames = []; // This variable will hold the full list of games fetched from JSON

  // Check if the necessary elements exist on this page
  if (!gameGrid || !searchInput) {
    console.error('Error: Required DOM elements (#game-grid or #searchInput) not found.');
    // Stop execution if elements are missing
    return;
  }

  // Path to your JSON file - ADJUST if your games.json is in a different folder (e.g., 'data/games.json')
  const jsonFilePath = 'games.json';

  // Function to display games in the grid (same as your original function)
  function displayGames(gameList) {
    gameGrid.innerHTML = ''; // Clear the current grid
    gameList.forEach((game, index) => {
      const gameItem = document.createElement('a');
      gameItem.className = 'game-item'; // Use your existing CSS class
      // Keep animation delay if your CSS uses it
      gameItem.style.animationDelay = `${index * 0.03}s`;
      gameItem.href = game.link;

      const gameImage = document.createElement('img');
      gameImage.src = game.img;
      gameImage.alt = game.name;

      const gameName = document.createElement('div');
      gameName.className = 'game-name'; // Use your existing CSS class
      gameName.textContent = game.name;

      gameItem.appendChild(gameImage);
      gameItem.appendChild(gameName);
      gameGrid.appendChild(gameItem);
    });
    // Update search input placeholder after displaying games
    searchInput.placeholder = `Search ${gameList.length} Gxmes...`;
  }

  // --- Fetch the JSON data ---
  fetch(jsonFilePath)
    .then(response => {
      // Check if the HTTP request was successful (status 200-299)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      // Parse the JSON data from the response body
      return response.json();
    })
    .then(gamesData => {
      // --- Data successfully loaded ---
      // Store the fetched data in our variable
      allGames = gamesData;

      // Sort the games alphabetically by name, just like your original script
      allGames.sort((a, b) => a.name.localeCompare(b.name));

      // Display all games initially using your existing display function
      displayGames(allGames);

      // Enable the search input now that games are loaded
      searchInput.disabled = false;

      // --- Add the search functionality ---
      searchInput.addEventListener('input', () => {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const filteredGames = allGames.filter(game =>
          // Check if the game name includes the search term (case-insensitive)
          game.name.toLowerCase().includes(searchTerm)
        );
        // Display the filtered list of games
        displayGames(filteredGames);
      });
    })
    .catch(error => {
      // --- Handle any errors during the fetch or parsing ---
      console.error('Error loading or parsing games data:', error);
      // Display an error message to the user in the grid
      gameGrid.innerHTML = '<p>Error loading games. Please try again later.</p>';
      // Update and disable the search input to indicate the error
      searchInput.placeholder = 'Error loading games';
      searchInput.disabled = true;
    });

}); // End of DOMContentLoaded listener