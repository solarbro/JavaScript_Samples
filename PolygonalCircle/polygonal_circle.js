const canvas = document.getElementById(canvas_id);
//Clamp canvas width to 480
var aspect = canvas.width / canvas.height;
const maxCanvasWidth = 480;
canvas.width = Math.min(canvas.width, maxCanvasWidth);
canvas.height = canvas.width / aspect;
//acquire context
const ctx = canvas.getContext('2d');

//Containers
const textColor = "#888888";
const textStyle = "20px Arial";
const pointSize = 5;
const offsetScale = 0.5;

//App state
var refreshImage = false;

main();

//
// App entry point
//
function main() {
    window.onload = lateInit;
}

function lateInit() {
    var initialVerts = 6;
    var inputElement = document.getElementById("start");
    if(inputElement != null) {
        initialVerts = inputElement.value;
    }
    updatePolygon(initialVerts);
}

function drawBackground() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    // ctx.fillStyle = "#ffffff";
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

function drawPolyCount(numVertices) {
    ctx.font = textStyle;
    ctx.fillStyle = "#000000";
    ctx.fillText("Number of vertices: " + numVertices, 20, 20);
}

function generateVertices(vertexCount) {
    const center = new Vec2(canvas.width / 2, canvas.height / 2);
    const padding = 20;
    var radius = canvas.height / 2 - padding;
    var dt = 2 * Math.PI / vertexCount;
    var vertices = [];
    for(var i = 0; i < vertexCount; ++i) {
        var angle = i * dt - Math.PI / 2;
        vertices.push(add(center, new Vec2(radius * Math.cos(angle), radius * Math.sin(angle))));
    }
    return vertices;
}

function drawPolygon(vertices) {
    const numVertices = vertices.length;
    ctx.beginPath();
    ctx.strokeStyle = "#9999ff";
    ctx.lineWidth = 3;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for(var i = 1; i < numVertices; ++i) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.lineTo(vertices[0].x, vertices[0].y);
    ctx.stroke();
    ctx.closePath();
}

//Vector math
function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

function add(v0, v1) {
    return new Vec2(v0.x + v1.x, v0.y + v1.y);
}

//Event handlers
function updatePolygon(vertexCount) {
    var vertices = generateVertices(vertexCount);
    drawBackground();
    if(debugMode) {
        drawPolyCount(vertexCount);
    }
    drawPolygon(vertices);
}