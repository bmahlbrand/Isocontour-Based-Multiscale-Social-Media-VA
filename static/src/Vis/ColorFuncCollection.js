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

	var q = d3.scale.quantize().domain([ profile.startLevel + profile.zoom,
										profile.endLevel + profile.zoom ])
								.range(color);
	return q;
}

function contourColorFill(){

	var greys = colorbrewer['Greys'][7];
	var blues = ['#eff3ff','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#084594'];

	var color = null;
	if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSINGLE)
		color = ["#9ecae1"];
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.FILLSEQUENTIAL || ContourVis.CONTOUR == ContourVis.CONTOURMODE.STATSCORE )
		color = blues;
	else if(ContourVis.CONTOUR == ContourVis.CONTOURMODE.BOUND)
		color = ["none"];

	//diverging from blue to red;
	//var color = ["#034e7b", "#3690c0", "#66ccff", "#fcae91", "#fb6a4a", "#de2d26", "#a50f15"];
	//sequential;
	//var color = ['#f7fbff','#deebf7','#c6dbef','#9ecae1','#6baed6','#4292c6','#2171b5','#08519c'];
	//constant color;
	//var color = ["#9ecae1"];

	var q = d3.scale.quantize().domain([ profile.startLevel + profile.zoom,
										profile.endLevel + profile.zoom ])
								.range(color);
	return q;
}

// function statColor(){

// 	//divergent color scheme
// 	//var color = ['#8c510a','#bf812d','#dfc27d','#f6e8c3','#f5f5f5','#c7eae5','#80cdc1','#35978f','#01665e'];
// 	var color = ['#fbb4ae','#b3cde3','#ccebc5','#decbe4'];
// 	color.unshift('#aaaaaa');
	
// 	var q = d3.scale.quantize().domain([-1, 3]).range(color);
// 	return q;
// }


function divergentColorList(){
	//light
	// return ['#8dd3c7','#ffffb3','#bebada','#fb8072','#80b1d3','#fdb462','#b3de69','#fccde5','#d9d9d9'];
	//lighter
	//return ['#fbb4ae','#b3cde3','#ccebc5','#decbe4','#fed9a6','#ffffcc','#e5d8bd','#fddaec','#f2f2f2'];
	//dark
	//return ['#e41a1c','#377eb8','#4daf4a','#984ea3','#ff7f00','#ffff33','#a65628','#f781bf','#999999'];

	//modified:
	//var set3 = ["#ffffb3", "#fb8072", "#8dd3c7", "#bc80bd"]
	var color = ["#e41a1c", "#ff7f00", "#f781bf", "#4daf4a"];
	//https://bl.ocks.org/mbostock/5577023
	//return colorbrewer['Set3'][8];
	return color;
}

//two normalized vectors (the sum of array is 1), their distance is less or equal to 1
//0 maps to light color, 1 maps to 
function variaceColor(){

	return d3.scale.linear()
					.domain([0, 0.3, 1])
					.range(['#fff5f0', '#fee0d2', '#ef3b2c']);
}