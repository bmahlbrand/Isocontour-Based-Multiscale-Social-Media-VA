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
			    	.attr("id", "ScaleTreeCanvas")
			    	.attr("width", ScaleTreeCanvas.width)
			    	.attr("height", ScaleTreeCanvas.height)
			    	;
};

ScaleTreeCanvas.prototype.render = function(){

	var level = this.dataRoot.getHeight();
	var spaceBtLevels = Math.floor((ScaleTreeCanvas.height - level*ScaleTreeCanvas.nodeHeight) / (level-1));

	console.log(level + "\t" + spaceBtLevels);

};

ScaleTreeCanvas.width = 600;
ScaleTreeCanvas.height = 600;
ScaleTreeCanvas.nodeHeight = 50;
ScaleTreeCanvas.div = "#ScaleTreeCanvasView";