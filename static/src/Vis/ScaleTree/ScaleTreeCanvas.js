ScaleTreeCanvas = function(){

	this.canvas = null;

	//this array contains nodes that are in the scope of map.
	//this array can only be modified by the topic_lense class.
	this.activatedNodes = [];
	//this array contains array that is in the subtree of clicked node;
	//this array can only be modified by this class;
	//only store this root of the subtree;
	this.highlightedNodes = [];

	this.init();
}

ScaleTreeCanvas.prototype.setAcNodes = function(val){
	this.activatedNodes = val;
};

ScaleTreeCanvas.prototype.addHLNode = function(val){
	this.highlightedNodes.push(val);
};

ScaleTreeCanvas.prototype.removeHLNode = function(val){
	this.highlightedNodes = this.highlightedNodes.filter(function(_val){ return val != _val; });
};

ScaleTreeCanvas.prototype.getHLNodes = function(){

	var ids = [];
	this.highlightedNodes.forEach(function(val){

		var node = DataCenter.instance().getTree().getNodeById(val);
		var list = node.toList();
		var _ids = list.map(function(_val){ return _val.cluster.clusterId; });
	    ids = ids.concat(_ids);
	});
	return ids;

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

	var level = DataCenter.instance().getTree().getHeight();
	var spaceBtLevels = Math.floor((ScaleTreeCanvas.height - level*ScaleTreeCanvas.nodeHeight) / (level-1));

	//initial bbox;
	var bbox = new BBox(ScaleTreeCanvas.width/2, ScaleTreeCanvas.nodeHeight/2, ScaleTreeCanvas.width/2, ScaleTreeCanvas.nodeHeight/2);
	DataCenter.instance().getTree().setBbox(bbox, spaceBtLevels);

};

ScaleTreeCanvas.prototype.drawRect = function(id, bbox){

	//add margin between adjacent nodes;
	var margin = 2;
	var _bbox = new BBox();
	_bbox.setBox(bbox);
	_bbox.setExtents( Math.max(_bbox.get_extent().x-margin, 1), _bbox.get_extent().y );

	//draw node;
	var rectangle = this.canvas.append("rect")
								.attr("id", "node_"+id)
								.attr("class", "treeNode")
	                            .attr("x", _bbox.getLeft())
	                            .attr("y", _bbox.getTop())
	                            .attr("width", _bbox.getWidth())
	                            .attr("height", _bbox.getHeight())
	                            .attr("stroke", ScaleTreeCanvas.nodeStroke)
	                            .attr("fill", ScaleTreeCanvas.nodeFill)
	                            .on('contextmenu', d3.contextMenu(ScaleTreeCanvas.instance().get_menu(id)) );
};

ScaleTreeCanvas.prototype.get_menu = function(id){

	var menu = [
		{
			title: 'set',
			action: function(elm, d) {
	            
	            ScaleTreeCanvas.instance().addHLNode(id);
				//update map;
	        	$('[ng-controller="map_controller"]').scope().get_first_lense().hoverHull(ScaleTreeCanvas.instance().getHLNodes());

	        	ScaleTreeCanvas.instance().update();
			}
		},
		{
			title: 'unset',
			action: function(elm, d) {

				ScaleTreeCanvas.instance().removeHLNode(id);
            	//update map;
            	$('[ng-controller="map_controller"]').scope().get_first_lense().hoverHull([]);

            	ScaleTreeCanvas.instance().update();
			}
		},
		{
			title: 'cancel',
			action: function(elm, d, i) {
			}
		}
	];

	return menu;

};

ScaleTreeCanvas.prototype.drawBCurve = function(pts){

	var lineFunction = d3.svg.line()
		                      .x(function(d) { return d[0]; })
		                      .y(function(d) { return d[1]; })
		                      .interpolate("basis");
    
    var lineGraph = this.canvas.append("path")
    							.attr("class", "treeLinkage")
		                        .attr("d", lineFunction(pts))
		                        .attr("stroke", ScaleTreeCanvas.linkStroke)
		                        .attr("stroke-width", 1)
		                        .attr("fill", "none")
		                        .attr("opacity", 0.5);

};

ScaleTreeCanvas.prototype.drawNode = function(){

	var that = this;
	this.setBbox();
	DataCenter.instance().getTree().drawBbox();

	this.hoverNode();

};

ScaleTreeCanvas.prototype.hoverNode = function(){

	//this.activatedNodes = [];
	//this.highlightedNodes = [];

	d3.selectAll(".treeNode")
		.attr("stroke", ScaleTreeCanvas.deAcNodeStroke)
		.attr("fill", ScaleTreeCanvas.deAcNodeFill);

	this.activatedNodes.forEach(function(val){
		
		d3.select("#node_"+val)
			.attr("stroke", ScaleTreeCanvas.nodeStroke)
			.attr("fill", ScaleTreeCanvas.nodeFill);
	});

	var hLnodes = intersect_arrays(this.activatedNodes, this.getHLNodes());

	hLnodes.forEach(function(val){
		
		d3.select("#node_"+val)
			.attr("stroke", ScaleTreeCanvas.hLNodeStroke)
			.attr("fill", ScaleTreeCanvas.hLNodeFill);
	});


};


ScaleTreeCanvas.prototype.drawLinkage = function(){

	DataCenter.instance().getTree().drawLinkage();

	this.hoverLinkage();
};

ScaleTreeCanvas.prototype.hoverLinkage = function(){

};

ScaleTreeCanvas.prototype.update = function(){

	//clear canvas;
	this.canvas.selectAll("*").remove();

	this.drawNode();
	this.drawLinkage();

	console.log("render done");

};

ScaleTreeCanvas.width = 600;
ScaleTreeCanvas.height = 600;
ScaleTreeCanvas.nodeHeight = 40;
ScaleTreeCanvas.div = "#ScaleTreeCanvasView";


ScaleTreeCanvas.hLNodeStroke = "#313695";
ScaleTreeCanvas.hLNodeFill = "#abd9e9";

ScaleTreeCanvas.nodeStroke = "#4575b4";
ScaleTreeCanvas.nodeFill = "#e0f3f8";

ScaleTreeCanvas.deAcNodeStroke = "#737373";
ScaleTreeCanvas.deAcNodeFill = "#f7f7f7";


ScaleTreeCanvas.linkStroke = "#b2182b";


/***********************************************************************************/

ScaleTreeCanvas.the_instace = null;

ScaleTreeCanvas.instance = function(){

	if(ScaleTreeCanvas.the_instace == null)
		ScaleTreeCanvas.the_instace = new ScaleTreeCanvas();
	return ScaleTreeCanvas.the_instace;

};


function intersect_arrays(arr1, arr2){
		
	var results = [];

	for (var i = 0; i < arr1.length; i++) {
		if (arr2.indexOf(arr1[i]) !== -1) {
    		results.push(arr1[i]);
		}
	}
	return results;
}