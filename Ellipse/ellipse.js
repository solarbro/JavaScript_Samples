const canvas = document.getElementById(canvas_id);
//Clamp canvas width to 480
var aspect = canvas.width / canvas.height;
const maxCanvasWidth = 480;
canvas.width = Math.min(canvas.width, maxCanvasWidth);
canvas.height = canvas.width / aspect;
//acquire context
const ctx = canvas.getContext('2d');

//Containers
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
}
const textColor = "#888888";
const textStyle = "20px Arial";
const pointSize = 5;
const offsetScale = 0.5;

//Ellipse controls state
var focA = new Vec2(-2, 0);
var focB = new Vec2(2, 0);
var radiusSum = 6;
var radCtrl = new Vec2(0, Math.sqrt(5));
var majorAxis = evalMajorAxis();
var minorAxis = evalMinorAxis();

//App state
var refreshImage = false;
var mousePos = new Vec2(0, 0);
var mouseLClickState = false;
var selection = 0;

main();

//
// App entry point
//
function main() {
    canvas.addEventListener('mousemove', onMouseMove, false);
    canvas.addEventListener("mousedown", onMouseDown, false);
    canvas.addEventListener("mouseup", onMouseUp, false);

    canvas.addEventListener("touchstart", onTouchTap, false);

    updateScene();
}

function drawBackground() {
    ctx.beginPath();
    ctx.rect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fill();
    ctx.closePath();
}

function drawGraphGrid() {
    //Draw lines every 2 units
    //Horizontal
    var numLines = canvas.height / zoom / 2;
    var spacing = zoom * 2;

    var cursor = 0;
    var origin = canvas.height / 2;

    ctx.beginPath();
    ctx.strokeStyle = "#888888";
    for(var i = 0; i < numLines; ++i) {
        cursor += spacing;
        ctx.moveTo(0, origin + cursor);
        ctx.lineTo(canvas.width, origin + cursor);
        ctx.moveTo(0, origin - cursor);
        ctx.lineTo(canvas.width, origin - cursor);
    }

    cursor = 0;
    origin = canvas.width / 2;

    for(var i = 0; i < numLines; ++i) {
        cursor += spacing;
        ctx.moveTo(origin + cursor, 0);
        ctx.lineTo(origin + cursor, canvas.height);
        ctx.moveTo(origin - cursor, 0);
        ctx.lineTo(origin - cursor, canvas.height);
    }

    ctx.stroke();
    ctx.closePath();

    //Draw main axes
    drawAxis(new Vec2(0, 1));
    drawAxis(new Vec2(1, 0));
}

function drawAxis(axis) {
    const halfWidth = canvas.width / 2;
    const halfHeight = canvas.height / 2;

    ctx.beginPath();

    var cursor = new Vec2(halfWidth - axis.x * halfWidth, halfHeight + axis.y * halfHeight);

    //Draw axis line
    ctx.strokeStyle = "#000000";
    ctx.moveTo(cursor.x, cursor.y);
    cursor = add(cursor, new Vec2(axis.x * canvas.width, -axis.y * canvas.height));
    ctx.lineTo(cursor.x, cursor.y);

    ctx.stroke();
    ctx.closePath();

    //Draw arrow head
    ctx.beginPath();
    ctx.fillStyle = "#000000";

    const arrowHeadSize = 5;

    ctx.moveTo(cursor.x, cursor.y);
    cursor = add(cursor, new Vec2(-arrowHeadSize * axis.x, arrowHeadSize * axis.y));
    var ortho = new Vec2(arrowHeadSize * axis.y, arrowHeadSize * -axis.x);
    cursor = add(cursor, ortho);
    ctx.lineTo(cursor.x, cursor.y);
    cursor = add(cursor, new Vec2(-2 * ortho.x, -2 * ortho.y));
    ctx.lineTo(cursor.x, cursor.y);

    ctx.fill();

    ctx.closePath();
}

