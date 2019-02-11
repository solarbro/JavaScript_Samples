
const canvas = document.getElementById(canvas_id);
//Clamp canvas width to 480
var aspect = canvas.width / canvas.height;
const maxCanvasWidth = 480;
canvas.width = Math.min(canvas.width, maxCanvasWidth);
canvas.height = canvas.width / aspect;
//acquire context
const ctx = canvas.getContext('2d');
const padding = 10;

function drawArray(values) {
	//Clear
	ctx.fillStyle = "#ffffff";
	ctx.beginPath();
	ctx.rect(0, 0, canvas.width, canvas.height);
	ctx.fill();
	ctx.closePath();

	//Draw columns
	var maxHeight = 0;
	for(var i = 0; i < values.length; ++i) {
		if(values[i] > maxHeight) {
			maxHeight = values[i];
		}
	}
	var stepX = (canvas.width - 2 * padding) / values.length;
	var stepY = (canvas.height - 2 * padding) / maxHeight;

	ctx.fillStyle = "#444444";
	for(var i = 0; i < values.length; ++i) {
		ctx.beginPath();
		ctx.rect(padding + stepX * i, canvas.height - padding, stepX - padding / 2, -stepY * values[i]);
		ctx.fill();
		ctx.closePath();
	}
}

function drawBlock(column, values, color) {
	//Draw column
	var maxHeight = 0;
	for(var i = 0; i < values.length; ++i) {
		if(values[i] > maxHeight) {
			maxHeight = values[i];
		}
	}

	var stepX = (canvas.width - 2 * padding) / values.length;
	var stepY = (canvas.height - 2 * padding) / maxHeight;

	ctx.strokeStyle = color;
	ctx.lineWidth = padding / 2;
	ctx.beginPath();
	ctx.rect(padding + stepX * column, canvas.height - padding, stepX - padding / 2, -stepY * values[column]);
	ctx.stroke();
	ctx.closePath();
}