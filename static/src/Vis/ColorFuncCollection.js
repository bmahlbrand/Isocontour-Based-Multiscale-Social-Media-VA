function contourColor(){

	return d3.scale
				.linear()
				.domain([ case_study[default_case].startLevel + case_study[default_case].zoom,
					case_study[default_case].endLevel + case_study[default_case].zoom ])
				.range(["#0000ff","#ff0000"]);
}