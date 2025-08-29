const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// Game variables
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 80;
const BALL_SIZE = 14;
const PADDLE_MARGIN = 16;
const AI_SPEED = 3;

let player = {
    x: PADDLE_MARGIN,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0
};

let ai = {
    x: canvas.width - PADDLE_MARGIN - PADDLE_WIDTH,
    y: canvas.height / 2 - PADDLE_HEIGHT / 2,
    width: PADDLE_WIDTH,
    height: PADDLE_HEIGHT,
    score: 0
};

let ball = {
    x: canvas.width / 2 - BALL_SIZE / 2,
    y: canvas.height / 2 - BALL_SIZE / 2,
    size: BALL_SIZE,
    speed: 5,
    velX: 5,
    velY: 5
};

// Draw elements
function drawRect(x, y, w, h, color = "#fff") {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, w, h);
}

function drawCircle(x, y, r, color = "#fff") {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
}

function drawText(text, x, y, size = 32) {
    ctx.fillStyle = "#fff";
    ctx.font = `${size}px Arial`;
    ctx.fillText(text, x, y);
}

function resetBall() {
    ball.x = canvas.width / 2 - BALL_SIZE / 2;
    ball.y = canvas.height / 2 - BALL_SIZE / 2;
    // Randomize ball direction
    let angle = (Math.random() * Math.PI / 2) - (Math.PI / 4);
    let dir = Math.random() < 0.5 ? 1 : -1;
    ball.velX = dir * ball.speed * Math.cos(angle);
    ball.velY = ball.speed * Math.sin(angle);
}

// Collision detection
function collide(paddle, ball) {
    return (
        ball.x < paddle.x + paddle.width &&
        ball.x + ball.size > paddle.x &&
        ball.y < paddle.y + paddle.height &&
        ball.y + ball.size > paddle.y
    );
}

// Mouse control for left paddle
canvas.addEventListener('mousemove', function(evt) {
    const rect = canvas.getBoundingClientRect();
    let mouseY = evt.clientY - rect.top;
    // Center paddle on mouse
    player.y = mouseY - player.height / 2;
    // Prevent paddle from going offscreen
    if (player.y < 0) player.y = 0;
    if (player.y + player.height > canvas.height) player.y = canvas.height - player.height;
});

// AI paddle movement
function moveAI() {
    let target = ball.y + ball.size / 2 - ai.height / 2;
    if (ai.y + ai.height / 2 < ball.y + ball.size / 2 - 10) {
        ai.y += AI_SPEED;
    } else if (ai.y + ai.height / 2 > ball.y + ball.size / 2 + 10) {
        ai.y -= AI_SPEED;
    }
    // Clamp position
    if (ai.y < 0) ai.y = 0;
    if (ai.y + ai.height > canvas.height) ai.y = canvas.height - ai.height;
}

// Ball movement and collisions
function update() {
    // Move ball
    ball.x += ball.velX;
    ball.y += ball.velY;

    // Top & bottom collision
    if (ball.y <= 0 || ball.y + ball.size >= canvas.height) {
        ball.velY *= -1;
    }

    // Left paddle collision
    if (collide(player, ball)) {
        ball.x = player.x + player.width;
        ball.velX *= -1;
        // Add some randomness to bounce
        let collidePoint = (ball.y + ball.size/2) - (player.y + player.height/2);
        collidePoint = collidePoint / (player.height/2);
        let angle = collidePoint * (Math.PI/4);
        ball.velY = ball.speed * Math.sin(angle);
    }

    // Right paddle collision
    if (collide(ai, ball)) {
        ball.x = ai.x - ball.size;
        ball.velX *= -1;
        let collidePoint = (ball.y + ball.size/2) - (ai.y + ai.height/2);
        collidePoint = collidePoint / (ai.height/2);
        let angle = collidePoint * (Math.PI/4);
        ball.velY = ball.speed * Math.sin(angle);
    }

    // Left & right wall (score)
    if (ball.x <= 0) {
        ai.score++;
        resetBall();
    }
    if (ball.x + ball.size >= canvas.width) {
        player.score++;
        resetBall();
    }

    moveAI();
}

function render() {
    // Clear
    drawRect(0, 0, canvas.width, canvas.height, "#111");
    // Middle line
    for (let i = 0; i < canvas.height; i += 24) {
        drawRect(canvas.width / 2 - 2, i, 4, 16, "#333");
    }
    // Paddles
    drawRect(player.x, player.y, player.width, player.height, "#fff");
    drawRect(ai.x, ai.y, ai.width, ai.height, "#fff");
    // Ball
    drawRect(ball.x, ball.y, ball.size, ball.size, "#fff");
    // Scores
    drawText(player.score, canvas.width / 4, 40, 32);
    drawText(ai.score, 3 * canvas.width / 4, 40, 32);
}

function gameLoop() {
    update();
    render();
    requestAnimationFrame(gameLoop);
}

resetBall();
gameLoop();