function drawEllipse() {
    //Calculate center
    var median = mul(add(focA, focB), 0.5);
    var center = toScreenCoords(median);

    //Calculate rotation
    var BminusA = sub(focB, focA);
    BminusA = normalize(BminusA);
    var rotation = -Math.atan2(BminusA.y, BminusA.x);

    //Calculate major radius
    var majorRad = majorAxis * zoom;

    //Calculate minor radius
    var minorRad = minorAxis * zoom;

    //Draw major axis
    ctx.beginPath();
    ctx.strokeStyle = "#aa3311";
    ctx.moveTo(center.x - BminusA.x * majorRad, center.y + BminusA.y * majorRad);
    ctx.lineTo(center.x + BminusA.x * majorRad, center.y - BminusA.y * majorRad);
    ctx.stroke();
    ctx.closePath();

    //Draw minor axis
    ctx.beginPath();
    ctx.strokeStyle = "#11aa33";
    var minAxis = new Vec2(BminusA.y, -BminusA.x);
    ctx.moveTo(center.x - minAxis.x * minorRad, center.y + minAxis.y * minorRad);
    ctx.lineTo(center.x + minAxis.x * minorRad, center.y - minAxis.y * minorRad);
    ctx.stroke();
    ctx.closePath();

    //Draw ellipse
    ctx.beginPath();
    ctx.strokeStyle = "#4488ff";
    ctx.ellipse(center.x, center.y, majorRad, minorRad, rotation, 0, Math.PI * 2);
    ctx.stroke();
    ctx.closePath();
}

