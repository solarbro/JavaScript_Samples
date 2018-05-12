const canvas = document.getElementById('canvas');
//Resize canvas to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//acquire context
const ctx = canvas.getContext('2d');
const frameTime = 16; //locked 16ms per frame

//Containers
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
}

//Game state
//options
const pauseAfterCreation = false;
const randomColorOnBounce = false;
const pauseDuration = 5; //pause for some seconds after each tree is completed
const rootLocation = new Vec2(canvas.width / 2, canvas.height * 0.9);
//Game state enum
const init = 0;
const load = 1;
const grow = 2;
const complete = 3;
const unload = 4;
//tree styles
var angleVariance = Math.PI * Math.random() * 0.5; //+/- 90 degrees max
//---------------
var gameState = unload;
var processComplete = false;

//Field
var branches = [];
//----------

main();

//
// Game code
//
function main() {
    setInterval(updateGameState, frameTime);
}

function drawStar(location, brightness) {
    //Draw star (number of arms depends on brightness)
}

function drawMoon(location, phase) {
    //draw moon based on phase
}

function drawSun(location, color) {
    //draw circle of given color
}

function drawRandomCloud(location, size) {
    //generate random cloud shape within the specified bounds
}

function drawBackground() {
    alert("drawing background (size: " + canvas.width + " x " + canvas.height + ")");
    //Draw sun/moon
    //Draw stars?
    //Draw clouds?
    //Test
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = rgbToHex(getRandColor());
    ctx.fill();
    ctx.closePath();
}

function drawField() {
    alert("drawing ground...");
}

function clearScreen() {
    drawBackground();
    buildGround();
    //debug draw
    drawRoot();
}

function drawLeaf(position, direction, size) {
    //Losange?
}

function drawBranch(start, startWidth, end, endWidth) {

}

function drawRoot() {
    ctx.beginPath();
    ctx.arc(rootLocation.x,rootLocation.y, 10, 0, 2*Math.PI);
    ctx.fillStyle = "#ff0000";
    ctx.fill();
    ctx.closePath();
}

function updateGameState() {
    switch(gameState) {
        case init:
            //Start with unload, because it sets the initial scene options
            gameState = unload;
            break;
        case load:
            initGameState();
            if(processComplete) {
                gameState = grow;
                processComplete = false;
            }
            break;
        case grow:
            growTree();
            if(processComplete) {
                gameState = complete;
                processComplete = false;
            }
            break;
        case complete:
            waitForSceneRefresh();
            if(processComplete) {
                gameState = unload;
                processComplete = false;
            }
            break;
        case unload:
            //define what this scene is going to look like
            setSceneOptions();
            //Fill the screen with static elements
            clearScreen();
            gameState = load;
            break;
        default:
            alert("WTF!!");
            document.location.reload(true);
            break;
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

function getRandColor() {
    return new Color(getRandInt(0, 255), getRandInt(0, 255), getRandInt(0, 255));
}

function getRandBranchColor() {

}

function getRandLeafColor() {

}

function rgbInverse(inColor) {
    return new Color(255 - inColor.r, 255 - inColor.g, 255 - inColor.b);
}

function rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

function buildGround() {
    //Build ground mesh
    alert("generating ground mesh...");
    drawField();
}

function genSeeds() {
    //fill out array of branches
    alert("generating seeds!");
}

function genSky() {
    alert("generating sky...");
}

function initGameState() {
    alert("Generating static scene...");
    processComplete = true;
}

function setSceneOptions() {
    alert("Generating random scene options...");
    genSeeds();
}

function growTree() {
    alert("growing tree...");
    processComplete = true;
}

function waitForSceneRefresh() {
    alert("Waiting for scene refresh request");
    //If auto refresh run timer
    //Check for input state
    processComplete = true;
}
