ScaleTreeCanvas = function(){

	this.canvas = null;
	this.dataRoot = null;
	this.init();
}

ScaleTreeCanvas.prototype.setData = function(val){
	this.dataRoot = val;
};

ScaleTreeCanvas.prototype.init = function() {
	
	this.canvas = d3.select(ScaleTreeCanvas.div)
			    	.append("svg")
			    	.attr("id", "ScaleTreeCanvasSvg")
			    	.attr("width", ScaleTreeCanvas.width)
			    	.attr("height", ScaleTreeCanvas.height)
			    	;
};

ScaleTreeCanvas.prototype.setBbox = function(){

	var level = this.dataRoot.getHeight();
	var spaceBtLevels = Math.floor((ScaleTreeCanvas.height - level*ScaleTreeCanvas.nodeHeight) / (level-1));

	console.log(level + "\t" + spaceBtLevels);

	//initial bbox;
	var bbox = new BBox(ScaleTreeCanvas.width/2, ScaleTreeCanvas.nodeHeight/2, ScaleTreeCanvas.width/2, ScaleTreeCanvas.nodeHeight/2);
	this.dataRoot.setBbox(bbox, spaceBtLevels);

};

ScaleTreeCanvas.prototype.drawRect = function(id, bbox){

	var rectangle = this.canvas.append("rect")
								.attr("id", id)
	                            .attr("x", bbox.getLeft())
	                            .attr("y", bbox.getTop())
	                            .attr("width", bbox.getWidth())
	                            .attr("height", bbox.getHeight())
	                            .attr("stroke", "#555")
	                            .attr("fill", "#aaa")
	                            .on("mouseover", function(){

	                            	$('[ng-controller="map_controller"]').scope().get_first_lense().hoverHull([id]);

	                            })
	                            .on("mouseout", function(){

	                            	$('[ng-controller="map_controller"]').scope().get_first_lense().hoverHull([]);

	                            });

};

ScaleTreeCanvas.prototype.renderBbox = function(){

	var that = this;
	this.setBbox();

	var rst = [];
	this.dataRoot.getNodesByLevels(0, rst);

	var bboxes = [];
	rst.forEach(function(arr){
		arr.forEach(function(val){
			bboxes.push([val.cluster.clusterId, val.getVis().getBbox()]);
		});
	});

	bboxes.forEach(function(val){
		that.drawRect(val[0], val[1]);
	});

	console.log("render bbox done");

};

ScaleTreeCanvas.prototype.render = function(){

	this.renderBbox();
	console.log("render done");

};

ScaleTreeCanvas.width = 600;
ScaleTreeCanvas.height = 600;
ScaleTreeCanvas.nodeHeight = 50;
ScaleTreeCanvas.div = "#ScaleTreeCanvasView";