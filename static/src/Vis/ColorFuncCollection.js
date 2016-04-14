function contourColor(){

	// return d3.scale
	// 			.linear()
	// 			.domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
	// 				case_study[default_case].endLevel + case_study[default_case].zoom ])
	// 			.range(["#0000ff","#ff0000"]);

	//diverging from blue to red;
	//var color = ["#d73027", "#fc8d59", "#fee090", "#ffffbf", "#e0f3f8", "#91bfdb", "#4575b4"];
	var color = ["#034e7b", "#3690c0", "#66ccff", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];

	var q = d3.scale.quantize().domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
										case_study[default_case].endLevel + case_study[default_case].zoom ])
								.range(color);
	return q;

}

function statColor(){

	var color = ['#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e'];
	
	var q = d3.scale.quantize().domain([0, 1]).range(color);
	return q;
}