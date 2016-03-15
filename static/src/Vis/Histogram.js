if(!d3.chart) d3.chart = {};

d3.chart.histogram = function(width, height) {
	var g;
	var data;
	var width = 300;
	var height = 100;
	var cx = 10;
	var numberBins = 10;
	var dispatch = d3.dispatch(chart, "hover");
	// A formatter for counts.
	var formatCount = d3.format(",.0f");
	var margin = {top: 10, right: 30, bottom: 30, left: 30},
		width = 260 - margin.left - margin.right,
		height = 175 - margin.top - margin.bottom;

	var xScale;
	var yScale;

	var brush;

	// var dispatch = d3.dispatch(update, 'filter');

	function chart(container) {
		g = container;
		update();
	}

	chart.update = update;
	
	// function refreshHistogram(clusterData) {
	// 	data = clusterData;
	// 	upate();
	// }

	function update() {
		// calculateBinCount();

		var hist = d3.layout.histogram()
			.value(function(d) { return d.score })
			.range([0, d3.max(data, function(d){ return d.score }) ])
			.bins(numberBins);

		var layout = hist(data);

		var maxLength = d3.max(layout, function(d) { return d.length });

		// var xScale = d3.scale.linear()
		xScale = d3.scale.ordinal()
			.domain(d3.range(numberBins))
			.rangeBands([0, width], 0.3);
			// .domain(d3.range(numberBins))
			// .domain([0, maxLength])
			// .range([0, width]);

		// var yScale = d3.scale.ordinal()
		yScale = d3.scale.linear()
			.domain([0, maxLength])
			.range([0, height]);
			// .rangeBands([height, 0], 0.3);

		var colorScale = d3.scale.category10();
		brush = d3.svg.brush()
		 		.x(xScale)
		 		.on("brush", brushed);
		brush(g);
 		
 		// g.attr("class", "brush")
		 	// .call(brush);
			// .selectAll('rect');
		 	// .attr('height', height);
		var rects = g.selectAll("rect").data(layout)
		
		rects.enter().append("rect")

		rects
		.transition()
		.attr({
			y: function(d,i) {
				return yScale(d.length)
			},
			x: function(d,i) {
				return xScale(i)
			},
			height: 50,
			// function(d) { return height - y(maxLength); }
			// function(d,i) {
			// 	return yScale(d.length)
			// },
			width: xScale.rangeBand(),
			// function(d,i) {
				// return xScale(d.length)
			// },
			fill: function(d, i) { return colorScale(i) }
		})
		rects.exit().transition().remove();

		rects.on("mouseover", function(d) {
			d3.select(this).style("fill", "orange")
			// console.log("hist over", d)
			dispatch.hover(d)
		})
		rects.on("mouseout", function(d) {
			d3.select(this).style("fill", "")
			dispatch.hover([])
		})
		// brush.on()
	}

	function brushed() {
		xScale.domain(brush.extent());
		// focus.select(".area").attr("d", area);
		// focus.select(".x.axis").call(xAxis);
	}

	// function calculateBinCount() {
	// 	var clusterSize = document.getElementById("clusterSize");
	// 	numberBins = d.length / clusterSize;
	// }
	
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