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
var p0 = new Vec2(100, 300);
var p1 = new Vec2(200, 200);
var p2 = new Vec2(300, 50);
var selection = -1;
var isMouseDown = false;

main();

//
// App entry point
//
function main() {
    //Register on mouse click event
    canvas.addEventListener("mousedown", onMouseDown, false);

    //Register on mouse click event
    canvas.addEventListener("mouseup", onMouseUp, false);

    //Register on mouse move event
    canvas.addEventListener("mousemove", onMouseMove, false);

    //Register touch start event
    canvas.addEventListener("touchstart", onTouchStart, false);

    //Register touch end event
    canvas.addEventListener("touchend", onTouchEnd, false);

    //Register touch drag event
    canvas.addEventListener("touchmove", onTouchMove, false);

    //clear canvas
    redrawScene();
}

function drawBackground() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

function drawSelection() {
    if(selection == -1) {
        return;
    }

    ctx.strokeStyle = "#ff8888";
    ctx.fillStyle = "#ff8888";
    var pos;
    switch (selection) {
        case 0:
            pos = p0;
            break;
        case 1:
            pos = p1;
            break;
        case 2:
            pos = p2;
            break;
        default:
            return;
    }

    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pointSize * 2, 0, 2 * Math.PI);
    if(isMouseDown) {
        ctx.fill();
    }
    else {
        ctx.stroke();
    }
    ctx.closePath();
}

function drawVertices() {
    ctx.fillStyle = "#224488";
    drawVertex(p0);
    drawVertex(p1);
    drawVertex(p2);
}

function drawVertex(pos) {
    ctx.beginPath();
    ctx.arc(pos.x, pos.y, pointSize, 0, 2 * Math.PI);
    ctx.fill();
    ctx.closePath();
}

function drawInfiniteLine(p0, p1) {
    //draw an infinite line passing through the given points
    //Find extents
    var v = sub(p1, p0);
    var t0 = (canvas.width - p0.x) / v.x;
    var t1 = (0 - p0.x) / v.x;
    var s0 = (canvas.height - p0.y) / v.y;
    var s1 = (0 - p0.y) / v.y;

    //Find closest pair
    var minDist = 10000000;
    var e0 = 0;
    var e1 = 0;
    var extents = [t0, t1, s0, s1];
    for(var i = 0; i < 3; ++i) {
        for(var j = i + 1; j < 4; ++j) {
            //Only compare extents from opposite sides
            if(Math.sign(extents[i]) == Math.sign(extents[j])) {
                continue;
            }
            //Check if this pair is closer than the last
            var dist = Math.abs(extents[i] - extents[j]);
            if(dist < minDist) {
                minDist = dist; 
                e0 = extents[i];
                e1 = extents[j];
            }
        }
    }

    // console.warn("s = " + e0 + " t = " + e1);
    // console.warn("t0 = " + t0 + " t1 = " + t1 + " s0 = " + s0 + " s1 = " + s1)

    var start = add(p0, mul(v, e0));
    var end   = add(p0, mul(v, e1));

    ctx.beginPath();
    ctx.strokeStyle = "#aaaaaa";
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    ctx.stroke();
    ctx.closePath();
}

function drawLines() {
    drawInfiniteLine(p0, p1);
    drawInfiniteLine(p1, p2);
}

function drawArrow(p0, p1) {
    //draw an arrow pointing from p0 to p1
    const arrowWidth = 2; //2px
    const arrowHead = 7; //4px

    var arrow = sub(p1, p0);
    var v = normalize(arrow);
    var cursor = p0;
    var arrowLen = Math.sqrt(dot(arrow, arrow));
    arrowLen -= Math.sqrt(3 * arrowHead * arrowHead);

    ctx.beginPath();
    ctx.fillStyle = "#444444";
    ctx.moveTo(cursor.x, cursor.y);

    v = rotateVector(v, Math.PI / 2);
    cursor = add(cursor, mul(v, arrowWidth));
    ctx.lineTo(cursor.x, cursor.y);

    v = rotateVector(v, -Math.PI / 2);
    cursor = add(cursor, mul(v, arrowLen));
    ctx.lineTo(cursor.x, cursor.y);

    v = rotateVector(v, Math.PI / 2);
    cursor = add(cursor, mul(v, arrowHead - arrowWidth));
    ctx.lineTo(cursor.x, cursor.y);

    v = rotateVector(v, -2 * Math.PI / 3);
    cursor = add(cursor, mul(v, 2 * arrowHead));
    ctx.lineTo(cursor.x, cursor.y);

    v = rotateVector(v, -2 * Math.PI / 3);
    cursor = add(cursor, mul(v, 2 * arrowHead));
    ctx.lineTo(cursor.x, cursor.y);

    v = rotateVector(v, -2 * Math.PI / 3);
    cursor = add(cursor, mul(v, arrowHead - arrowWidth));
    ctx.lineTo(cursor.x, cursor.y);

    v = rotateVector(v, Math.PI / 2);
    cursor = add(cursor, mul(v, arrowLen));
    ctx.lineTo(cursor.x, cursor.y);

    ctx.fill();
    ctx.closePath();
}

function drawArrows() {
    drawArrow(p0, p1);
    drawArrow(p1, p2);
}

