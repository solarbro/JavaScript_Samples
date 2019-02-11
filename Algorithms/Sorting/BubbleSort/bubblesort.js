
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
var swapsMade = 0;

function sortStep()
{
	var needSwap = false;
	//Do sorting logic
	if(valueList[index] > valueList[index + 1]) {
		needSwap = true;
		++swapsMade;
	}

	//draw array
	var color = needSwap ? "#990000" : "#009900";
	drawArray(valueList);
	drawBlock(index, valueList, color);
	drawBlock(index + 1, valueList, color);

	if(needSwap) {
		//Extra swapping animation
		var tmp = valueList[index];
		valueList[index] = valueList[index + 1];
		valueList[index + 1] = tmp;
		// setTimeout(delayDraw(index), 1000);
	}
	setTimeout(doFunction, 200);

	//Reset index
	++index;
	if(index >= numValues - 1) {
		//If no swaps were made, we're done sorting
		if(swapsMade == 0) {
			state = DONE_SORT;
		}
		index = 0;
		swapsMade = 0;
	}
}