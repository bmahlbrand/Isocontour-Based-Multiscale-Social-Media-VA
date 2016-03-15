HistogramManager = function() {
	var data = mock_data.data.children;
	var display = d3.select("#histView");
	var svg = d3.select('#hist');
	
	var hgroup = svg.append("g")
	var histogram = d3.chart.histogram();
	histogram.data(data);
	histogram(hgroup);
};

HistogramManager.prototype.init = function(distribution) {
	
}