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