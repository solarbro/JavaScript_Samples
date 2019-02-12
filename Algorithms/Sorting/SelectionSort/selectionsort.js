
var valueList = [];
const numValues = 20;
const rangeStart = 1;
const rangeEnd = 20;

const INIT_ARRAY = 0;
const START_SORT = 1
const DO_SORT = 2;
const DONE_SORT = 3;

var state = START_SORT;

// drawArray(valueList);
// drawBlock(2, valueList, "#008800");
init();

function init() {
	//Fill random array
	valueList = fillRandomArray(numValues, rangeStart, rangeEnd);
	//Draw initial array
	drawArray(valueList);
}

function doFunction() {
    var button = document.getElementById("Control");
	switch(state){
	case INIT_ARRAY:
		valueList = fillRandomArray(numValues, rangeStart, rangeEnd);
		//Eval dimensions once
		for(var i = 0; i < numValues; ++i) {
			if(valueList[i] > maxHeight) {
				maxHeight = valueList[i];
			}
		}
		button.value = "Sort";
		drawArray(valueList);
		state = START_SORT;
		break;
	case START_SORT:
		button.disabled = true;
		state = DO_SORT;
		requestAnimationFrame(sortStep);
		break;
	case DO_SORT:
		requestAnimationFrame(sortStep);
		break;
	case DONE_SORT:
		button.disabled = false;
		button.value = "Restart";
		state = INIT_ARRAY;
		//Draw again to remove the highlights
		drawArray(valueList);
		break;
	}
}

var index = 0
var smallest = Infinity;
var smallestIndex = 0;
var sortHead = 0;

var maxHeight = 0;
var stepX = (canvas.width - 2 * padding) / numValues;
var stepY = (canvas.height - 2 * padding) / maxHeight;

function sortStep()
{
	//Step forward
	if(valueList[index] < smallest) {
		smallest = valueList[index];
		smallestIndex = index;
	}

	//Draw array
	drawArray(valueList);
	drawBlock(index, valueList, "#004400");
	drawBlock(smallestIndex, valueList, "#008800");

	//Draw divider
	ctx.strokeStyle = "#000000";
	ctx.lineWidth = padding / 4;
	ctx.beginPath();
	ctx.moveTo(padding * 0.75 + stepX * sortHead, 0);
	// ctx.moveTo(0, 0);
	ctx.lineTo(padding * 0.75 + stepX * sortHead, canvas.height);
	// ctx.lineTo(canvas.width, canvas.height);
	ctx.stroke();
	ctx.closePath();
	
	setTimeout(doFunction, 200);

	//Reset index
	++index;
	if(index >= numValues) {
		//Put smallest value at sort head
		valueList.splice(smallestIndex, 1);
		valueList.splice(sortHead, 0, smallest);
		++sortHead;
		//Rest search index
		index = sortHead;
		smallest = Infinity;
		smallestIndex = index;
		if(sortHead >= numValues) {
			state = DONE_SORT;
			index = 0;
			sortHead = 0;
			smallestIndex = 0;
		}
	}
}