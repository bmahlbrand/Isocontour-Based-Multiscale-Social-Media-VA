ScaleTreeCanvas = function(){

	this.canvas = null;

	this.init();
}

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

	var that = this;
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
	                            .on("click", function(){
	                            	alert(this.id);
	                            })
	                            // .on("mouseover", function(){
	                            // 	$('[ng-controller="app_controller"]').scope().addHlNode(id);
	                            // })
	                            // .on("mouseout", function(){
	                            // 	$('[ng-controller="app_controller"]').scope().removeHlNode(id);
	                            // })
	                            .on('contextmenu', d3.contextMenu(that.get_menu(id)) );
};

ScaleTreeCanvas.prototype.get_menu = function(id){

	var that = this;

	var menu = [
		{
			title: 'set',
			action: function(elm, d) {
	            
	            $('[ng-controller="app_controller"]').scope().addHlNode(id);

	   //          var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes(id);
				// //update map;
	   //      	$('[ng-controller="map_controller"]').scope().getHulls().hoverHull(hlNodes);

	   //      	that.update();
			}
		},
		{
			title: 'unset',
			action: function(elm, d) {

				$('[ng-controller="app_controller"]').scope().removeHlNode(id);
            	// //update map;
            	// $('[ng-controller="map_controller"]').scope().getHulls().hoverHull([]);

            	// that.update();
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

	var acNodes = $('[ng-controller="app_controller"]').scope().getAcNodes();
	var hlNodes = $('[ng-controller="app_controller"]').scope().getHlNodes();


	d3.selectAll(".treeNode")
		.attr("stroke", ScaleTreeCanvas.deAcNodeStroke)
		.attr("fill", ScaleTreeCanvas.deAcNodeFill);

	acNodes.forEach(function(val){
		
		d3.select("#node_"+val)
			.attr("stroke", ScaleTreeCanvas.nodeStroke)
			.attr("fill", ScaleTreeCanvas.nodeFill);
	});

	hlNodes = intersect_arrays(acNodes, hlNodes);

	hlNodes.forEach(function(val){
		
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