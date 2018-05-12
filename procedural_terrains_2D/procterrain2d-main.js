const canvas = document.getElementById('canvas');
//Resize canvas to fill window
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
//acquire context
const ctx = canvas.getContext('2d');
const frameTime = 1000; //locked 16ms per frame

//Containers
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
}

//Game state
//options
const pauseAfterCreation = true;
const pauseDuration = 5; //pause for some seconds after each tree is completed
const groundSubDivs = 10;
const maxHeightVariance = canvas.height / 4;
const minHeightVariance = canvas.height / 16;
const minDecay = 1.1;
const maxDecay = 3.3;
//Game state enum
const init = 0;
const load = 1;
const complete = 2;

//Game state
var gameState = init;
var processComplete = false;

//Field
var bgColor = new Color(0, 0, 0);
var groundVertices = [];
var subDivIteration = 0;
var backupHeightVariance;
var currentHeightVariance = 0;
var decay = 2.5;
//UI
var pauseTimer = 0;
//----------
main();

//
// Game code
//
function main() {
    setInterval(updateGameState, frameTime);
}

function drawBackground() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = rgbToHex(bgColor);
    ctx.fill();
    ctx.closePath();

    //Debug info
    ctx.font = "30px Arial";
    ctx.fillStyle = rgbToHex(rgbInverse(bgColor));
    ctx.fillText("Variance : " + backupHeightVariance.toFixed(2), 10, 50);
    ctx.fillText("Noise    : " + ((1 - (decay - minDecay) / (maxDecay - minDecay)) * 100).toFixed(2), 10, 80);
    ctx.fillText("Iteration: " + subDivIteration, 10, 110); 
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
    //debug draw (control points?)
}

function updateGameState() {
    switch(gameState) {
        case init:
            //alert("init");
            //Reset to initial params
            subDivIteration = 0;
            currentHeightVariance = minHeightVariance + Math.random() * (maxHeightVariance - minHeightVariance);
            backupHeightVariance = currentHeightVariance;
            decay = minDecay + Math.random() * (maxDecay - minDecay);
            bgColor = getRandColor();
            //Clear vertices
            groundVertices = [];
            //Change state
            gameState = load;
            break;
        case load:
            //alert("load");
            //Fill the screen with static elements
            drawStaticElements();
            if(subDivIteration >= groundSubDivs) {
                gameState = complete;
                pauseTimer = 0;
            }
            break;
        case complete:
            waitForSceneRefresh();
            if(processComplete) {
                gameState = init;
            }
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

function rgbInverse(inColor) {
    return new Color(255 - inColor.r, 255 - inColor.g, 255 - inColor.b);
}

function rgbToHex(rgb) {
    return "#" + ((1 << 24) + (rgb.r << 16) + (rgb.g << 8) + rgb.b).toString(16).slice(1);
}

function subDiv() {
    //temporary array to store the vertices in
    var tmpArray = [];
    var numVerts = groundVertices.length;
    //Subdivide each segment
    for(var i = 0; i < numVerts - 1; ++i) {
        tmpArray[2 * i] = groundVertices[i];
        var subVert = mul(add(groundVertices[i], groundVertices[i + 1]), 0.5);
        var bias = 0;
        if(canvas.height < subVert.y + currentHeightVariance)
            bias = canvas.height - subVert.y;
        subVert.y = subVert.y + getRandInt(-currentHeightVariance - bias, currentHeightVariance - bias);
        tmpArray[2 * i + 1] = subVert;
    }
    //Push the last vertex as is
    tmpArray[2 * (numVerts - 1)] = groundVertices[numVerts - 1];

    //Copy results back
    var newNumVerts = tmpArray.length;
    // alert("After subdiv: " + newNumVerts);
    for(var i = 0; i < newNumVerts; ++i) {
        groundVertices[i] = tmpArray[i];
    }
}

function buildGround() {
    //Create initial 3 vertex mesh
    if(subDivIteration == 0) {
        //Add initial vertices
        //TODO: give more flexibility
        const rootLocation = new Vec2(canvas.width / 2, canvas.height * 0.75);
        groundVertices[0] = new Vec2(0, rootLocation.y + getRandInt(-currentHeightVariance, currentHeightVariance));
        //groundVertices[1] = rootLocation;
        groundVertices[1] = new Vec2(canvas.width, rootLocation.y + getRandInt(-currentHeightVariance, currentHeightVariance));
    }
    else{
        //Do a single subdivision step
        subDiv();
    }
    //Draw the terrain
    drawField(groundVertices);
    //Increment iteration count
    ++subDivIteration;
    //Reduce noise level for the next iteration
    currentHeightVariance = currentHeightVariance / decay;
}

function waitForSceneRefresh() {
    if(pauseAfterCreation) {
        alert("Waiting for scene refresh request");
        processComplete = true;
    } else {
        //If auto refresh run timer
        //Check for input state
        ++pauseTimer;
        if(pauseTimer >= pauseDuration) {
            processComplete = true;
        }
    }
}
