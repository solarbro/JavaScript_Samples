
function fillRandomArray(count, rangeStart, rangeEnd) {
	var values = [];
	for(var i = 0; i < count; ++i) {
		var val = rangeStart + Math.floor(Math.random() * (rangeEnd - rangeStart));
		values.push(val);
	}
	return values;
}