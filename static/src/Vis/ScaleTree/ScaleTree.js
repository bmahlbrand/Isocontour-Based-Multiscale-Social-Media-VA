ScaleTree = function(){

	this.canvas = null;
	this.dataRoot = null;
	this.init();
}

ScaleTree.prototype.setData = function(val){
	this.dataRoot = val;
};

ScaleTree.prototype.init = function() {
	
	this.canvas = d3.select(ScaleTree.div)
			    	.append("svg")
			    	.attr("id", "scaleTreeCanvas")
			    	.attr("width", ScaleTree.width)
			    	.attr("height", ScaleTree.height)
			    	;
};

ScaleTree.prototype.render = function(){

	var level = this.dataRoot.getHeight();
	var spaceBtLevels = Math.floor((ScaleTree.height - level*ScaleTree.nodeHeight) / (level-1));

	console.log(level + "\t" + spaceBtLevels);

};

ScaleTree.width = 600;
ScaleTree.height = 600;
ScaleTree.nodeHeight = 50;
ScaleTree.div = "#ScaleTreeView";