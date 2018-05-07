const canvas = document.querySelector('#breakoutCanvas');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
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
const randomColorOnBounce = false;
//Game state enum
const gameLoad = 0;
const gamePlay = 1;
const gameLevelComplete = 2;
const gameOver = 3;
//Level styles
const levelStyleClassic = 1;
const levelStyleRainbow = 2;
//---------------
var gameState = gameLoad;
var gameLevel = 1; //level (influence ball speed, brick size/layout/count)
var levelLoadFinished = false;
var score = 0;
var highScore = 0;
//background 
var bgColor = new Color(0, 128, 64);
//Field
var boundaryThicknessTop = 2;
var boundaryThicknessSides = 2;
var boundaryColor = new Color(255, 255, 255);
var field = new Quad(new Vec2(0, 0), new Vec2(canvas.width, canvas.height));
//ball
var ballNeutralColor = new Color(0, 64, 128);
var ball = new Ball(new Vec2(0, 0), 0, new Vec2(0, 0));
//padddle
const paddleHeight = 10;
const paddleWidth = 75;
var paddle = new Paddle(new Quad(new Vec2(0, 0), new Vec2(0, 0), new Color(0, 0, 0)), 0, 0);
//bricks
var brickSize = new Vec2(75, 20);
var bricks = []; 
var brickCount = 15;
var bricksBroken = 0;
//ScoreBoard
var scoreBoardPos = new Vec2(0, 0);
var scoreFont = "Arial";
var scoreSize = 16;
var scoreColor = new Color(255, 255, 255);
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
    setInterval(draw, 16);
}

function draw() {
    //Update game state
    updateGameState(frameTime * 0.001); //Convert dt from ms to s
    //Draw game scene
    drawScene();
}

