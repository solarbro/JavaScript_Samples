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
var vertices = []; //list of vertices
var isBuilding = true; //Is a polygon currently being built
var selectedVertex = -1;

//HTML elements
var polygonElem;
var polyTypeElem;

main();

//
// App entry point
//
function main() {
    //Register on mouse click event
    canvas.addEventListener("mousedown", onMouseClick, false);

    //Register on mouse move event
    canvas.addEventListener("mousemove", onMouseMove, false);

    //Register keyboard event
    document.addEventListener("keydown", onKeyDown, false);

    //Query elements on document load
    window.onload = function() {
        polygonElem = document.getElementById("polygon_name");
        polyTypeElem = document.getElementById("polygon_type");

        //Clear fields
        polygonElem.textContent = "";
        polyTypeElem.textContent = "";
    }

    //clear canvas
    drawBackground();
}

function drawBackground() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#efefef";
    ctx.fill();
    ctx.closePath();
}

function drawPolygon(vertices, filled) {
    const numVertices = vertices.length;

    if(numVertices < 1) {
        return;
    }

    ctx.beginPath();
    if(filled) {
        ctx.fillStyle = "#ababab";
    }
    else {
        ctx.strokeStyle = "#444455";
    }
    ctx.lineWidth = 3;
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for(var i = 1; i < numVertices; ++i) {
        ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.lineTo(vertices[0].x, vertices[0].y);
    if(filled) {
        ctx.fill();
    }
    else {
        ctx.stroke();
    }
    ctx.closePath();
}

function drawSelection() {
    if(!isBuilding || selectedVertex == -1 || (selectedVertex == 0 && vertices.length <= 3)) {
        return;
    }
    ctx.beginPath();
    if(selectedVertex == 0 && vertices.length > 3) {
        ctx.strokeStyle = "#88ff88";
    }
    else {
        ctx.strokeStyle = "#ff8888";
    }
    ctx.arc(vertices[selectedVertex].x, vertices[selectedVertex].y, pointSize * 2, 0, 2 * Math.PI);
    ctx.stroke();
    ctx.closePath();
}

function drawVertices(vertices) {
    const numVertices = vertices.length;

    if(numVertices < 1) {
        return;
    }

    //First vertex
    ctx.fillStyle = "#228844";
    ctx.beginPath();
    ctx.arc(vertices[0].x, vertices[0].y, pointSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "#224488";
    for(var i = 1; i < numVertices; ++i) {
        ctx.beginPath();
        ctx.arc(vertices[i].x, vertices[i].y, pointSize, 0, 2 * Math.PI);
        ctx.fill();
        ctx.closePath();
    }
}

function drawInstructions() {
    var pos = new Vec2(10, 20);
    ctx.fillStyle = "#aaaaaa";
    ctx.font = "15px Arial";
    const textOffset = pointSize + 4;
    if(isBuilding) {
        if(selectedVertex == -1) {
            ctx.fillText("Click to add a vertex.", pos.x, pos.y);
        }
        else if(selectedVertex == 0) {
            if(vertices.length <= 3) {
                ctx.fillStyle = "#4466aa";
                ctx.fillText("Need at least 3 vertices.", vertices[0].x + textOffset, vertices[0].y - textOffset);
            }
            else {
                ctx.fillStyle = "#44aa66";
                ctx.fillText("Finish", vertices[0].x + textOffset, vertices[0].y - textOffset);
            }
        }
        else {
            ctx.fillStyle = "#aa6644";
            ctx.fillText("Remove", vertices[selectedVertex].x + textOffset, vertices[selectedVertex].y - textOffset);
        }
    }
    else {
        ctx.fillText("Click to start a new polygon.", pos.x, pos.y);
    }
}

function redrawScene() {
    drawBackground();
    drawPolygon(vertices, true);
    drawPolygon(vertices, false);
    drawSelection();
    
    if(isBuilding) {
        drawVertices(vertices);
    }

    drawInstructions();
}

//App logic
function updateFloatingVertex(position) {
    if(!debugMode && !isBuilding) {
        return;
    }

    if(vertices.length == 0) {
        vertices.push(position);
    }

    vertices[vertices.length - 1] = position;

    //Check for vertex collision
    selectedVertex = -1;
    const lastVert = vertices.length - 1;
    for(var i = 0; i < lastVert; ++i) {
        if(checkPointCollision(position, vertices[i])) {
            selectedVertex = i;
            //Snap to selection
            vertices[vertices.length - 1] = vertices[i];
            break;
        }
    }
}

function identifyShape() {
    //Check number of vertices
    const digits = ["", "hen", "do", "tri", "tetra", "penta", "hexa", "hepta", "octa", "nona"];
    const tens = ["", "deca", "icosa", "triaconta"];
    const specials = new Map([[3, "Triangle"], [4, "Quadrilateral"], [23, "triaicosagon"]]);

    var numVertices = isBuilding ? vertices.length - 1 : vertices.length;

    if(numVertices < 3) {
        polygonElem.textContent = "";
        return;
    }

    var name = "";
    if(specials.has(numVertices)) {
        //Special 
        name = specials.get(numVertices);
    }
    else {
        if(numVertices / 10 < 1) {
            //single digit
            name = digits[numVertices] + "gon";
        }
        else if(numVertices / 10 < 10) {
            var second = Math.floor(numVertices / 10);
            var first = (numVertices % 10).toFixed();
            var prefix = "";
            if(second < tens.length) {
                prefix = tens[second];
            }
            else {
                prefix = digits[second].toString(10) + "conta";
            }
            //Add low digit
            prefix = digits[first] + prefix;
            name = prefix + "gon";
        }
        else {
            name = numVertices.toString(10) + "-gon";
        }
    }

    name = name.charAt(0).toUpperCase() + name.slice(1);
    polygonElem.textContent = name;
}

function identifyType() {
    const numVertices = isBuilding ? vertices.length - 1 : vertices.length;

    if(numVertices < 3) {
        polyTypeElem.textContent = "";
        return;
    }

    //Check the rotation direction of every side.
    //If any side rotates in a different direction than the others, the shape is concave.
    var isConcave = false;
    var p0 = vertices[numVertices - 1];
    var p1 = vertices[0];
    var p2 = vertices[1];
    var firstRotationIsAntiClockwise = rotationDirection(p0, p1, p2);
    for(var i = 0; i < numVertices - 1; ++i) {
        p0 = vertices[i];
        p1 = vertices[i + 1];
        p2 = vertices[(i + 2) % numVertices];
        var thisRotationIsAntiClockwise =  rotationDirection(p0, p1, p2);
        //One of the directions is not the same as all the others
        if(thisRotationIsAntiClockwise != firstRotationIsAntiClockwise) {
            isConcave = true;
            break;
        }
    }

    if(isConcave) {
        polyTypeElem.textContent = "Concave";
    }
    else {
        polyTypeElem.textContent = "Convex";
    }
}

//Vector math
function Vec2(x, y) {
    this.x = x;
    this.y = y;
}

function add(v0, v1) {
    return new Vec2(v0.x + v1.x, v0.y + v1.y);
}

function sub(v0, v1) {
    return new Vec2(v0.x - v1.x, v0.y - v1.y);
}

function dot(v0, v1) {
    return v0.x * v1.x + v0.y * v1.y;
}

function cross(v1, v2) {
    return (v1.x*v2.y) - (v1.y*v2.x);
}

function normalize(vec) {
    var len = Math.sqrt(dot(vec, vec));
    return new Vec2(vec.x / len, vec.y / len);
}

//Event handlers
function onMouseClick(evt) {
    //If we're not currently building a polygon, start a new one
    if(isBuilding) {
        //Context sensitive click
        if(selectedVertex == -1) {
            //add vertex at position
            vertices.push(getMousePos(canvas, evt));
        }
        else if(selectedVertex > 0) {
            //remove selected vertex
            vertices.splice(selectedVertex, 1);
            //Remove selection
            selectedVertex = -1;
        }
        else if(vertices.length > 3) {
            //end polygon
            isBuilding = false;
            //Delete floating vertex
            vertices.pop();
            //Remove selection
            selectedVertex = -1;
        }
    }
    else {
        vertices.splice(0, vertices.length);
        isBuilding = true;
    }
    redrawScene();
    identifyShape();
    identifyType();
}

function onMouseMove(evt) {
    // console.warn("mouse moved");

    var mousePos = getMousePos(canvas, evt);
    if(isBuilding) {
        updateFloatingVertex(mousePos);
        redrawScene();
    }
    if(debugMode) {
        ctx.textStyle = textColor;
        ctx.font = textStyle;
        ctx.fillText("Mouse pos: " + mousePos.x + ", " + mousePos.y, 50, 50);
    }
}

function onKeyDown(evt) {
    const bkSpace = 8;
    if(evt.keyCode == bkSpace && isBuilding) {
        if(vertices.length > 1) {
            vertices.splice(vertices.length - 2, 1);
            redrawScene();
            identifyShape();
        }
    }
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return new Vec2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function checkPointCollision(point1, point2) {
    var vec = sub(point2, point1);
    const threshold = pointSize * pointSize * 4;
    return dot(vec, vec) < threshold;
}

function radToDeg(radians)
{
  return radians * (180/Math.PI);
}

function calcAngle(p0, p1, p2) {
    return 0;
}

function lineAngle(p0, p1) {
    var v = sub(p1, p0);
    v = normalize(v);
    return Math.atan2(v.y, v.x);
}

function rotationDirection(p0, p1, p2) {
    var v0 = sub(p1, p0);
    v0 = normalize(v0);
    var v1 = sub(p2, p1);
    v1 = normalize(v1);

    var crossProduct = cross(v0, v1);
    return crossProduct > 0;
}