function drawDirectionLabel() {
    var direction = rotationDirection(p0, p1, p2);

    ctx.font = textStyle;
    ctx.fillStyle = "#666666";
    var offset = pointSize * 4;
    var posx = p2.x + offset;
    var posy = p2.y - pointSize;

    //Clamp label position inside viewport so it's always visible
    var overflow = canvas.width - (posx + 50);
    if(overflow < 0) {
        posx += overflow;
        posy += overflow / 4;
    }
    overflow = posy - 20;
    if(overflow < 0) {
        posy -= overflow;
    }

    //Draw text
    ctx.fillText(direction ? "Right" : "Left", posx, posy);
}

function drawAngle() {
    const arcRadius = 50;
    var direction = rotationDirection(p0, p1, p2);

    var v0 = normalize(sub(p1, p0));
    var start = Math.atan2(v0.y, v0.x);
    var v1 = normalize(sub(p2, p1));
    var end = Math.atan2(v1.y, v1.x);

    ctx.fillStyle = "#ff8888";
    ctx.beginPath();
    ctx.moveTo(p1.x, p1.y);
    ctx.arc(p1.x, p1.y, arcRadius, start, end, !direction);
    ctx.lineTo(p1.x, p1.y);
    ctx.fill();
    ctx.closePath();
}

function drawPointLabel(p, label) {
    ctx.fillText(label, p.x - pointSize * 2, p.y + pointSize * 6);
}

function drawPointLabels() {
    ctx.font = textStyle;
    ctx.fillStyle = "#666666";
    drawPointLabel(p0, "P0");
    drawPointLabel(p1, "P1");
    drawPointLabel(p2, "P2");
}

function redrawScene() {
    drawBackground();     //clear screen
    drawAngle();          //Draw the arc indicating the rotation amount
    drawLines();          //2 lines formed from the points
    drawArrows();         //2 arrows p0 - p1 and p1 - p2
    drawSelection();      //draw highlight on selected vertex
    drawVertices();       //draw the vertices
    drawPointLabels();    //label the points
    drawDirectionLabel(); //say whether the edge is turning left or right
}

function appUpdate(mousePos) {
    // console.warn("Mouse pos: (" + mousePos.x + ", " + mousePos.y + ")");
    //Is mouse down?
    if(isMouseDown) {
        //Move selected vertex
        switch (selection) {
            case 0:
                p0 = mousePos;
                break;
            case 1:
                p1 = mousePos;
                break;
            case 2:
                p2 = mousePos;
                break;
            default:
                break;
        }
    }
    else {
        //Check for hover
        var prevSelection = selection;
        selection = -1;
        if(checkPointCollision(mousePos, p0)) {
            selection = 0;
        }
        else if(checkPointCollision(mousePos, p1)) {
            selection = 1;
        }
        else if(checkPointCollision(mousePos, p2)) {
            selection = 2;
        }

        if(selection != prevSelection) {
            if(selection == -1) {
                document.body.style.cursor = "default";
            }
            else {
                document.body.style.cursor = "grab";
            }
        }
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

function mul(v, s) {
    return new Vec2(v.x * s, v.y * s);
}

function cross(v1, v2) {
    return (v1.x*v2.y) - (v1.y*v2.x);
}

function normalize(vec) {
    var len = Math.sqrt(dot(vec, vec));
    return new Vec2(vec.x / len, vec.y / len);
}

function rotateVector(v, angle) {
    var cosa = Math.cos(angle);
    var sina = Math.sin(angle);

    return new Vec2(v.x * cosa - v.y * sina, v.x * sina + v.y * cosa);
}

//Event handlers
function onMouseDown(evt) {
    isMouseDown = true;
    redrawScene();
    if(selection != -1) {
        document.body.style.cursor = "grabbing";
    }
}

function onMouseUp(evt) {
    isMouseDown = false;
    redrawScene();
    if(selection != -1) {
        document.body.style.cursor = "grab";
    }
}

function onMouseMove(evt) {
    var mousePos = getMousePos(canvas, evt);
    appUpdate(mousePos);
    redrawScene();
    if(debugMode) {
        ctx.textStyle = textColor;
        ctx.font = textStyle;
        ctx.fillText("Mouse pos: " + mousePos.x + ", " + mousePos.y, 50, 50);
    }
}

function onTouchStart(evt) {
    var touchPos = getTouchPos(canvas, evt);
    appUpdate(touchPos);
    isMouseDown = true;
}

function onTouchEnd(evt) {
    selection = -1;
    isMouseDown = false;
    redrawScene();
}

function onTouchMove(evt) {
    if(selection < 0 || selection > 2) {
        return;
    }
    
    evt.preventDefault();
    var touchPos = getTouchPos(canvas, evt);
    appUpdate(touchPos);
    redrawScene();
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return new Vec2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function getTouchPos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return new Vec2(evt.touches[0].clientX - rect.left, evt.touches[0].clientY - rect.top);
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

function rotationDirection(p0, p1, p2) {
    var v0 = sub(p1, p0);
    v0 = normalize(v0);
    var v1 = sub(p2, p1);
    v1 = normalize(v1);

    var crossProduct = cross(v0, v1);
    return crossProduct > 0;
}