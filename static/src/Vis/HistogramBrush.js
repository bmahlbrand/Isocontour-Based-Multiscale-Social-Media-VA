if(!d3.chart) d3.chart = {};

d3.chart.brush = function() {
	var width;
	var height;

	var brush = d3.svg.brush()
			.x(x2)
			.on("brush", brushed);

	function brushed() {
		x.domain(brush.empty() ? x2.domain() : brush.extent());
		focus.select(".area").attr("d", area);
		focus.select(".x.axis").call(xAxis);
	}

	chart.data = function(value) {
		if(!arguments.length) return data;
		data = value;
		return chart;
	}

	chart.width = function(value) {
		if(!arguments.length) return width;
		width = value;
		return chart;
	}
	
	chart.height = function(value) {
		if(!arguments.length) return height;
		height = value;
		return chart;
	}

	return d3.rebind(chart, dispatch, "on");
}