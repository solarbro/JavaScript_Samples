const canvas = document.querySelector('#breakoutCanvas');
const ctx = canvas.getContext('2d');
const frameTime = 16; //locked 16ms per frame

//Containers
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
}

function Ball(position, radius, velocity, color) {
    this.position = position;
    this.radius = radius;
    this.velocity = velocity;
    this.color = color;
}

function Quad(position, size, color=new Color(0, 0, 0)) {
    this.position = position;
    this.size = size;
    this.color = color;
}

function Paddle(quad, speed, state) {
    this.quad = quad;
    this.speed = speed;
    this.state = state;
}

//We only need to store the brick position, and fill + border colors
function Brick(position, fill, border, life=1) {
    this.position = position;
    this.fill = fill;
    this.stroke = border;
    this.maxLife = life;
    this.life = life;
}

//Game state
//game options
const enableGameOver = true;
//background 
var bgColor = new Color(0, 128, 64);
//ball
var ballNeutralColor = new Color(0, 64, 128);
var ball = new Ball(new Vec2(canvas.width / 2, canvas.height - 300), 10, mul(normalize(new Vec2(1, -1)), 500), ballNeutralColor);
var randomColorOnBounce = true;
//padddle
const paddleHeight = 10;
const paddleWidth = 75;
var paddle = new Paddle(new Quad(new Vec2((canvas.width-paddleWidth)/2, canvas.height - paddleHeight), new Vec2(paddleWidth, paddleHeight), ballNeutralColor), 500, 0);
//bricks
var brickWall = new Vec2(5, 3);
var brickSize = new Vec2(75, 20);
var brickPadding = 10;
var brickWallPos = new Vec2(30, 30);
var brickPattern = 0; //0=rows/columns 1=interleaved
var bricks = []; 
//Input state
var ltDown = false;
var rtDown = false;
//----------

main();

//
// Game code
//
function main() {
    document.addEventListener("keydown", keyDownHandler, false);
    document.addEventListener("keyup", keyUpHandler, false);
    buildTheWall(); //For now, just build the wall at load time
    setInterval(draw, 16);
}

function draw() {
    //Update game state
    updateGameState(frameTime * 0.001); //Convert dt from ms to s
    //clear screen (No need since we draw a full screen background)
    //ctx.clearRect(0, 0, canvas.width, canvas.height);
    //Draw game scene
    drawScene();
}

function drawScene() {
    drawBackground();
    drawBricks();
    drawBall();
    drawPaddle();
}

