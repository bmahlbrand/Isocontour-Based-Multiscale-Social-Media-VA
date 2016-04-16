function contourColorStroke(){

	// return d3.scale
	// 			.linear()
	// 			.domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
	// 				case_study[default_case].endLevel + case_study[default_case].zoom ])
	// 			.range(["#0000ff","#ff0000"]);

	//diverging from blue to red;
	//var color = ["#034e7b", "#3690c0", "#66ccff", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
	//constant color;
	var color = ["#3182bd"];

	var q = d3.scale.quantize().domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
										case_study[default_case].endLevel + case_study[default_case].zoom ])
								.range(color);
	return q;
}

function contourColorFill(){

	var color = null;
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSINGLE)
		color = ["#9ecae1"];
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSEQUENTIAL)
		color = ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c'];
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.BOUND)
		color = ["none"];

	//diverging from blue to red;
	//var color = ["#034e7b", "#3690c0", "#66ccff", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
	//sequential;
	//var color = ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c'];
	//constant color;
	//var color = ["#9ecae1"];

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