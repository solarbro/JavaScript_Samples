const canvas = document.querySelector('#breakoutCanvas');
const ctx = canvas.getContext('2d');
const frameTime = 16; //locked 16ms per frame

//Containers
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
}

//Game state
//background 
var bgColor = new Color(0, 128, 64);
//ball
var ballSize = 10;
var ballPos = new Vec2(canvas.width / 2, canvas.height - 30);
var ballSpeed = 8; //pixels per frame
var ballDirection = normalize(new Vec2(1, -1));
var ballNeutralColor = new Color(0, 64, 128);
var ballColor = ballNeutralColor;
var randomColorOnBounce = true;
//----------

main();

//
// Game code
//
function main() {
    
    setInterval(draw, 16);
}

function draw() {
    //clear screen (No need since we draw a full screen background)
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    //Draw game scene
    drawScene();
    //Update game state
    updateGameState(frameTime);
}

function drawScene() {
    drawBackground();
    drawBall(ballPos, ballColor, ballSize);
}

function drawBall(pos, col, size) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, size, 0, Math.PI*2);
    ctx.fillStyle = rgbToHex(col);
    ctx.fill();
    ctx.closePath();
}

function drawBackground() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = rgbToHex(bgColor);
    ctx.fill();
    ctx.closePath();
}

function rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

function updateGameState(dt) {
    //Move ball
    ballPos = add(ballPos, mul(ballDirection, ballSpeed));
    //check for collisions
    detectCollision();
}

function detectCollision() {
    //detect ball against walls
    //If colliding, invert appropriate direction axis
    if(ballPos.y < ballSize || ballPos.y > canvas.height - ballSize) {
        ballDirection.y = -ballDirection.y;
        if(randomColorOnBounce) {
            ballColor = new Color(getRandInt(0, 255), getRandInt(0, 255), getRandInt(0, 255));
        }
    }
    if(ballPos.x < ballSize || ballPos.x > canvas.width - ballSize) {
        ballDirection.x = -ballDirection.x;
        if(randomColorOnBounce) {
            ballColor = new Color(getRandInt(0, 255), getRandInt(0, 255), getRandInt(0, 255));
        }
    }
}

//Vector math
function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

function normSq(vec) {
    return vec.x * vec.x + vec.y * vec.y;
}

function norm(vec) {
    return Math.sqrt(normSq(vec));
}

function normalize(vec) {
    var len = norm(vec);
    return new Vec2(vec.x / len, vec.y / len);
}

function add(v0, v1) {
    return new Vec2(v0.x + v1.x, v0.y + v1.y);
}

function sub(v0, v1) {
    return new Vec2(v0.x - v1.x, v0.y - v1.y);
}

function mul(v, s) {
    return new Vec2(v.x * s, v.y * s);
}

//utils
function getRandInt(start, end) {
    return start + Math.floor(Math.random() * Math.floor(end - start));
}
