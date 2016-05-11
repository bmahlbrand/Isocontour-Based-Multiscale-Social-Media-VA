function intersect_arrays(arr1, arr2){
		
	var results = [];

	for (var i = 0; i < arr1.length; i++) {
		if (arr2.indexOf(arr1[i]) !== -1) {
    		results.push(arr1[i]);
		}
	}
	return results;
}

function arrAvg(arr) {
      return _.reduce(arr, function(memo, num) {
        return memo + num;
      }, 0) / (arr.length === 0 ? 1 : arr.length);
}

	
function union_arrays(x, y) {
	 var obj = {};
	for (var i = x.length-1; i >= 0; -- i)
		obj[x[i]] = x[i];
	for (var i = y.length-1; i >= 0; -- i)
		obj[y[i]] = y[i];
	var res = [];
	for (var k in obj) {
	if (obj.hasOwnProperty(k))
		res.push(obj[k]);
	}
	
	/*
	if(x.length + y.length != res.length)
	{
		alert("inter!");
	}
	*/
	return res;
}