function drawControls() {
    ctx.fillStyle = "#000000";

    //Draw ellipse guide lines
    //Draw Focal point A
    ctx.beginPath();
    var A = toScreenCoords(focA);
    ctx.ellipse(A.x, A.y, pointSize, pointSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    //Draw Focal point B
    ctx.beginPath();
    var B = toScreenCoords(focB);
    ctx.ellipse(B.x, B.y, pointSize, pointSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    //Draw radius control point
    var C = toScreenCoords(radCtrl);
    ctx.beginPath();
    ctx.ellipse(C.x, C.y, pointSize, pointSize, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.closePath();
    
    //Draw control lines
    ctx.beginPath();
    ctx.strokeStyle = "#000000";
    ctx.moveTo(A.x, A.y);
    ctx.lineTo(C.x, C.y);
    ctx.lineTo(B.x, B.y);
    ctx.stroke();
    ctx.closePath();

    //Draw highlight
    if(selection != 0) {
        var pos;
        switch (selection) {
            case 1:
                pos = A;
                break;
            case 2:
                pos = B;
                break;
            case 3:
                pos = C;
                break;
        }

        var highlightColor = "#aa2211";
        ctx.beginPath();
        ctx.ellipse(pos.x, pos.y, pointSize * 1.5, pointSize * 1.5, 0, 0, Math.PI * 2);
        if(!mouseLClickState) {
            ctx.strokeStyle = highlightColor;
            ctx.stroke();
        }
        else {
            ctx.fillStyle = highlightColor;
            ctx.fill();
        }
        ctx.closePath();
    }
}

function drawControlText() {
    // alert("Draw control Start");
    //Draw coordinate values of focal points
    ctx.font = textStyle;
    ctx.fillStyle = "#000000";
    drawPointLabel("F1", focA, getLabelOffset(1));
    drawPointLabel("F2", focB, getLabelOffset(2));
    drawPointLabel("P", radCtrl, getLabelOffset(3));
    //Draw radius value
    drawRadiusLabel(focA, radCtrl, "d1");
    drawRadiusLabel(radCtrl, focB, "d2");
    //radius sum
    ctx.fillText("d1 + d2 = " + +radiusSum.toFixed(2), 20, 20);

    if(debugMode) {
        //Debug mouse pos
        var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
        ctx.font = textStyle;
        ctx.fillStyle = textColor;
        ctx.fillText(message, 10, 20);
    }
    // alert("Draw control End");
}

function drawPointLabel(text, point, offset) {
    // alert(text);
    var textLoc = add(point, offset);
    textLoc = toScreenCoords(textLoc);
    var pointRounded = new Vec2(+point.x.toFixed(2), +point.y.toFixed(2));
    ctx.fillText(text + "(" + pointRounded.x + "," + pointRounded.y + ")", textLoc.x, textLoc.y);
}

function drawRadiusLabel(point1, point2, label) {
    var dLoc = mul(add(point1, point2), 0.5);
    var dOff = new Vec2(point1.y - point2.y, point2.x - point1.x);
    dOff = mul(normalize(dOff), offsetScale * 0.5);
    dLoc = toScreenCoords(add(dLoc, dOff));
    ctx.fillText(label, dLoc.x - 10, dLoc.y);
}

function getLabelOffset(label) {
    switch (label) {
        case 1:
            return new Vec2(0, -offsetScale);
        case 2:
            return new Vec2(0, -offsetScale);
        case 3:
            return new Vec2(0, offsetScale);
        default:
            break;
    }
    return new Vec2(0, 0);
}

function getMousePos(canvas, evt) {
    var rect = canvas.getBoundingClientRect();
    return new Vec2(evt.clientX - rect.left, evt.clientY - rect.top);
}

function updateScene() {
    drawBackground();
    drawGraphGrid();
    drawEllipse();
    drawControls();
    drawControlText();
    refreshImage = false;
}

function updateControls() {

    //If already clicked move selected point
    if(mouseLClickState) {
        var freezeState = getCheckboxState("freeze");
        
        if(selection == 1 && !freezeState) {
            focA = mousePos;
        }
        else if(selection == 2 && !freezeState) {
            focB = mousePos;
        }
        else if(selection == 3) {
            if(freezeState) {
                var center = mul(add(focA, focB), 0.5);
                var position = normalize(sub(mousePos, center));
                var angle = Math.atan2(position.y, position.x);
                radCtrl = getPointOnEllipse(angle);
            }
            else {
                radCtrl = mousePos;
            }
        }

        if(selection > 0) {
            radiusSum = norm(sub(radCtrl, focA)) + norm(sub(radCtrl, focB));
            majorAxis = evalMajorAxis();
            minorAxis = evalMinorAxis();
            refreshImage = true;
        }
    }
    else {
        var current_selection = selection;
        //Check against point A
        if(checkPointonPoint(mousePos, focA)) {
            selection = 1;
        }
        else if(checkPointonPoint(mousePos, focB)) {
            selection = 2;
        }
        else if(checkPointonPoint(mousePos, radCtrl)) {
            selection = 3;
        }
        else {
            selection = 0;
        }

        if(selection > 0) {
            document.body.style.cursor = "pointer";
        }
        else {
            document.body.style.cursor = "default";
        }

        if(selection != current_selection) {
            refreshImage = true;
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

function dot(v0, v1) {
    return v0.x * v1.x + v0.y * v1.y;
}

//utils
function toScreenCoords(point) {
    const translate = new Vec2(canvas.width / 2, canvas.height / 2);
    var result = add(mul(point, zoom), translate);
    return new Vec2(result.x, canvas.height - result.y);
}

function toSceneCoords(point) {
    const translate = new Vec2(-canvas.width / 2, -canvas.height / 2);
    var result = add(point, translate);
    return new Vec2(result.x / zoom, -result.y / zoom);
}

function checkPointonPoint(point0, point1) {
    const threshold = (pointSize / zoom) * (pointSize / zoom);
    var distSq = normSq(sub(point1, point0));
    return distSq <= threshold;
}

//Event handlers
function onMouseMove(evt) {
    mousePos = toSceneCoords(getMousePos(canvas, evt));
    updateControls();
    if(refreshImage) {
        updateScene();
    }
}

function onMouseDown(evt) {
    if(evt.button == 0) {
        mouseLClickState = true;
        updateScene();
    }
}

function onTouchTap(evt) {
    mousePos = toSceneCoords(getMousePos(canvas, evt));
    updateControls();
    mouseLClickState = !mouseLClickState;
    if(refreshImage) {
        updateScene();
    }
}

function onMouseUp(evt) {
    if(evt.button == 0) {
        mouseLClickState = false;
        updateScene();
    }
}

function getCheckboxState(name) {
    var inputElement = document.getElementById(name);
    if(inputElement == null) {
        console.warn("Element not found");
    }
    return inputElement.checked;
}

function evalMajorAxis() {
    return radiusSum * 0.5;
}

function evalMinorAxis() {
    var median = mul(add(focA, focB), 0.5);
    var lenACSq = normSq(sub(median, focA));
    var halfRadSq = (radiusSum * 0.5) * (radiusSum * 0.5);
    return Math.sqrt(halfRadSq - lenACSq);
}

function getPointOnEllipse(angle) {
    var majorAxisVec = normalize(sub(focB, focA));
    var axisAngle = Math.atan2(majorAxisVec.y, majorAxisVec.x);
    var localAngle = angle - axisAngle;
    var localPos = new Vec2(majorAxis * Math.cos(localAngle), minorAxis * Math.sin(localAngle));
    var center = mul(add(focA, focB), 0.5);
    var rotatedPos = new Vec2(0, 0);
    var cosa = Math.cos(axisAngle);
    var sina = Math.sin(axisAngle);
    rotatedPos.x = cosa * localPos.x - sina * localPos.y;
    rotatedPos.y = sina * localPos.x + cosa * localPos.y;
    return add(rotatedPos, center);
}
