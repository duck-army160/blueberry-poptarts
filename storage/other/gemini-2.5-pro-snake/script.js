document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const canvas = document.getElementById('game-canvas');
    const ctx = canvas.getContext('2d');
    const finalScoreDisplay = document.getElementById('final-score');
    const finalHighscoreDisplay = document.getElementById('final-highscore');
    const startScreen = document.getElementById('start-screen');
    const gameOverScreen = document.getElementById('game-over-screen');
    const startButton = document.getElementById('start-button');
    const restartButton = document.getElementById('restart-button');
    const gameContainer = document.getElementById('game-container');

    // Game Constants & Variables
    const gridCount = 21;
    const canvasBaseWidth = canvas.width;
    const canvasBaseHeight = canvas.height;
    const gridSize = canvasBaseWidth / gridCount;

    // Colors & Styles
    const snakeColor = '#6ab04c';
    const snakeHeadColor = '#4d8c3a'; // Slightly darker head
    const foodColor = '#f0932b';
    const gridLineColor = 'rgba(210, 218, 226, 0.05)';
    const scoreTextColor = '#ffffff';
    const scoreTextFont = `bold ${Math.round(gridSize * 0.7)}px 'Press Start 2P'`;
    const particleColors = ['#f0932b', '#ff5e57', '#f1c40f', '#ffffff', snakeColor, snakeHeadColor];

    // Game State Variables
    let snake, food, score, highscore, direction, nextDirection, gameLoopInterval, gameSpeed;
    let isGameRunning = false; // Tracks if main game logic should run
    let isGameOverAnimationRunning = false; // Tracks if the death animation is active
    let foodEatenSinceEffect;
    let activeParticles = []; // For food explosion
    let explodingSegments = []; // For snake death animation
    let gameOverAnimationId = null; // To store requestAnimationFrame ID

    // --- Particle Class (for food explosion) ---
    class Particle {
        // ... (keep the existing Particle class as is)
        constructor(x, y, color) {
            this.x = x;
            this.y = y;
            this.color = color;
            this.size = Math.random() * (gridSize * 0.4) + (gridSize * 0.1);
            const angle = Math.random() * Math.PI * 2;
            const speed = Math.random() * 4 + 1;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.lifespan = Math.random() * 60 + 30;
            this.gravity = 0.08;
            this.friction = 0.98;
        }

        update() {
            this.lifespan--;
            this.vy += this.gravity;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.x += this.vx;
            this.y += this.vy;
            this.size *= 0.97;
        }

        draw() {
            if (this.lifespan > 0 && this.size > 0.5) {
                ctx.fillStyle = this.color;
                ctx.globalAlpha = Math.max(0, this.lifespan / 60);
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size / 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
    } // --- End Particle Class ---

    // --- Exploding Snake Segment Class ---
    class ExplodingSegment {
        constructor(gridX, gridY, color, borderRadius) {
            this.x = gridX * gridSize; // Initial pixel X (center calculation needed for rotation)
            this.y = gridY * gridSize; // Initial pixel Y
            this.color = color;
            this.size = gridSize * 0.9; // Use the drawing size
            this.borderRadius = borderRadius * (this.size / (gridSize * 0.9)); // Adjusted radius

            // Center position for rotation
            this.centerX = this.x + gridSize / 2;
            this.centerY = this.y + gridSize / 2;

            // Physics properties
            const angle = Math.random() * Math.PI * 1.5 - Math.PI * 0.25; // Upward-ish explosion
            const speed = Math.random() * 4 + 2; // Initial speed
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
            this.gravity = 0.15; // Slightly stronger gravity
            this.friction = 0.99;
            this.rotation = (Math.random() - 0.5) * Math.PI; // Initial random rotation
            this.rotationSpeed = (Math.random() - 0.5) * 0.15; // Random rotation speed
            this.alpha = 1.0;
            this.fadeSpeed = 0.01 + Math.random() * 0.01; // Fade out speed (0.01-0.02)
        }

        update() {
            this.vy += this.gravity;
            this.vx *= this.friction;
            this.vy *= this.friction;
            this.centerX += this.vx;
            this.centerY += this.vy;
            this.rotation += this.rotationSpeed;
            this.alpha -= this.fadeSpeed; // Fade out
        }

        draw() {
            if (this.alpha <= 0) return;

            const drawX = this.centerX - this.size / 2;
            const drawY = this.centerY - this.size / 2;

            ctx.save(); // Save context state
            ctx.translate(this.centerX, this.centerY); // Move origin to center for rotation
            ctx.rotate(this.rotation); // Apply rotation
            ctx.globalAlpha = Math.max(0, this.alpha); // Apply fade
            ctx.fillStyle = this.color;

            // Draw the rounded rectangle centered around the new origin (0,0)
             const radius = this.borderRadius;
             const w = this.size;
             const h = this.size;
             const x = -w / 2; // Relative X
             const y = -h / 2; // Relative Y

             if (radius > 0 && ctx.roundRect) {
                 ctx.beginPath();
                 ctx.roundRect(x, y, w, h, radius);
                 ctx.fill();
             } else if (radius > 0) { // Fallback rounded rect drawing
                 ctx.beginPath();
                 ctx.moveTo(x + radius, y);
                 ctx.lineTo(x + w - radius, y);
                 ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
                 ctx.lineTo(x + w, y + h - radius);
                 ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
                 ctx.lineTo(x + radius, y + h);
                 ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
                 ctx.lineTo(x, y + radius);
                 ctx.quadraticCurveTo(x, y, x + radius, y);
                 ctx.closePath();
                 ctx.fill();
            } else { // Square (shouldn't happen with current snake draw)
                 ctx.fillRect(x, y, w, h);
            }

            ctx.restore(); // Restore context state (alpha, transform)
        }
    } // --- End ExplodingSegment Class ---

    // --- Initialization ---
    function initGame() {
        // Cancel any ongoing game over animation
        if (gameOverAnimationId) {
            cancelAnimationFrame(gameOverAnimationId);
            gameOverAnimationId = null;
        }
        isGameOverAnimationRunning = false;

        const startX = Math.floor(gridCount / 2);
        const startY = Math.floor(gridCount / 2);
        snake = [
            { x: startX, y: startY },
            { x: startX - 1, y: startY },
            { x: startX - 2, y: startY },
        ];

        score = 0;
        highscore = parseInt(localStorage.getItem('snakeHighscore_v4') || '0'); // Increment key if storage structure changes
        direction = { x: 1, y: 0 };
        nextDirection = { x: 1, y: 0 };
        gameSpeed = 130;
        isGameRunning = true; // Start the game
        foodEatenSinceEffect = 0;
        activeParticles = [];
        explodingSegments = []; // Clear death particles

        gameOverScreen.classList.add('hidden');
        startScreen.classList.add('hidden');
        gameContainer.classList.remove('shake');

        placeFood();

        if (gameLoopInterval) clearInterval(gameLoopInterval);
        gameLoopInterval = setInterval(gameLoop, gameSpeed);
        document.removeEventListener('keydown', handleKeyDown);
        document.addEventListener('keydown', handleKeyDown);
    }

    // --- Main Game Loop ---
    function gameLoop() {
        if (!isGameRunning) return; // Only run if game is active
        update();
        draw();
    }

    // --- Game Over Animation Loop ---
    function gameOverAnimationLoop() {
        // Clear canvas
        ctx.fillStyle = '#0f0f1a'; // Use the game background color
        ctx.fillRect(0, 0, canvasBaseWidth, canvasBaseHeight);

        drawGrid(); // Draw grid underneath

        // Update and draw exploding segments
        let activeSegmentCount = 0;
        for (let i = explodingSegments.length - 1; i >= 0; i--) {
            explodingSegments[i].update();
            explodingSegments[i].draw();
            if (explodingSegments[i].alpha > 0) {
                activeSegmentCount++;
            } else {
                explodingSegments.splice(i, 1); // Remove faded segments
            }
        }

         // Also draw any remaining food explosion particles
        for (let i = activeParticles.length - 1; i >= 0; i--) {
            activeParticles[i].update();
            activeParticles[i].draw();
            if (activeParticles[i].lifespan <= 0 || activeParticles[i].size <= 0.5) {
                activeParticles.splice(i, 1);
            } else {
                 activeSegmentCount++; // Keep animation going if food particles exist
            }
        }


        // Continue animation if segments are still visible
        if (activeSegmentCount > 0) {
            gameOverAnimationId = requestAnimationFrame(gameOverAnimationLoop);
        } else {
            // Animation finished
            isGameOverAnimationRunning = false;
            gameOverAnimationId = null;
            showGameOverScreen(); // Now show the final screen
        }
    }


    // --- Update Logic (Main Game) ---
    function update() {
        updateParticles(); // Update food explosion particles

        if (!isOppositeDirection(direction, nextDirection)) {
            direction = nextDirection;
        }

        const head = { ...snake[0] };
        head.x += direction.x;
        head.y += direction.y;

        // --- Collision Check ---
        if (isCollision(head)) {
            endGame(); // Trigger game over sequence
            return;    // Stop further updates in this frame
        }
        // --- End Collision Check ---

        snake.unshift(head);

        if (head.x === food.x && head.y === food.y) {
            score++;
            foodEatenSinceEffect++;

            const foodCenterX = food.x * gridSize + gridSize / 2;
            const foodCenterY = food.y * gridSize + gridSize / 2;

            triggerConfetti(foodCenterX, foodCenterY, 50);

            if (foodEatenSinceEffect >= 10) {
                createExplosion(foodCenterX, foodCenterY);
                triggerScreenShake();
                foodEatenSinceEffect = 0;
            }

            placeFood();
        } else {
            snake.pop();
        }
    }

    function updateParticles() {
        // Update only the food explosion particles here
        for (let i = activeParticles.length - 1; i >= 0; i--) {
            activeParticles[i].update();
            if (activeParticles[i].lifespan <= 0 || activeParticles[i].size <= 0.5) {
                activeParticles.splice(i, 1);
            }
        }
    }


    // --- Drawing Logic (Main Game) ---
    function draw() {
        // Clear canvas
        ctx.fillStyle = '#2c3e50';
        ctx.fillRect(0, 0, canvasBaseWidth, canvasBaseHeight);

        drawGrid();
        drawFood();
        drawSnake();
        drawParticles(); // Draw food explosion particles
        drawScore();
    }

    function drawRect(gridX, gridY, color, borderRadius = 0) {
        // ... (keep existing drawRect function as is)
        const x = gridX * gridSize;
        const y = gridY * gridSize;
        ctx.fillStyle = color;
        const size = gridSize;

        const drawSize = size * 0.9;
        const offset = (size - drawSize) / 2;
        const drawX = x + offset;
        const drawY = y + offset;
        const effectiveRadius = borderRadius * (drawSize / size);

        if (effectiveRadius > 0 && ctx.roundRect) {
             ctx.beginPath();
             ctx.roundRect(drawX, drawY, drawSize, drawSize, effectiveRadius);
             ctx.fill();
        } else if (effectiveRadius > 0) { // Fallback
             ctx.beginPath();
             ctx.moveTo(drawX + effectiveRadius, drawY);
             ctx.lineTo(drawX + drawSize - effectiveRadius, drawY);
             ctx.quadraticCurveTo(drawX + drawSize, drawY, drawX + drawSize, drawY + effectiveRadius);
             ctx.lineTo(drawX + drawSize, drawY + drawSize - effectiveRadius);
             ctx.quadraticCurveTo(drawX + drawSize, drawY + drawSize, drawX + drawSize - effectiveRadius, drawY + drawSize);
             ctx.lineTo(drawX + effectiveRadius, drawY + drawSize);
             ctx.quadraticCurveTo(drawX, drawY + drawSize, drawX, drawY + drawSize - effectiveRadius);
             ctx.lineTo(drawX, drawY + effectiveRadius);
             ctx.quadraticCurveTo(drawX, drawY, drawX + effectiveRadius, drawY);
             ctx.closePath();
             ctx.fill();
        } else { // Square
             ctx.fillRect(drawX, drawY, drawSize, drawSize);
        }
    }


    function drawGrid() {
        // ... (keep existing drawGrid function as is)
        ctx.strokeStyle = gridLineColor;
        ctx.lineWidth = 1;
        for (let i = 1; i < gridCount; i++) {
            // Vertical
            ctx.beginPath();
            ctx.moveTo(i * gridSize, 0);
            ctx.lineTo(i * gridSize, canvasBaseHeight);
            ctx.stroke();
            // Horizontal
            ctx.beginPath();
            ctx.moveTo(0, i * gridSize);
            ctx.lineTo(canvasBaseWidth, i * gridSize);
            ctx.stroke();
        }
    }


     function drawFood() {
         drawRect(food.x, food.y, foodColor, gridSize * 0.3);
    }

    function drawSnake() {
        snake.forEach((segment, index) => {
            const color = index === 0 ? snakeHeadColor : snakeColor;
            const radius = index === 0 ? gridSize * 0.25 : gridSize * 0.2;
            drawRect(segment.x, segment.y, color, radius);
        });
    }

    function drawParticles() {
        // Draw only food explosion particles here
        activeParticles.forEach(p => p.draw());
    }


    function drawScore() {
        // ... (keep existing drawScore function as is)
        ctx.fillStyle = scoreTextColor;
        ctx.font = scoreTextFont;
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.fillText(`SCORE: ${score}`, gridSize * 0.5, gridSize * 0.4);
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
    }


    // --- Collision & Food Logic ---
    function placeFood() {
        // ... (keep existing placeFood function as is)
         let newFoodPosition;
        do {
            newFoodPosition = {
                x: Math.floor(Math.random() * gridCount),
                y: Math.floor(Math.random() * gridCount)
            };
        } while (isSnakeSegment(newFoodPosition));
        food = newFoodPosition;
    }


    function isSnakeSegment(position) {
        // ... (keep existing isSnakeSegment function as is)
         return snake.some(segment => segment.x === position.x && segment.y === position.y);
    }


    function isCollision(head) {
        // ... (keep existing isCollision function as is)
        if (head.x < 0 || head.x >= gridCount || head.y < 0 || head.y >= gridCount) {
            return true; // Wall collision
        }
        for (let i = 1; i < snake.length; i++) {
            if (head.x === snake[i].x && head.y === snake[i].y) {
                return true; // Self collision
            }
        }
        return false;
    }


    function isOppositeDirection(dir1, dir2) {
        // ... (keep existing isOppositeDirection function as is)
        return dir1.x === -dir2.x && dir1.y === 0 || dir1.y === -dir2.y && dir1.x === 0;
    }


    // --- Game State Management ---

    function endGame() {
        if (!isGameRunning) return; // Prevent running multiple times

        console.log("Game Over - Starting Animation"); // Debug
        isGameRunning = false; // Stop main game logic
        clearInterval(gameLoopInterval);
        gameLoopInterval = null;
        document.removeEventListener('keydown', handleKeyDown);
        gameContainer.classList.remove('shake'); // Ensure shake stops

        // Create exploding segments from the current snake state
        explodingSegments = snake.map((segment, index) => {
            const color = index === 0 ? snakeHeadColor : snakeColor;
            const radius = index === 0 ? gridSize * 0.25 : gridSize * 0.2;
            return new ExplodingSegment(segment.x, segment.y, color, radius);
        });

        // Start the game over animation loop
        isGameOverAnimationRunning = true;
        if (gameOverAnimationId) cancelAnimationFrame(gameOverAnimationId); // Clear previous if any
        gameOverAnimationId = requestAnimationFrame(gameOverAnimationLoop);
    }

    function showGameOverScreen() {
         console.log("Animation Finished - Showing Game Over Screen"); // Debug
        // This runs *after* the animation is complete
        if (score > highscore) {
            highscore = score;
            localStorage.setItem('snakeHighscore_v4', highscore);
        }
        finalScoreDisplay.textContent = score;
        finalHighscoreDisplay.textContent = highscore;
        gameOverScreen.classList.remove('hidden'); // Show the HTML overlay
    }

    // --- Input Handling ---
    function handleKeyDown(event) {
         // Only process keys if the main game is running
        if (!isGameRunning) return;

        const acceptedKeys = ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd'];
        if (acceptedKeys.includes(event.key)) {
            event.preventDefault();
        } else {
            return;
        }

        const key = event.key;
        let requestedDirection = { ...nextDirection };

        switch (key) {
            case 'ArrowUp': case 'w':
                if (direction.y === 0) requestedDirection = { x: 0, y: -1 };
                break;
            case 'ArrowDown': case 's':
                if (direction.y === 0) requestedDirection = { x: 0, y: 1 };
                break;
            case 'ArrowLeft': case 'a':
                if (direction.x === 0) requestedDirection = { x: -1, y: 0 };
                break;
            case 'ArrowRight': case 'd':
                if (direction.x === 0) requestedDirection = { x: 1, y: 0 };
                break;
        }

        if (!isOppositeDirection(direction, requestedDirection)) {
            nextDirection = requestedDirection;
        }
    }

    // --- Special Effects ---

    function createExplosion(x, y) {
        // ... (keep existing createExplosion function as is)
        const particleCount = 30 + Math.floor(Math.random() * 15); // 30-45 particles
        for (let i = 0; i < particleCount; i++) {
            const color = particleColors[Math.floor(Math.random() * particleColors.length)];
            activeParticles.push(new Particle(x, y, color));
        }
    }


    function triggerConfetti(x, y, count = 100) {
        // ... (keep existing triggerConfetti function as is)
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = canvasRect.width / canvasBaseWidth;
        const scaleY = canvasRect.height / canvasBaseHeight;

        const viewportX = (canvasRect.left + x * scaleX) / window.innerWidth;
        const viewportY = (canvasRect.top + y * scaleY) / window.innerHeight;


        confetti({
            particleCount: count,
            spread: 70,
            origin: { x: viewportX, y: viewportY },
            colors: particleColors // Use same color theme
        });
    }


    function triggerScreenShake() {
        // ... (keep existing triggerScreenShake function as is)
        gameContainer.classList.remove('shake');
        void gameContainer.offsetWidth; // Force reflow
        gameContainer.classList.add('shake');

        setTimeout(() => {
            // Check if game is still running before removing shake,
            // avoids removing during game over animation if it was triggered right at the end
            if (isGameRunning && gameContainer.classList.contains('shake')) {
                 gameContainer.classList.remove('shake');
            }
        }, 350);
    }


    // --- Event Listeners & Initial Setup ---
    startButton.addEventListener('click', initGame);
    restartButton.addEventListener('click', initGame);

    // Show start screen initially
    startScreen.classList.remove('hidden');
    gameOverScreen.classList.add('hidden');

}); // End DOMContentLoaded