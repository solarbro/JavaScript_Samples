const canvas = document.getElementById(canvas_id);
//Clamp canvas width to 480
var aspect = canvas.width / canvas.height;
const maxCanvasWidth = 480;
canvas.width = Math.min(canvas.width, maxCanvasWidth);
canvas.height = canvas.width / aspect;
//acquire context
const ctx = canvas.getContext('2d');
const frameTime = 1000; //locked 16ms per frame

//Containers
function Color(r, g, b) {
    this.r = r;
    this.g = g;
    this.b = b;
}
const textColor = "#888888";
const textStyle = "10px Arial";
const pointSize = 5;

//Ellipse controls state
var focA = new Vec2(-2, 0);
var focB = new Vec2(2, 0);
var radiusSum = 6;
var radCtrl = new Vec2(0, Math.sqrt(5));

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
    canvas.addEventListener('mousemove', function(evt) {
        mousePos = toSceneCoords(getMousePos(canvas, evt));
        updateControls();
        if(refreshImage) {
            updateScene();
        }
    }, false);

    canvas.addEventListener("mousedown", function(evt) {
        if(evt.button == 0) {
            mouseLClickState = true;
            updateScene();
        }
    }, false);

    canvas.addEventListener("mouseup", function(evt) {
        if(evt.button == 0) {
            mouseLClickState = false;
            updateScene();
        }
    }, false);

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
    var majorRad = radiusSum * 0.5 * zoom;

    //Calculate minor radius
    var lenACSq = normSq(sub(median, focA));
    var halfRadSq = (radiusSum * 0.5) * (radiusSum * 0.5);
    var minorRad = Math.sqrt(halfRadSq - lenACSq) * zoom;

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
    //Draw coordinate values of focal points
    //Draw radius value
    //Major and minor axis lengths

    if(debugMode) {
        //Debug mouse pos
        var message = 'Mouse position: ' + mousePos.x + ',' + mousePos.y;
        ctx.font = textStyle;
        ctx.fillStyle = textColor;
        ctx.fillText(message, 10, 20);
    }
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
    refreshImage = true;

    //If already clicked move selected point
    if(mouseLClickState) {
        if(selection == 1) {
            focA = mousePos;
        }
        else if(selection == 2) {
            focB = mousePos;
        }
        else if(selection == 3) {
            radCtrl = mousePos;
        }

        if(selection > 0) {
            radiusSum = norm(sub(radCtrl, focA)) + norm(sub(radCtrl, focB));
        }
    }
    else {
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