function drawScene() {
    //Always draw the scene
    drawBackground();
    drawField();
    drawBricks();
    drawBall();
    drawPaddle();
    drawScore();
    switch(gameState) {
        case gameLoad:
            //Draw load screen here
            break;
        case gamePlay:
            //Move ball
            moveBall(dt);
            //Move paddle
            movePaddle(dt);
            //check for collisions
            detectCollision();
            break;
        case gameLevelComplete:
            //Draw the level complete screen here
            break;
        case gameOver:
            //Draw the game over screen here
            break;
        default:
            alert("WTF!!");
            document.location.reload(true);
            break;
    }
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

function drawField() {
    ctx.beginPath();
    ctx.fillStyle = rgbToHex(boundaryColor);
    //top wall
    ctx.rect(field.position.x - boundaryThicknessSides, field.position.y - boundaryThicknessTop, field.size.x + boundaryThicknessSides * 2, boundaryThicknessTop);
    ctx.fill();
    //right wall
    ctx.rect(field.position.x - boundaryThicknessSides, field.position.y, boundaryThicknessSides, field.size.y);
    ctx.fill();
    //left wall
    ctx.rect(field.position.x + field.size.x, field.position.y, boundaryThicknessSides, field.size.y);
    ctx.fill();
    //---------
    ctx.closePath();
}

function drawScore() {
    ctx.font = ""+scoreSize+"px "+scoreFont;
    ctx.fillStyle = rgbToHex(scoreColor);
    ctx.fillText("Score: "+score+" High score: "+highScore, scoreBoardPos.x, scoreBoardPos.y); 
}

function drawPaddle() {
    drawQuad(paddle.quad);
}

function drawBricks() {
    ctx.beginPath();
    for(b=0; b<brickCount; b++) {
        var currentBrick = bricks[b];
        if(currentBrick.life) {
            ctx.rect(currentBrick.position.x, currentBrick.position.y, brickSize.x, brickSize.y);
            ctx.fillStyle = rgbToHex(currentBrick.fill);
            ctx.fill();
            ctx.strokeStyle = rgbToHex(currentBrick.stroke);
            ctx.stroke();
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
    switch(gameState) {
        case gameLoad:
            if(!levelLoadFinished) {
                initGameState();
                levelLoadFinished = true;
            }
            //For now, just pause
            alert("Start Level " + gameLevel);
            gameState = gamePlay;
            break;
        case gamePlay:
            //Move ball
            moveBall(dt);
            //Move paddle
            movePaddle(dt);
            //check for collisions
            detectCollision();
            break;
        case gameLevelComplete:
            alert("Level Complete");
            gameLevel++;
            gameState = gameLoad;
            levelLoadFinished = false;
            break;
        case gameOver:
            alert("Game Over!");
            //Start over from level 1
            gameLevel = 1;
            gameState = gameLoad;
            levelLoadFinished = false;
            //Log high score and reset level score
            highScore = Math.max(score, highScore);
            score = 0;
            break;
        default:
            alert("WTF!!");
            document.location.reload(true);
            break;
    }
}

function moveBall(dt) {
    ball.position = add(ball.position, mul(ball.velocity, dt));
}

function detectCollision() {
    //If colliding, invert appropriate direction axis
    //detect ball against walls
    if(ball.position.y < field.position.y + ball.radius) {
        ball.velocity.y = -ball.velocity.y;
    } else if(ball.position.y > canvas.height + ball.radius) {
        if(gameOverEnabled()) {
            //alert("Setting game state to " + gameOver);
            gameState = gameOver;
            return;
        } else {
            ball.velocity.y = -ball.velocity.y;
        }
    }
    if(ball.position.x < field.position.x + ball.radius || ball.position.x > field.position.x + field.size.x - ball.radius) {
        ball.velocity.x = -ball.velocity.x;
    }
    //detect ball against paddle
    var paddleCollisionResult = collisionBallQuad(ball, new Quad(paddle.quad.position, new Vec2(paddle.quad.size.x, 1)));
    resolveBallQuad(ball, paddleCollisionResult);
    //detect ball against bricks
    for(b=0; b<brickCount; b++) {
        var currentBrick = bricks[b];
        var brickQuad = new Quad(currentBrick.position, brickSize);
        if(currentBrick.life) {
            var brickCollision = collisionBallQuad(ball, brickQuad);
            resolveBallQuad(ball, brickCollision);
            if(brickCollision) {
                bricks[b].life--;
                if(bricks[b].life == 0) {  
                    bricksBroken++;
                    score += currentBrick.maxLife;
                }
            }
        }
    }
    //If all bricks are gone, go to level complete
    if(bricksBroken >= brickCount) {
        gameState = gameLevelComplete;
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
        if(paddle.quad.position.x + paddle.quad.size.x > field.position.x + field.size.x) {
            paddle.quad.position.x = field.position.x + field.size.x - paddle.quad.size.x;
        }
    }
    if(ltDown) {
        paddle.quad.position.x -= paddle.speed * dt;
        if(paddle.quad.position.x < field.position.x) {
            paddle.quad.position.x = field.position.x;
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

function gameOverEnabled() {
    return enableGameOver;
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
    switch(gameLevel) {
        case levelStyleClassic:
            var brickWallPos = new Vec2(field.position.x, field.position.y + field.size.y / 6);
            var brickWall = new Vec2(14, 7);
            brickSize.x = field.size.x / brickWall.x;
            brickSize.y = field.size.y / 6 / brickWall.y;
            for(c=0; c<brickWall.x; c++) {
                for(r=0; r<brickWall.y; r++) {
                    var brickX = (c*brickSize.x)+brickWallPos.x;
                    var brickY = (r*brickSize.y)+brickWallPos.y;
                    bricks[c + r * brickWall.x] = new Brick(new Vec2(brickX, brickY), new Color(255, 255, 255), new Color(0, 0, 0));
                }
            }
            brickCount = brickWall.x * brickWall.y;
            break;
        default:
            var brickPadding = 2;
            var brickWallPos = add(field.position, new Vec2(brickPadding, brickPadding));
            var brickWall = new Vec2(5, 3);
            for(c=0; c<brickWall.x; c++) {
                //bricks[c] = [];
                for(r=0; r<brickWall.y; r++) {
                    var brickX = (c*(brickSize.x+brickPadding))+brickWallPos.x;
                    var brickY = (r*(brickSize.y+brickPadding))+brickWallPos.y;
                    bricks[c + r * brickWall.x] = new Brick(new Vec2(brickX, brickY), ballNeutralColor, new Color(0, 0, 0));
                }
            }
            brickCount = brickWall.x * brickWall.y;
            break;
    }
}

function initField() {
    switch(gameLevel) {
        case levelStyleClassic:
            boundaryThicknessSides = 10;
            boundaryThicknessTop = 20;
            var posX = canvas.width / 4;
            var posY = boundaryThicknessTop * 3;
            var fieldWidth = posX * 2;
            field = new Quad(new Vec2(posX, posY), new Vec2(fieldWidth, canvas.height - posY));
            break;
        //case levelStyleRainbow:
          //  break;
        default:
            boundaryThicknessSides = 20; 
            boundaryThicknessTop = 20;
            field = new Quad(new Vec2(boundaryThicknessSides, boundaryThicknessTop), new Vec2(canvas.width - 2 * boundaryThicknessSides, canvas.height - boundaryThicknessTop * 2));
            break;
    }
}

function initGameBall() {
    const ballRadius = 10;
    ball = new Ball(new Vec2(field.position.x + field.size.x / 2, paddle.quad.position.y - ballRadius), ballRadius, mul(normalize(new Vec2(1, -1)), 500), ballNeutralColor);
}

function initGamePaddle() {
    var paddleYOffset = 0;
    switch(gameLevel) {
        case levelStyleClassic:
            paddleYOffset = 30;
            break;
        default:
            paddleYOffset = 5;
            break;
    }
    paddle = new Paddle(new Quad(new Vec2(field.position.x + (field.size.x-paddleWidth)/2, field.position.y + field.size.y - paddleHeight - paddleYOffset), new Vec2(paddleWidth, paddleHeight), ballNeutralColor), 500, 0);
}

function initStyles() {
    switch(gameLevel) {
        case levelStyleClassic:
            ball.color = new Color(255, 255, 255);
            paddle.quad.color = ball.color;
            bgColor = new Color(0, 0, 0);
            scoreBoardPos = add(field.position, new Vec2(8, 20));
            scoreColor = new Color(255, 255, 255);
            break;
        default:
            //Pick random (bright) color
            var randColor = new Color(getRandInt(64, 255), getRandInt(64, 255), getRandInt(128, 255));
            //Set paddle and ball to random selected random color
            ball.color = randColor;
            paddle.quad.color = randColor;
            //Set background color to inverse of ball color (guranteed dark)
            bgColor = rgbInverse(randColor); 
            scoreBoardPos = new Vec2(8, 20);
            break;
    }
}

function initGameState() {
    initField();
    initGamePaddle();
    initGameBall();
    initStyles();
    buildTheWall();
    //Initialize inputs
    rtDown = ltDown = false;
    //Set bricks broken to 0
    bricksBroken = 0;
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