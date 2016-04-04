ScaleTree = function(){


	this.init();
}

ScaleTree.prototype.init = function() {
	
	this.overlay_svg = d3.select(ScaleTree.div)
				    	.append("svg")
				    	.attr("id", "scaleTreeCanvas")
				    	.attr("width", ScaleTree.width)
				    	.attr("height", ScaleTree.height)
				    	;


};





ScaleTree.width = 600;
ScaleTree.height = 600;
ScaleTree.div = "#ScaleTreeView";