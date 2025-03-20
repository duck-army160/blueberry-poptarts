import config from './config.js';

const gameBoard = document.getElementById('game-board');
const scoreDisplay = document.getElementById('score');
const gameOverScreen = document.createElement('div');
gameOverScreen.id = 'game-over-screen';
const gameOverText = document.createElement('h1');
gameOverText.textContent = 'Game Over!';
const restartButton = document.createElement('button');
restartButton.textContent = 'Restart';
const backButton = document.createElement('button');
backButton.textContent = 'Back to Menu';

gameOverScreen.appendChild(gameOverText);
gameOverScreen.appendChild(restartButton);
gameOverScreen.appendChild(backButton);
document.body.appendChild(gameOverScreen);

let snake = [{ x: 8, y: 8 }];
let food = {
  x: Math.floor(Math.random() * 17) + 1,
  y: Math.floor(Math.random() * 17) + 1
};
let direction = { x: 0, y: 0 };
let gameInterval;
let score = 0;

restartButton.addEventListener('click', startGame);
backButton.addEventListener('click', () => {
  window.location.href = "https://duck-army160.github.io/blueberry-poptarts/other.html";
});

function startGame() {
  snake = [{ x: 8, y: 8 }];
  food = {
    x: Math.floor(Math.random() * 17) + 1,
    y: Math.floor(Math.random() * 17) + 1
  };
  direction = { x: 0, y: 0 };
  gameInterval = setInterval(update, config.gameSpeed);
  gameOverScreen.style.display = 'none';
  score = 0;
  updateScoreDisplay();
}

function update() {
  updateSnake();
  updateFood();
  if (isGameOver()) {
    clearInterval(gameInterval);
    gameOverScreen.style.display = 'flex';
    return;
  }
  draw();
}

function draw() {
  gameBoard.innerHTML = '';
  drawSnake();
  drawFood();
}

function drawSnake() {
  snake.forEach(segment => {
    const snakeElement = document.createElement('div');
    snakeElement.style.gridRowStart = segment.y;
    snakeElement.style.gridColumnStart = segment.x;
    snakeElement.classList.add('snake-body');
    gameBoard.appendChild(snakeElement);
  });
}

function drawFood() {
  const foodElement = document.createElement('div');
  foodElement.style.gridRowStart = food.y;
  foodElement.style.gridColumnStart = food.x;
  foodElement.classList.add('food');
  gameBoard.appendChild(foodElement);
}

function updateSnake() {
  const newHead = {
    x: snake[0].x + direction.x,
    y: snake[0].y + direction.y
  };

  snake.unshift(newHead);

  if (snake[0].x === food.x && snake[0].y === food.y) {
    food = {
      x: Math.floor(Math.random() * 17) + 1,
      y: Math.floor(Math.random() * 17) + 1
    };
    score += 10;
    updateScoreDisplay();
  } else {
    snake.pop();
  }
}

function updateFood() {
  if (snake[0].x === food.x && snake[0].y === food.y) {
    food = {
      x: Math.floor(Math.random() * 17) + 1,
      y: Math.floor(Math.random() * 17) + 1
    };
  }
}

function generateFood() {
  let newFoodPosition;
  while (newFoodPosition == null || onSnake(newFoodPosition)) {
    newFoodPosition = {
      x: Math.floor(Math.random() * 17) + 1,
      y: Math.floor(Math.random() * 17) + 1
    }
  }
  return newFoodPosition;
}

function onSnake(position, { ignoreHead = false } = {}) {
  return snake.some((segment, index) => {
    if (ignoreHead && index === 0) return false
    return segment.x === position.x && segment.y === position.y
  })
}

function isGameOver() {
  if (snake[0].x < 1 || snake[0].x > 17 || snake[0].y < 1 || snake[0].y > 17) {
    return true;
  }

  if (onSnake(snake[0], { ignoreHead: true })) {
    return true;
  }

  return false;
}

function updateScoreDisplay() {
  scoreDisplay.textContent = `Score: ${score}`;
}

window.addEventListener('keydown', e => {
  switch (e.key) {
    case 'w':
      if (direction.y !== 0) break;
      direction = { x: 0, y: -1 };
      break;
    case 's':
      if (direction.y !== 0) break;
      direction = { x: 0, y: 1 };
      break;
    case 'a':
      if (direction.x !== 0) break;
      direction = { x: -1, y: 0 };
      break;
    case 'd':
      if (direction.x !== 0) break;
      direction = { x: 1, y: 0 };
      break;
    case 'ArrowUp':
      if (direction.y !== 0) break;
      direction = { x: 0, y: -1 };
      break;
    case 'ArrowDown':
      if (direction.y !== 0) break;
      direction = { x: 0, y: 1 };
      break;
    case 'ArrowLeft':
      if (direction.x !== 0) break;
      direction = { x: -1, y: 0 };
      break;
    case 'ArrowRight':
      if (direction.x !== 0) break;
      direction = { x: 1, y: 0 };
      break;
  }
});

startGame();