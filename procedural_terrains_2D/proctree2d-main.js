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
const groundSubDivs = 12;
const heightVariance = canvas.height / 8;
//Game state enum
const init = 0;
const load = 1;
const grow = 2;
const complete = 3;
const unload = 4;
//tree styles
var angleVariance = Math.PI * Math.random() * 0.5; //+/- 90 degrees max
//Scene style

//Game state
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
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = rgbToHex(getRandColor());
    ctx.fill();
    ctx.closePath();
}

function drawField(vertices) {
    var numVerts = vertices.length;
    //alert("drawing ground num vertices: " + numVerts);

    //Draw ground
    ctx.beginPath();
    ctx.fillStyle = "#000000";
    ctx.moveTo(canvas.width, vertices[numVerts - 1].y);
    ctx.lineTo(canvas.width, canvas.height);
    ctx.lineTo(0, canvas.height);
    ctx.lineTo(0, vertices[0].y);

    //Now loop through vertices in array
    for(var idx = 1; idx < numVerts; ++idx) {
        ctx.lineTo(vertices[idx].x, vertices[idx].y);
    }

    //end mesh
    ctx.fill();
    ctx.closePath();
}

function drawStaticElements() {
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
            drawStaticElements();
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

function subDiv(vertices, iteration, variance) {
    //End recursion
    if(iteration >= groundSubDivs) {
        return;
    }

    //temporary array to store the vertices in
    var tmpArray = [];
    var numVerts = vertices.length;
    //Subdivide each segment
    for(var i = 0; i < numVerts - 1; ++i) {
        tmpArray[2 * i] = vertices[i];
        var subVert = mul(add(vertices[i], vertices[i + 1]), 0.5);
        var bias = 0;
        if(canvas.height < subVert.y + variance)
            bias = canvas.height - subVert.y;
        subVert.y = subVert.y + getRandInt(-variance - bias, variance - bias);
        tmpArray[2 * i + 1] = subVert;
    }
    //Push the last vertex as is
    tmpArray[2 * (numVerts - 1)] = vertices[numVerts - 1];

    //recursive call
    subDiv(tmpArray, iteration + 1, variance / 2.5);
    //Copy results back
    var newNumVerts = tmpArray.length;
    // alert("After subdiv: " + newNumVerts);
    for(var i = 0; i < newNumVerts; ++i) {
        vertices[i] = tmpArray[i];
    }
}

function buildGround() {
    //Create initial 3 vertex mesh
    var groundVertices = [];
    groundVertices[0] = new Vec2(0, rootLocation.y + getRandInt(-heightVariance, heightVariance));
    groundVertices[1] = rootLocation;
    groundVertices[2] = new Vec2(canvas.width, rootLocation.y + getRandInt(-heightVariance, heightVariance));

    //begin recursion
    subDiv(groundVertices, 1, heightVariance);

    drawField(groundVertices);
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
    //Pick time of day
    //Pick moon phase (if night)
    //Pick weather conditions
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
