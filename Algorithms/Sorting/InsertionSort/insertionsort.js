
var valueList = [];
const numValues = 20;
const rangeStart = 1;
const rangeEnd = 20;

const INIT_ARRAY = 0;
const START_SORT = 1
const DO_SORT = 2;
const DONE_SORT = 3;

var state = START_SORT;

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

var index = 0;
var curIndex = 0;

function sortStep()
{
	//Skip comparison 
	if(index == curIndex) {
		++index;
		setTimeout(doFunction, 200);
		return;
	}

	//Step forward
	//Check if its already in the right place
	var prevCur = curIndex - 1;
	if(prevCur < 0) {
		prevCur = 0;
	}
	var nextCur = curIndex + 1;
	if(nextCur >= numValues) {
		nextCur = numValues - 1;
	}

	var skip = false;
	if(valueList[curIndex] >= valueList[prevCur] && valueList[curIndex] <= valueList[nextCur]) {
		skip = true;
	}

	var insert = false;
	if(!skip) {
		if(valueList[index] >= valueList[curIndex]) {
			if(index > 0) {
				insert = (valueList[index - 1] <= valueList[curIndex]);
			}
			else {
				insert = true;
			}
		}
	}

	//Draw array
	drawArray(valueList);
	drawBlock(curIndex, valueList, "#008800");
	drawDivider(index, valueList, "#000000");
	
	setTimeout(doFunction, 200);

	//Reset index
	if(insert || index >= numValues) {
		//Put current value at the found location position
		var val = valueList[curIndex];
		valueList.splice(curIndex, 1);
		if(curIndex < index) {
			--index;
		}
		else {
			//Only increment if the curIndex was after 
			++curIndex;
		}
		valueList.splice(index, 0, val);
		index = 0;
		if(curIndex >= numValues) {
			state = DONE_SORT;
			index = 0;
			curIndex = 0;
		}
	}
	else if(skip) {
		++curIndex;
		index = 0;
		if(curIndex >= numValues) {
			state = DONE_SORT;
			index = 0;
			curIndex = 0;
		}
	}
	else {
		++index;
	}
}