function drawBall() {
    ctx.beginPath();
    ctx.arc(ball.position.x, ball.position.y, ball.radius, 0, Math.PI*2);
    ctx.fillStyle = rgbToHex(ball.color);
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

function drawPaddle() {
    drawQuad(paddle.quad);
}

function drawBricks() {
    ctx.beginPath();
    for(c=0; c<brickWall.x; c++) {
        for(r=0; r<brickWall.y; r++) {
            var currentBrick = bricks[c][r];
            if(currentBrick.life) {
                ctx.rect(currentBrick.position.x, currentBrick.position.y, brickSize.x, brickSize.y);
                ctx.fillStyle = rgbToHex(currentBrick.fill);
                ctx.fill();
                ctx.strokeStyle = rgbToHex(currentBrick.stroke);
                ctx.stroke();
            }
        }
    }
    ctx.closePath();
}

function drawQuad(quad) {
    ctx.beginPath();
    ctx.rect(quad.position.x, quad.position.y, quad.size.x, quad.size.y);
    ctx.fillStyle = rgbToHex(quad.color);
    ctx.fill();
    ctx.closePath();
}

function updateGameState(dt) {
    //Move ball
    moveBall(dt);
    //Move paddle
    movePaddle(dt);
    //check for collisions
    detectCollision();
}

function moveBall(dt) {
    ball.position = add(ball.position, mul(ball.velocity, dt));
}

function detectCollision() {
    //detect ball against walls
    //If colliding, invert appropriate direction axis
    if(ball.position.y < ball.radius) {
        ball.velocity.y = -ball.velocity.y;
    } else if(ball.position.y > canvas.height - ball.radius) {
        if(enableGameOver) {
            alert("GAME OVER");
            document.location.reload(true);
        } else {
            ball.velocity.y = -ball.velocity.y;
        }
    }
    if(ball.position.x < ball.radius || ball.position.x > canvas.width - ball.radius) {
        ball.velocity.x = -ball.velocity.x;
    }
    //detect ball against paddle
    var paddleCollisionResult = collisionBallQuad(ball, new Quad(paddle.quad.position, new Vec2(paddle.quad.size.x, 1)));
    resolveBallQuad(ball, paddleCollisionResult);
    //detect ball against bricks
    for(c=0; c<brickWall.x; c++) {
        for(r=0; r<brickWall.y; r++) {
            var currentBrick = bricks[c][r];
            var brickQuad = new Quad(currentBrick.position, brickSize);
            if(currentBrick.life) {
                var brickCollision = collisionBallQuad(ball, brickQuad);
                resolveBallQuad(ball, brickCollision);
                if(brickCollision) {
                    bricks[c][r].life--;
                }
            }
        }
    }
}

function resolveBallQuad(ball, result) {
    if(result) {
        if(result === 1 || result === 3) {
            ball.velocity.y = -ball.velocity.y;
        }
        if(result === 2 || result == 3) {
            ball.velocity.x = -ball.velocity.x;
        }
        if(randomColorOnBounce) {
            ball.color = new Color(getRandInt(0, 255), getRandInt(0, 255), getRandInt(0, 255));
            bgColor = rgbInverse(ball.color);
        }
    }
}

function movePaddle(dt) {
    if(rtDown) {
        paddle.quad.position.x += paddle.speed * dt;
        if(paddle.quad.position.x + paddle.quad.size.x > canvas.width) {
            paddle.quad.position.x = canvas.width - paddle.quad.size.x;
        }
    }
    if(ltDown) {
        paddle.quad.position.x -= paddle.speed * dt;
        if(paddle.quad.position.x < 0) {
            paddle.quad.position.x = 0;
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

function rgbInverse(inColor) {
    return new Color(255 - inColor.r, 255 - inColor.g, 255 - inColor.b);
}

function rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

function collisionBallQuad(ball, quad) {
    if(ball.position.x + ball.radius < quad.position.x || ball.position.x - ball.radius > quad.position.x + quad.size.x) {
        return 0;
    }
    if(ball.position.y + ball.radius < quad.position.y || ball.position.y - ball.radius > quad.position.y + quad.size.y) {
        return 0;
    }
    var hDist = Math.min(Math.abs(ball.position.x + ball.radius - quad.position.x), Math.abs(ball.position.x - ball.radius - quad.position.x - quad.size.x));
    var vDist = Math.min(Math.abs(ball.position.y + ball.radius - quad.position.y), Math.abs(ball.position.y - ball.radius - quad.position.y - quad.size.y));
    if(Math.abs(hDist - vDist) < 0.01) {
        return 3; //corner
    }
    if(hDist > vDist) {
        return 1; //vertical collision
    }
    return 2; //horizontal collision
}

function buildTheWall() {
    for(c=0; c<brickWall.x; c++) {
        bricks[c] = [];
        for(r=0; r<brickWall.y; r++) {
            var brickX = (c*(brickSize.x+brickPadding))+brickWallPos.x;
            var brickY = (r*(brickSize.y+brickPadding))+brickWallPos.y;
            bricks[c][r] = new Brick(new Vec2(brickX, brickY), ballNeutralColor, new Color(0, 0, 0));
        }
    }
}

//Input
function keyDownHandler(e) {
    if(e.keyCode == 39) {
        rtDown = true;
    }
    else if(e.keyCode == 37) {
        ltDown = true;
    }
}

function keyUpHandler(e) {
    if(e.keyCode == 39) {
        rtDown = false;
    }
    else if(e.keyCode == 37) {
        ltDown = false;
    }
}