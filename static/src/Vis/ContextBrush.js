HistogramBrush = function() {

};

HistogramBrush.prototype.update = function(data) {
	d3.select("#histView").selectAll("*").remove();

	d3.select("#histView").style("visibility", "visible");
	var margin = { top: 30, right: 30, bottom: 30, left: 30 },
	width = 250 - margin.left - margin.right,

	// width = $("#histView").width() - margin.left - margin.right;
	
	// width = width > 0 ? width : 250 - margin.left - margin.right;
	
	// $("#histView").width() - margin.left - margin.right : 250 - margin.left - margin.right,
	height = 175 - margin.top - margin.bottom;
	// height = $("#histView").height() - margin.top - margin.bottom
	// height = height > 0 ? height : 175 - margin.top - margin.bottom;

	// var parseDate = d3.time.format("%b %Y").parse;
	var x = d3.scale.linear().range([1, width]),
	// var x = d3.time.scale().range([0, width]),
		y = d3.scale.linear().range([height, 0]);

	var xAxis = d3.svg.axis().scale(x).orient("bottom");
	var yAxis = d3.svg.axis().scale(y).orient("left");



	x.domain([1, data.max_x]);
	y.domain([0, data.max_y]);

	var brush = d3.svg.brush()
			.x(x)
			.on("brushend", brushend);

	svg = d3.select("#histView").append("svg")
			.attr("width", width + margin.left + margin.right)
			.attr("height", height + margin.top + margin.bottom);

	svg.append("defs").append("clipPath")
			.attr("id", "clip")
			.append("rect")
			.attr("width", width)
			.attr("height", height);

	var context = svg.append("g")
			.attr("class", "context")
			.attr("transform", "translate(" + margin.left + "," + margin.top + ")");
	
	var area = d3.svg.area()
			
			.x(function(d) { return x(d.x); })
			.y0(height)
			.y1(function(d) { return y(d.y); })
			.interpolate("monotone");

	context.append("path")
			.datum(data.data)
			.attr("class", "area")
			.attr("d", area);

	context.append("g")
			.attr("class", "x axis")
			.attr("transform", "translate(0," + height + ")")
			.call(xAxis);
	
	context.append("g")
			.attr("class", "y axis")
			.call(yAxis);

	//dist array is empty;
	if(data.valid == false)
		return;
	
	context.append("g")
			.attr("class", "x brush")
			.call(brush)
			// .call(brush.event)
		.selectAll("rect")
			.attr("y", -6)
			.attr("height", height + 7);

	context.append("text")
      .attr("class", "title")
      .attr("x", width / 2)
      .attr("y", 0 - (margin.top / 2))
      .attr("text-anchor", "middle")
      .text("Cluster Distribution");

	function brushend() {
		if (!d3.event.sourceEvent) return;
		
		x.domain(brush.empty() ? x.domain() : brush.extent());
		
		var extent = brush.extent();
		extent[0] = Math.floor(extent[0]) > 0 ? Math.floor(extent[0]) : 1;
		extent[1] = Math.ceil(extent[1]) < data.max_x ? Math.ceil(extent[1]) : data.max_x;

		// d3.select(this).transition()
	 //      .call(brush.extent(extent))
	 //      .call(brush.event);

		$('[ng-controller="map_controller"]').scope().refresh_map(extent[0], extent[1]);

		console.log("brush domain" + Math.floor(x.domain()[0]) +  " " + Math.round(x.domain()[1]));
		console.log("brushend extent" + extent[0] +  " " + extent[1]);
	}
};