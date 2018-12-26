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
    redrawScene();
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
    if(isBuilding) {
        ctx.fillStyle = "#228844";
    }
    else {
        ctx.fillStyle = "#224488";
    }
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
    drawVertices(vertices);
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
    polygonElem.textContent = name + " (" + numVertices + " sides)";
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
        //Check for intersection between edges
        if(checkEdgeIntersections()) {
            polyTypeElem.textContent = "Complex";
        }
        else {
            polyTypeElem.textContent = "Concave";
        }
    }
    else {
        polyTypeElem.textContent = "Convex";
    }
}

function checkEdgeIntersections() {
    const numVertices = isBuilding ? vertices.length - 1 : vertices.length;
    var hasIntersections = false;
    for(var i = 0; i < numVertices - 1; ++i) {
        var edge00 = i;
        var edge01 = i + 1;
        for(var j = i + 1; j < numVertices; ++j) {
            var edge10 = j;
            var edge11 = (j + 1) % numVertices;
            if(checkSegmentIntersection(vertices[edge00], vertices[edge01], vertices[edge10], vertices[edge11])) {
                hasIntersections = true;
            }
        }
    }

    return hasIntersections;
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
    //Update the selection state to prevent adding multiple vertices in the same place
    updateFloatingVertex(getMousePos(canvas, evt));
    //Update the display
    redrawScene();
    //Identify the new polygon
    identifyShape();
    identifyType();
}

function onMouseMove(evt) {
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

function checkSegmentIntersection(e00, e01, e10, e11) {
    var v0 = sub(e01, e00);
    var v1 = sub(e11, e10);

    //First check if they are parallel
    //Parallel lines don't intersect
    if(Math.abs(cross(v0, v1)) < 0.0001) {
        return false;
    }

    //Solve the quadratic equation from the 2 lines
    // e00_x + tv0_x = e10_x + sv1_x    (1)
    // e00_y + tv0_y = e10_y + sv1_y    (2)
    // where t and s are unknown.
    var a = v0.x;
    var b = -v1.x;
    var c = e10.x - e00.x;
    var d = v0.y;
    var e = -v1.y;
    var f = e10.y - e00.y;
    var s = (-d * c + a * f) / (-d * b + a * e);
    var t = (e10.x + s * v1.x - e00.x) / v0.x;

    //debug
    // ctx.beginPath();
    // ctx.fillStyle = "#ff0000";
    // ctx.arc(e00.x + t * v0.x, e00.y + t * v0.y, pointSize * 2, 0, 2 * Math.PI);
    // ctx.fill();
    // ctx.closePath();

    //If both t and s are between 0 and 1, there's an intersection.
    //But we want to ignore intersections at the edges, so let's add some arbitrary threshold.
    return (t > 0.1 && t < 0.9) && (s > 0.1 && s < 0.9);
}